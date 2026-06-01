# SHIELACOM CELL — Rebuild Total Premium Green Theme

## Context
Rebuild total UI dari tema biru/ungu ke tema hijau premium (mirip Codashop/Unipin/Tokogame).
Payment gateway: hapus Tripay, ganti Duitku + VIP Payment.
Tambah section homepage baru, perbaiki navbar, dan tambah halaman Promo/Reseller.

---

## 1. Design System (index.css + tailwind.config.ts)

### Warna Baru (HSL):
```
--primary: 150 82% 29%        (#0E8A4A)
--primary-foreground: 0 0% 100%
--primary-light: 148 65% 45%  (#14A85C)
--primary-dark: 151 92% 22%   (#056B36)
--primary-glow: 148 73% 55%   (#1CC96B)
--secondary: 149 77% 36%      (#14A85C)
--accent: 148 73% 45%         (#1CC96B)
--background: 120 9% 97%      (#F8FAF8)
--sidebar: 151 88% 10%        (dark green)
```

### Gradient Tokens (semua hijau):
- `--gradient-hero`: hijau tua → hijau segar → emerald
- `--gradient-primary`: hijau tua → hijau muda
- `--gradient-button`: hijau 0% → emerald 100%
- `--gradient-dark`: hijau sangat tua untuk footer

### Tambah CSS utilities:
- `.wave-divider` — SVG wave separator antar section
- `.section-curved` — section dengan border-radius bawah yang melengkung
- Micro animation: `hover-lift`, `hover-scale`, `pulse-green`
- Semua referensi warna biru/ungu dihapus

---

## 2. Navbar (src/components/layout/Navbar.tsx) — REBUILD

### Menu baru:
- Beranda → `/`
- Produk → dropdown/submenu kategori
- Cek Transaksi → `/transaction`
- Promo → `/promo`
- Reseller → `/reseller`
- Bantuan → `/faq`

### Perubahan:
- Hapus tombol "Admin Login" di header customer
- Tambah tombol WhatsApp (ikon WA, buka wa.me/{contact_whatsapp})
- Search bar lebih menonjol, lebar di mobile
- Navbar putih saat scroll, transparan di atas hero
- Underline animasi pada item menu aktif
- Mobile: full drawer dengan semua menu

---

## 3. Hero Banner (src/components/home/HeroBanner.tsx) — REBUILD

### Layout baru:
- Full width, min-height 560px, gradient hijau premium
- Kiri: headline besar + deskripsi + 2 CTA buttons
- Kanan: floating product cards animasi (4 kategori: Game, Pulsa, E-Wallet, PPOB)
- Background: radial glow hijau + partikel titik abstrak
- Auto-slide 4 banner dari DB (fallback: static hero)
- Animasi smooth slide dengan opacity transition
- Wave divider di bagian bawah hero (bentuk gelombang hijau ke putih)

### 4 Default Banner Content (rendered dari DB atau fallback):
1. "Top Up Game Murah!" — game controller illustration
2. "Pulsa & Paket Data" — phone illustration  
3. "PPOB Lengkap" — receipt/bill illustration
4. "E-Wallet & Voucher" — wallet illustration

---

## 4. Homepage Sections (src/pages/HomePage.tsx + new components)

### Section urutan baru:
1. HeroBanner (rebuilt)
2. **Features** (new) — "Keunggulan SHIELACOM CELL"
3. CategoryGrid (updated colors)
4. ProductPopular (updated colors)
5. RecentTransactions (existing)
6. **HowToBuy** (new) — 4 langkah mudah cara transaksi
7. **ResellerBanner** (new) — CTA reseller bergabung
8. Testimonials (existing)
9. FAQ (existing)
10. Footer

### src/components/home/Features.tsx (NEW):
- 4 cards: Transaksi Instan, Harga Termurah, 24 Jam, Aman & Terpercaya
- Ikon dari lucide-react (Zap, Tag, Clock, ShieldCheck)
- Background hijau muda dengan border hijau halus
- Animasi masuk saat scroll (animate-fade-in)

### src/components/home/HowToBuy.tsx (NEW):
- 4 langkah: Pilih Produk → Isi Data → Bayar → Dapat Produk
- Numbered steps dengan garis penghubung
- Icon per langkah
- Latar section putih dengan teks hijau

### src/components/home/ResellerBanner.tsx (NEW):
- Banner CTA reseller
- Background gradient hijau gelap
- Headline: "Daftar Jadi Reseller Sekarang"
- Benefits: Harga Khusus, Komisi Menarik, Support 24 Jam
- Tombol: Hubungi WhatsApp

---

## 5. CategoryGrid (src/components/home/CategoryGrid.tsx) — UPDATE

