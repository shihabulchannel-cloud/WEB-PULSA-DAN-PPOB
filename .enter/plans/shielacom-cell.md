# Plan: Update Lanjutan Sistem Reseller

## Context
Building on the previous commit (feat: implement product purchasing and wallet management).
This update adds:
1. Double-credit protection for deposit approval
2. Reseller markup pricing system (global/category/product)
3. Product image upload in admin Products page
4. Reseller pricing page for admin
5. Calculation of effective reseller price with priority logic in frontend

**STRICT CONSTRAINT: Do NOT touch Digiflazz, Duitku, transaction system, or webhook code.**

---

## STEP 1 — DB MIGRATION (SAFE, ADD-ONLY)
```sql
-- 1a. Add reseller_markup to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS reseller_markup numeric DEFAULT 0;

-- 1b. Add reseller_markup_global to settings
INSERT INTO settings (key, value) VALUES ('reseller_markup_global', '0') ON CONFLICT (key) DO NOTHING;

-- 1c. No extra is_processed needed — deposit status check in edge fn is sufficient
--     We will fix the edge fn to do atomic update + check rows_affected instead
```

---

## STEP 2 — Fix Double-Credit in reseller-deposit-action Edge Function
**Current problem**: edge function does:
1. Check status != 'pending' (good)
2. Update balance
3. Update status

**Fix**: Reverse order — update status first with conditional WHERE clause, check rows_affected to detect race condition:
1. `UPDATE reseller_deposits SET status='approved' WHERE id=X AND status='pending'` → check if 1 row updated
2. If 0 rows updated → reject (already processed)
3. Only then update balance + create wallet_transactions

Files: `supabase/functions/reseller-deposit-action/index.ts`

---

## STEP 3 — New Admin Page: ResellerPricing.tsx
**Path**: `src/pages/admin/ResellerPricing.tsx`

3-tab layout:

### Tab 1: Global Markup
- Single input: fetch `settings.reseller_markup_global`, save via supabase upsert
- Description: "Diterapkan ke semua produk jika tidak ada aturan kategori/produk khusus"

### Tab 2: Per Kategori
- List all categories with inline-editable `reseller_markup` field
- Save per category: `UPDATE categories SET reseller_markup=X WHERE id=Y`
- Show: Nama Kategori | Markup (Rp) | Contoh Harga

### Tab 3: Per Produk
- Table of all products with inline-editable `reseller_price` field
- Shows: Nama | Harga Modal | Harga Reseller | Margin
- Save per product: `UPDATE products SET reseller_price=X WHERE id=Y`
- Priority note: "Harga ini mengalahkan markup global & kategori"

---

## STEP 4 — Update Admin Products.tsx
Add `image_url` field (ImageUploader) to the edit dialog:
- Query: include `image_url` in form state + emptyForm
- Dialog: add `<ImageUploader ... />` below brand field
- Save: include `image_url` in payload

Files: `src/pages/admin/Products.tsx`

---

## STEP 5 — Update Reseller Products.tsx (Priority Pricing)
Update product query to also fetch `category_id`, categories with `reseller_markup`.
Fetch `reseller_markup_global` from settings.

Price calculation logic (applied per product in frontend):
```
function getResellerPrice(product, categoryMarkup, globalMarkup):
  if product.reseller_price > 0 → use product.reseller_price
  elif categoryMarkup[product.category_id] > 0 → modal_price + category_markup
  else → modal_price + globalMarkup
```

Show:
- Price badge showing "Hemat Rp X" when reseller_price < sell_price
- "Harga Khusus" tag if product has explicit reseller_price

Files: `src/pages/reseller/Products.tsx`

---

## STEP 6 — Update AdminLayout + Router
### AdminLayout
Add to RESELLER group:
```tsx
{ label: 'Pengaturan Harga', href: '/admin/reseller-pricing', icon: Tag }
```
Files: `src/components/layout/AdminLayout.tsx`

### Router
```tsx
import AdminResellerPricing from "./pages/admin/ResellerPricing";
// Add route:
{ path: "/admin/reseller-pricing", element: <ProtectedRoute><AdminResellerPricing /></ProtectedRoute> }
```
Files: `src/router.tsx`

---

## Verification
1. Admin → Deposit Reseller → approve same deposit twice → second attempt should fail with "Deposit sudah diproses"
2. Admin → Pengaturan Harga → set global markup 500 → reseller sees modal+500 on all products without specific price
3. Admin → Pengaturan Harga → set kategori "Game" markup 2000 → reseller sees modal+2000 for game products
4. Admin → Pengaturan Harga → set produk specific 25000 → reseller sees 25000 for that product (overrides category+global)
5. Admin → Products → edit product → upload gambar → saved and shown
6. Reseller portal remains accessible, Digiflazz sync still works
