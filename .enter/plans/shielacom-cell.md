# Plan: Per-Product Markup & Sell Price Display

## Context
Admin ingin bisa set markup harga per produk, harga jual otomatis terhitung, dan pembeli melihat harga jual yang benar.

**State saat ini:**
- `products.modal_price` = harga dasar dari Digiflazz
- `products.markup_amount` = markup (kolom sudah ada)
- `products.sell_price` = harga jual (sudah ditampilkan ke pembeli di ProductPage)
- Admin Products form: ada field sell_price & modal_price tapi terpisah (tidak ada auto-calc)
- ProductPage: sudah menampilkan sell_price ke pembeli ✅

## Yang Perlu Dibuat

### 1. Admin Products Page — Markup Editor (inline + form)

**Tabel produk** — tambah kolom:
- Harga Modal (modal_price) — readonly
- Markup (editable inline input, angka Rp)
- Harga Jual (sell_price, auto-calculated = modal + markup) — readonly

**Edit Dialog** — ubah layout:
- Harga Modal: readonly (dari Digiflazz, tidak bisa diubah manual)
- Markup (Rp): input angka → auto-hitung sell_price
- Harga Jual: readonly, tampil otomatis

**Inline quick-edit**: tiap baris ada input markup kecil + tombol simpan langsung (tanpa buka dialog)

### 2. ProductPage — sudah benar, tidak perlu ubah besar
- Sudah tampil sell_price sebagai "Harga"
- Payment summary sudah benar (harga produk + biaya admin + total)

## Files yang Diubah
- `src/pages/admin/Products.tsx` — utama (tabel + form dialog)
- TIDAK perlu migrasi DB (kolom `markup_amount` & `sell_price` sudah ada)
- TIDAK perlu ubah ProductPage (sudah benar)

## Implementasi Detail

### Products.tsx
1. **Tabel**: 
   - Ubah header: `Harga Modal | Markup | Harga Jual | Status | Aksi`
   - Setiap baris: tampilkan modal_price, markup input (kecil, inline editable), sell_price
   - Tombol simpan markup per baris (icon Check kecil)
   - Saat markup diubah → sell_price = modal_price + markup (update DB langsung)

2. **Edit Dialog**:
   - Harga Modal (Rp) — readonly
   - Markup (Rp) — input, saat berubah auto-hitung sell_price
   - Harga Jual (Rp) — readonly, tampil = modal + markup
   - Hapus field sell_price yang lama dari form (tidak perlu manual input)

3. **State management**:
   - `inlineMarkup: Record<string, string>` — state markup per row untuk inline editing
   - Form dialog: ganti `sell_price` input menjadi `markup_amount` input
   - `sell_price` otomatis = `modal_price + markup_amount`

## Verification
- Buka admin → Produk → semua row tampilkan harga modal, markup, harga jual
- Edit markup satu produk inline → harga jual langsung terhitung dan tersimpan
- Buka ProductPage publik → harga yang ditampilkan = sell_price yang sudah diset
- Payment summary di ProductPage menampilkan harga jual + biaya admin + total
