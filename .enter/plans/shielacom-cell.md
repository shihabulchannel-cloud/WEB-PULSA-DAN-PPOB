# SHIELACOM CELL — Full Upgrade Plan

## Context
Menambah 12 fitur baru ke website SHIELACOM CELL. Semua penambahan bersifat ADDITIVE (tidak mengubah Digiflazz, Duitku, transaksi publik, database produk yang ada).

## Yang Sudah Ada (JANGAN DIUBAH)
- `resellers`, `reseller_balances`, `reseller_balance_history`, `reseller_deposits`, `reseller_prices`, `reseller_applications` tables
- Reseller portal: `/reseller/login`, `/reseller/dashboard`, `/reseller/deposit`, `/reseller/transactions`, `/reseller/profile`
- Admin reseller pages: `Resellers.tsx`, `ResellerApplications.tsx`, `ResellerDeposits.tsx`
- Edge functions: `create-reseller` (action: create/adjust_balance/reset_password), `reseller-deposit-action`
- Storage bucket: `reseller-deposits`

---

## STEP 1 — DATABASE MIGRATION (SAFE, ADD-ONLY)

```sql
-- 1. Tambah kolom reseller_price ke products
ALTER TABLE products ADD COLUMN IF NOT EXISTS reseller_price numeric DEFAULT 0;

-- 2. Set reseller_price = sell_price where 0
UPDATE products SET reseller_price = sell_price WHERE reseller_price = 0 OR reseller_price IS NULL;

-- 3. wallet_transactions table (unified mutation log)
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  reseller_id uuid REFERENCES resellers(id),
  type text CHECK (type IN ('deposit','transfer','purchase','refund')),
  amount numeric NOT NULL,
  balance_before numeric DEFAULT 0,
  balance_after numeric DEFAULT 0,
  description text,
  reference_id text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
-- Admins see all, resellers see own
CREATE POLICY "Admins manage wallet_transactions" ON wallet_transactions FOR ALL USING (auth.role()='authenticated');
CREATE POLICY "Resellers read own wallet" ON wallet_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM resellers r WHERE r.id = reseller_id AND r.user_id = auth.uid())
);

-- 4. Storage bucket: site-images (logo, banner, category, product images)
INSERT INTO storage.buckets (id, name, public) VALUES ('site-images','site-images',true) ON CONFLICT DO NOTHING;
CREATE POLICY "Authenticated upload site images" ON storage.objects FOR INSERT WITH CHECK (bucket_id='site-images' AND auth.role()='authenticated');
CREATE POLICY "Public read site images" ON storage.objects FOR SELECT USING (bucket_id='site-images');
CREATE POLICY "Authenticated delete site images" ON storage.objects FOR DELETE USING (bucket_id='site-images' AND auth.role()='authenticated');

-- 5. Add reseller_id to transactions (SAFE ADD)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reseller_id uuid REFERENCES resellers(id);

-- 6. Settings keys for deposit bank info (if not already exists)
INSERT INTO settings (key, value) VALUES
  ('deposit_bank_name',''), ('deposit_account_number',''),
  ('deposit_account_name',''), ('deposit_qris_url','')
ON CONFLICT (key) DO NOTHING;
```

---

## STEP 2 — REUSABLE IMAGE UPLOADER COMPONENT

**File: `src/components/ImageUploader.tsx`**
- Props: `bucket`, `value` (current URL), `onChange(url)`, `accept?`, `maxMB?`, `folder?`
- Displays: thumbnail preview if value exists, or upload area
- On file select: uploads to `supabase.storage.from(bucket).upload(path, file)` → gets public URL → calls `onChange(url)`
- Delete button clears the URL
- Shows progress/loading state
- Supports: JPG, JPEG, PNG, WEBP — max 5MB

---

## STEP 3 — UPDATE ADMIN PAGES WITH IMAGE UPLOAD

### 3a. `src/pages/admin/Banners.tsx`
- Replace `<Input type="text" placeholder="https://...">` for `image_url` field
- Add `<ImageUploader bucket="site-images" folder="banners" value={form.image_url} onChange={url => setForm(...)} />`

### 3b. `src/pages/admin/Settings.tsx`
- Replace `site_logo_url` and `site_favicon_url` text inputs with `<ImageUploader bucket="site-images" folder="settings" .../>`
- Keep all other settings fields untouched (DO NOT touch Digiflazz/Duitku sections)

### 3c. `src/pages/admin/Categories.tsx`
- `categories` table ALREADY HAS `image_url` column ✅
- Just add `<ImageUploader bucket="site-images" folder="categories" />` to the form

### 3d. `src/pages/admin/Products.tsx`
- Add `image_url` upload field
- Add `reseller_price` field (new column from Step 1)
- Keep all existing Digiflazz sync logic INTACT

### 3e. `src/pages/admin/Blog.tsx` + `Testimonials.tsx`
- Replace URL text input with `<ImageUploader />`

---

## STEP 4 — UPDATE EDGE FUNCTION: create-reseller