- Warna icon gradient di-update ke variasi hijau
- Tambah kategori: Token PLN, BPJS, PDAM, TV Kabel (jika ada di DB)
- Card hover effect: border hijau + shadow hijau
- Layout: 3 kolom mobile, 4 tablet, 5-6 desktop (max 10 kategori)

---

## 6. Product Cards — UPDATE COLORS

- Update `ProductPopular.tsx` dan `CategoryPage.tsx`
- Hover border dari biru ke hijau
- Badge "Populer" warna hijau
- Button gradient hijau

---

## 7. Admin Settings (src/pages/admin/Settings.tsx) — MAJOR UPDATE

### Hapus: Tripay section
### Tambah:
- **Duitku Payment Gateway**:
  - Merchant Code, API Key, Callback URL, Return URL, Mode (sandbox/production)
  - Tombol "Test Koneksi" → panggil Duitku inquiry API
  - Status badge: Terhubung/Tidak Terhubung
- **VIP Payment**:
  - Merchant ID, API Key, Signature Key, Callback URL
  - Tombol "Test Koneksi"
  - Status badge

### Update section Digiflazz:
- Tambah Tombol "Test Koneksi" → panggil Digiflazz ping/balance
- Status badge realtime

### Update section Fonnte:
- Tambah Tombol "Test Koneksi" → kirim WA test ke nomor admin
- Status badge

### Update sensitive keys list:
- Hapus: tripay_*, tambah: duitku_*, vip_*

---

## 8. Edge Functions

### Hapus (replace):
- `tripay-create-payment` → `duitku-create-payment`
- `tripay-webhook` → `duitku-webhook`

### Tambah:
- `vip-create-payment`
- `vip-webhook`

### Update ProductPage.tsx:
- Ganti call `tripay-create-payment` → coba `duitku-create-payment` dulu, fallback `vip-create-payment`

---

## 9. New Pages

### src/pages/PromoPage.tsx (NEW):
- Hero hijau dengan teks "Promo Terkini"
- Grid kartu promo (hardcoded + bisa diisi dari DB banners)
- CTA hubungi WhatsApp untuk info promo

### src/pages/ResellerPage.tsx (NEW):
- Hero pengenalan program reseller
- Benefit reseller (4 poin)
- Cara daftar (3 langkah)
- Form daftar (nama, WA, email) → kirim via WhatsApp
- CTA WhatsApp

---

## 10. Database Migration

```sql
-- Tambah setting keys baru
INSERT INTO settings (key, value) VALUES 
  ('duitku_merchant_code', ''),
  ('duitku_api_key', ''),
  ('duitku_callback_url', ''),
  ('duitku_return_url', ''),
  ('duitku_mode', 'sandbox'),
  ('vip_merchant_id', ''),
  ('vip_api_key', ''),
  ('vip_signature_key', ''),
  ('vip_callback_url', '')
ON CONFLICT (key) DO NOTHING;
```

---

## 11. Router Update (src/router.tsx)

Tambah routes:
- `/promo` → PromoPage
- `/reseller` → ResellerPage

---

## Files Modified:
1. `src/index.css` — green design system
2. `tailwind.config.ts` — green colors  
3. `src/components/layout/Navbar.tsx` — new menu + WA button
4. `src/components/layout/Footer.tsx` — green footer colors
5. `src/components/home/HeroBanner.tsx` — premium hero rebuild
6. `src/components/home/CategoryGrid.tsx` — green colors
7. `src/components/home/ProductPopular.tsx` — green colors
8. `src/components/home/Testimonials.tsx` — green accent
9. `src/components/home/FAQ.tsx` — green accent
10. `src/pages/HomePage.tsx` — add new sections
11. `src/pages/admin/Settings.tsx` — Duitku + VIP Payment
12. `src/router.tsx` — new routes

## Files Created:
1. `src/components/home/Features.tsx`
2. `src/components/home/HowToBuy.tsx`
3. `src/components/home/ResellerBanner.tsx`
4. `src/pages/PromoPage.tsx`
5. `src/pages/ResellerPage.tsx`
6. `supabase/functions/duitku-create-payment/index.ts`
7. `supabase/functions/duitku-webhook/index.ts`
8. `supabase/functions/vip-create-payment/index.ts`
9. `supabase/functions/vip-webhook/index.ts`

---

## Verification:
1. Homepage tampil hero hijau premium dengan wave divider
2. Navbar menampilkan menu baru + tombol WA
3. Semua warna ungu/biru diganti hijau
4. Settings admin tampil Duitku + VIP Payment dengan tombol test
5. Route /promo dan /reseller berfungsi
6. Semua lint: 0 errors
