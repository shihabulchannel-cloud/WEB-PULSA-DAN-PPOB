# Admin Dashboard Rebuild — SHIELACOM CELL

## Context
Full admin panel upgrade: lebih banyak statistik di dashboard, halaman Digiflazz khusus, CMS konten statis, log sistem terpadu, settings diperluas, sidebar diperbarui, dan akun admin dibuat ulang.

---

## Status Saat Ini
- Dashboard: ada tapi terbatas (4 stat card, chart biru)
- Settings: ada — umum, Digiflazz, Duitku, VIP, SMTP, Fonnte
- Transactions, Products, Markup, PaymentMethods, Banners, Reports, FAQ, Blog, Testimonials: SUDAH BERFUNGSI — tidak diubah
- **Belum ada:** halaman Digiflazz khusus, CMS konten, log sistem terpadu

---

## Prioritas Implementasi

### FASE 1 — Dashboard Baru (Dashboard.tsx)
Ganti dengan 9 stat card berisi:
- Transaksi Hari Ini / Bulan Ini
- Omzet Hari Ini / Bulan Ini  
- Profit Hari Ini / Bulan Ini
- Total Pengguna (`auth.users` via supabase count)
- Total Produk Aktif / Nonaktif (query products table)

Tambah 2 chart:
- Grafik 14 hari (existing, ubah warna ke hijau hsl vars)
- Grafik Penjualan per Bulan (6 bulan terakhir — BarChart)

Tambah 2 panel baru:
- Statistik Payment Method (pie/bar dari transactions)
- Top 5 Provider/Brand terlaris

Fix chart gradient colors dari hsl(220 90% 50%) → hsl(var(--primary)).

### FASE 2 — Digiflazz Admin Page (Digiflazz.tsx — NEW)
Halaman baru `/admin/digiflazz`:
- Tampilkan status koneksi (badge hijau/merah)
- Tombol **Test Koneksi** → call edge function `digiflazz-test-connection`
- Tombol **Sync Semua Produk** → call `digiflazz-sync`
- Info sinkronisasi: total produk, terakhir sync
- Stats produk per kategori setelah sync
- Link ke pengaturan API (di Settings)

Edge function baru: `digiflazz-test-connection`
- POST ke https://api.digiflazz.com/v1/cek-saldo
- Return: balance, status

### FASE 3 — AdminLayout Sidebar Update
Tambah section groupings dan item baru:
```
MENU UTAMA
  Dashboard
  Transaksi
  Produk
  Kategori
  Markup Harga

LAYANAN  
  Digiflazz [NEW]
  Pembayaran

WEBSITE
  Banner
  Testimoni
  Blog / Artikel
  FAQ
  Konten CMS [NEW]

LAPORAN & LOG
  Laporan
  Log Sistem [NEW]
  Notifikasi

KONFIGURASI
  Pengaturan
```

### FASE 4 — CMS Konten Statis (CMS.tsx — NEW)
Halaman baru `/admin/cms`:
- Tab: Tentang Kami / Cara Transaksi / Kebijakan Privasi / Syarat & Ketentuan
- Simpan ke `settings` table dengan key `cms_about`, `cms_how_to_buy`, `cms_privacy`, `cms_terms`
- Textarea besar dengan format HTML sederhana
- Preview teks
- Tombol Simpan

### FASE 5 — Log Sistem (SystemLogs.tsx — NEW)
Halaman baru `/admin/logs`:
- Tab: API Log / Webhook Log / Activity Log
- Filter per service/type
- Warna status (success=hijau, error=merah)

### FASE 6 — Settings.tsx Update
Tambah section baru:
- **Tampilan Website**: Logo URL, Favicon URL, Warna Utama (hex), Warna Sekunder
- **SEO**: Meta Title, Meta Description, Keywords
- **Sosial Media**: WhatsApp, Telegram, Instagram, Facebook, TikTok, Twitter

### FASE 7 — DB Migration
```sql
-- CMS content keys
INSERT INTO settings (key, value) VALUES
  ('cms_about', ''), ('cms_how_to_buy', ''),
  ('cms_privacy', ''), ('cms_terms', ''),
  ('site_logo_url', ''), ('site_favicon_url', ''),
  ('contact_telegram', ''), ('contact_facebook', ''),
  ('contact_tiktok', ''), ('meta_title', ''), 
  ('meta_description', ''), ('meta_keywords', '')
ON CONFLICT (key) DO NOTHING;
```

### FASE 8 — Buat Akun Admin
Invoke `create-admin-user` edge function via Supabase client.

---

## Files Modified
| File | Action |
|---|---|
| `src/pages/admin/Dashboard.tsx` | REWRITE complete |
| `src/components/layout/AdminLayout.tsx` | UPDATE sidebar items |
| `src/pages/admin/Settings.tsx` | UPDATE new sections |
| `src/pages/admin/Digiflazz.tsx` | CREATE new |
| `src/pages/admin/CMS.tsx` | CREATE new |
| `src/pages/admin/SystemLogs.tsx` | CREATE new |
| `src/router.tsx` | ADD new admin routes |
| `supabase/functions/digiflazz-test-connection/index.ts` | CREATE new |

## Files NOT Changed
Transactions, Products, Markup, PaymentMethods, Banners, Reports, FAQ, Blog, Testimonials, Notifications, ApiLogs — sudah berfungsi.

## Verification
1. Dashboard tampil 9 stat cards semua terisi
2. Grafik warna hijau (sesuai design system)
3. `/admin/digiflazz` test koneksi berhasil jika API key valid
4. `/admin/cms` bisa simpan konten dan tampil di StaticPage.tsx
5. `/admin/logs` tampil tab dengan data dari 3 tabel
6. Settings new sections tersimpan
7. Admin account dapat login di `/admin/login`
