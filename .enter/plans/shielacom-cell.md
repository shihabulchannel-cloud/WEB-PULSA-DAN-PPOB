# Audit & Fix Plan — SHIELACOM CELL

## Tujuan
Audit menyeluruh + perbaikan semua bug yang ditemukan agar website berfungsi penuh untuk transaksi nyata.

---

## Hasil Audit

### ✅ Halaman yang sudah berfungsi normal
- **HomePage** — Hero, CategoryGrid, Features, HowToBuy, ResellerBanner
- **CategoryPage** — Daftar produk per kategori + search/filter merek
- **TransactionSearchPage** — Cari transaksi by nomor invoice
- **TransactionPage** — Detail transaksi + auto-refresh status + tombol bayar
- **SearchPage** — Pencarian lintas kategori
- **PromoPage**, **ResellerPage** — Halaman statis ok
- **Admin Panel** — Dashboard, Transactions, Products, Categories, Markup, Banners, FAQ, CMS, Logs, Settings

### ❌ Bug Kritis Ditemukan

#### Bug 1 — CRITICAL: ProductPage memanggil gateway yang salah
- **File**: `src/pages/ProductPage.tsx` baris 109
- **Masalah**: Memanggil `tripay-create-payment` (sudah dihapus/diganti), bukan `duitku-create-payment`
- **Dampak**: Semua pembayaran GAGAL. Customer tidak mendapatkan URL pembayaran.

#### Bug 2 — CRITICAL: duitku-create-payment membutuhkan auth padahal customer tidak login
- **File**: `supabase/functions/duitku-create-payment/index.ts` baris 28-30
- **Masalah**: Wajib kirim JWT token user yang login, tapi customer adalah anonim
- **Dampak**: Bahkan setelah fix Bug 1, tetap return 401 Unauthorized untuk semua customer

#### Bug 3 — IMPORTANT: StaticPage tidak membaca hasil edit CMS Admin
- **File**: `src/pages/StaticPage.tsx`
- **Masalah**: Konten hardcoded di JS object `staticContent`. Admin mengedit via CMS panel → disimpan di `settings` table → tapi StaticPage tidak pernah membacanya
- **Dampak**: Fitur CMS tidak berguna (edit About, Privacy, Terms, How-to-buy tidak tampil)

#### Bug 4 — IMPORTANT: Footer social media hanya Instagram, Facebook/Twitter = href="#"
- **File**: `src/components/layout/Footer.tsx`
- **Masalah**:
  - Facebook dan Twitter masih `href="#"` (placeholder)
  - TikTok dan Telegram tidak ada sama sekali
  - Setting baru (`contact_facebook`, `contact_tiktok`, `contact_twitter`, `contact_telegram`) sudah ada di DB tapi tidak dipakai Footer
- **Dampak**: Link sosial media rusak

#### Bug 5 — MINOR: ProductPage.tsx product_sku set ke UUID bukan Digiflazz SKU
- **File**: `src/pages/ProductPage.tsx` baris 87
- **Masalah**: `product_sku: id` → `id` adalah UUID dari URL param, bukan SKU Digiflazz
- **Catatan**: Tidak merusak fungsional karena `digiflazz-transaction` pakai join fallback, tapi semantik salah

#### Bug 6 — MINOR: Login.tsx menggunakan `text-gradient` yang tidak terlihat pada dark background
- **File**: `src/pages/admin/Login.tsx` baris 47
- **Masalah**: `text-gradient` menggunakan warna hijau gelap, tidak terlihat di background gelap
- **Fix**: Ganti ke `text-accent-light`

---

## Rencana Perbaikan

### Fix 1: ProductPage.tsx — Ganti ke Duitku + perbaiki payload

```tsx
// BEFORE (line 109):
const { data: paymentData } = await supabase.functions.invoke('tripay-create-payment', {
  body: { transaction_id: data.id, invoice_no: invoiceNo, payment_code: selectedPayment.code, ... }
});

// AFTER:
const { data: paymentData } = await supabase.functions.invoke('duitku-create-payment', {
  body: {
    invoiceNo,
    amount: total,
    customerName: customerName || 'Customer',
    customerEmail: customerEmail || '',
    customerPhone: customerPhone || '',
    productName: product.name,
  }
});
```

Juga:
- Tambah `digiflazz_sku?: string | null` ke Product interface
- Ubah `product_sku: id` → `product_sku: product.digiflazz_sku || ''`
- Hapus auth header dari invocation (customer tidak login)

### Fix 2: duitku-create-payment — Hapus wajib auth, verifikasi via invoice exist

```typescript
// SEBELUM:
const authHeader = req.headers.get("Authorization");
if (!authHeader) return 401;
const { user } = await supabase.auth.getUser(token);
if (!user) return 401;

// SESUDAH: Hapus auth check, ganti dengan verifikasi invoice ada di DB
// Ambil parameter sebagai `invoiceNo` (bukan `transactionId`)
// Security: verifikasi bahwa invoiceNo exist di transactions table + status pending
```

### Fix 3: StaticPage.tsx — Baca konten dari settings table

```tsx
// Tambah query untuk setiap page:
const { data: settings } = useSettings();
const cmsKey = `cms_${pageKey.replace('-', '_')}`;
// Gunakan settings[cmsKey] jika ada, fallback ke staticContent[pageKey].content
```

### Fix 4: Footer.tsx — Tambah semua social media dari settings

```tsx
// Tambah hooks:
const telegram = useSetting('contact_telegram', '');
const facebook = useSetting('contact_facebook', '');
const tiktok = useSetting('contact_tiktok', '');
const twitter = useSetting('contact_twitter', '');

// Helper untuk handle full URL atau @username:
const getSocialUrl = (value: string, base: string) => {
  if (!value) return '';
  if (value.startsWith('http')) return value;
  return `${base}/${value.replace('@', '')}`;
};

// Tampilkan semua ikon jika tersedia (Telegram, Instagram, Facebook, TikTok, Twitter)
```

**Jawaban untuk pertanyaan sosial media:**
Ya, user bisa memasukkan link profil lengkap (misal `https://instagram.com/shielacomcell`) atau username saja (`@shielacomcell`). Footer akan otomatis menangani kedua format.

### Fix 5: Admin Login — `text-gradient` → `text-accent-light`

---

## File yang Diubah

| File | Perubahan |
|------|-----------|
| `src/pages/ProductPage.tsx` | Bug 1, 5 — Ganti ke duitku, perbaiki product_sku |
| `supabase/functions/duitku-create-payment/index.ts` | Bug 2 — Hapus wajib auth, terima invoiceNo |
| `src/pages/StaticPage.tsx` | Bug 3 — Baca CMS dari settings table |
| `src/components/layout/Footer.tsx` | Bug 4 — Tambah semua social media dari DB |
| `src/pages/admin/Login.tsx` | Bug 6 — Fix text-gradient |

---

## Verifikasi

Setelah fix:
1. **Transaksi**: Pilih produk → isi data → pilih payment → klik bayar → redirect ke halaman Duitku ✓
2. **CMS**: Edit About di admin → simpan → halaman /about menampilkan konten baru ✓
3. **Footer sosial**: Masukkan link Instagram/Facebook/TikTok di Settings → ikon muncul di Footer ✓
4. **Admin login**: Teks nama website terlihat di halaman login ✓