Add `action: 'transfer'` (same as adjust_balance but records to wallet_transactions table too):
```typescript
if (action === 'transfer') {
  // adjust_balance + insert into wallet_transactions with type='transfer'
}
```
Also update `action: 'adjust_balance'` to also insert into `wallet_transactions`.

---

## STEP 5 — NEW EDGE FUNCTION: reseller-transaction

**File: `supabase/functions/reseller-transaction/index.ts`**
- Receives: `reseller_id`, `product_id`, `target_id`, `customer_name`, `customer_email`
- Checks reseller balance >= product.reseller_price
- If insufficient: return error "Saldo tidak mencukupi"
- Deducts balance from reseller_balances
- Calls Digiflazz API directly (same pattern as digiflazz-transaction — but this is a NEW function, not modifying the existing one)
- Records into `transactions` table with `reseller_id` field
- Records into `wallet_transactions` with type='purchase'
- Returns transaction result

> ⚠️ NOTE: transactions table needs `reseller_id` column added safely.

---

## STEP 6 — RESELLER PORTAL ENHANCEMENTS

### 6a. `src/components/layout/ResellerLayout.tsx`
Add nav items:
- `Produk` → `/reseller/products` (ShoppingCart icon)
- `Mutasi Saldo` → `/reseller/balance` (ArrowLeftRight icon)

### 6b. `src/pages/reseller/Dashboard.tsx` — Enhanced
- 4 stat cards: Saldo Saat Ini, Total Deposit (sum approved), Total Transaksi (count), Pembelian Bulan Ini
- Area chart (recharts AreaChart) showing transaction activity last 7 days
- Recent balance history (already there)

### 6c. NEW `src/pages/reseller/Products.tsx`
- Fetch all active products with `reseller_price`
- Search by name
- Card layout: name, brand, reseller_price
- "Beli" button → opens checkout modal
- Checkout modal: input target_id, customer info → calls `reseller-transaction` edge function
- Shows result: sukses/gagal

### 6d. NEW `src/pages/reseller/Balance.tsx`
- Shows wallet_transactions for current reseller
- Filter: All / deposit / transfer / purchase / refund
- Table: tanggal, type, deskripsi, nominal (+ credit / - debit), saldo sesudah

---

## STEP 7 — ADMIN RESELLER ENHANCEMENTS

### 7a. `src/pages/admin/Resellers.tsx`
- Rename "Kelola Saldo" dialog title → "Transfer Saldo"
- Add "type" selector (sekarang sudah ada: credit/debit)
- After save, record to `wallet_transactions` (via updated edge function)

### 7b. Add `/admin/wallet-transactions` page (NEW)
- Shows all wallet_transactions for all resellers
- Filter by reseller, type, date range

### 7c. Add route + AdminLayout nav item for wallet transactions

---

## STEP 8 — SECURITY VERIFICATION
- ProtectedRoute: `isAdmin` check → admin pages stay admin-only ✅
- ProtectedResellerRoute: `isReseller || isAdmin` → reseller portal ✅
- Reseller has NO routes to admin pages
- Verify Products.tsx, Settings.tsx sections for Digiflazz/Duitku are read-only (not removed)

---

## FILES TO MODIFY
| File | Change |
|------|--------|
| `src/components/ImageUploader.tsx` | NEW |
| `src/pages/admin/Banners.tsx` | Add ImageUploader for image_url |
| `src/pages/admin/Settings.tsx` | Add ImageUploader for logo/favicon only |
| `src/pages/admin/Categories.tsx` | Add ImageUploader + image_url field |
| `src/pages/admin/Products.tsx` | Add ImageUploader + reseller_price field |
| `src/pages/admin/Blog.tsx` | Add ImageUploader |
| `src/pages/admin/Testimonials.tsx` | Add ImageUploader |
| `src/pages/admin/Resellers.tsx` | Enhanced Transfer Saldo |
| `src/pages/admin/WalletTransactions.tsx` | NEW |
| `src/components/layout/ResellerLayout.tsx` | Add nav items |
| `src/pages/reseller/Dashboard.tsx` | Add charts + stats |
| `src/pages/reseller/Products.tsx` | NEW |
| `src/pages/reseller/Balance.tsx` | NEW |
| `src/router.tsx` | Add new routes |
| `src/components/layout/AdminLayout.tsx` | Add wallet-transactions nav |
| `supabase/functions/create-reseller/index.ts` | Add wallet_transactions recording |
| `supabase/functions/reseller-transaction/index.ts` | NEW |

## CONSTRAINTS (TIDAK DIUBAH)
- `digiflazz-*` edge functions: TIDAK DIUBAH
- `duitku-*` edge functions: TIDAK DIUBAH
- `ProductPage.tsx` public checkout: TIDAK DIUBAH
- `TransactionPage.tsx`: TIDAK DIUBAH
- Settings.tsx — Digiflazz, Duitku sections: TIDAK DIUBAH
- Existing transaction system logic: TIDAK DIUBAH
