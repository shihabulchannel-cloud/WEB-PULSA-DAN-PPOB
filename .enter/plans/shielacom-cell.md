# SHIELACOM CELL — Implementation Plan

## Context
Build a fully functional digital product marketplace (Top Up Game, Pulsa, PPOB, E-Wallet, Voucher) setara Unipin/Codashop. Tech stack: React + Vite + TypeScript + Tailwind + Supabase. Payment gateway: **Tripay** (primary). WhatsApp notif: **Fonnte**. Digiflazz credentials configurable from admin panel.

---

## PHASE 1: DATABASE SCHEMA

**Migration SQL — semua tabel:**
- `settings` — konfigurasi website (nama, logo, warna, API keys, SMTP, Fonnte)
- `categories` — Top Up Game, Pulsa, PPOB, dll
- `products` — linked ke category + provider, harga modal, harga jual, markup
- `markup_rules` — global / per kategori / per produk
- `transactions` — id, customer_name, customer_email, customer_phone, target_id, product_id, amount, payment_method, payment_status, digiflazz_status, invoice_no
- `payment_methods` — QRIS, VA, Transfer, E-Wallet
- `invoices` — linked transaction
- `banners` — hero slider
- `testimonials`
- `faq`
- `blogs` + `blog_categories`
- `notifications` — in-app
- `activity_logs` — admin actions
- `api_logs` — Digiflazz API calls
- `webhook_logs` — payment callbacks
- `admins` (Supabase auth users dengan role check)
- `profit_reports` — computed view

RLS: enabled semua tabel. Hanya admin authenticated bisa write. Public bisa read products/categories/banners/testimonials/faq/blogs.

---

## PHASE 2: DESIGN SYSTEM

**File: `src/index.css`** — update design tokens:
- `--primary`: biru (220 90% 50%)
- `--primary-glow`: cyan (190 100% 60%)
- `--secondary`: ungu (260 80% 55%)
- `--accent`: cyan (185 90% 50%)
- Gradient tokens: `--gradient-hero`, `--gradient-card`, `--gradient-button`
- Animation: pulse, shimmer, float
- Glassmorphism utility classes

**File: `tailwind.config.ts`** — extend with brand colors + custom animations

---

## PHASE 3: ROUTING STRUCTURE

**`src/router.tsx`** — routes:

### Public Routes
- `/` — Homepage
- `/category/:slug` — Category page
- `/product/:slug` — Product detail + order form
- `/checkout/:transactionId` — Checkout + payment
- `/transaction/:invoiceNo` — Status & invoice
- `/blog` — Blog list
- `/blog/:slug` — Blog detail
- `/faq` — FAQ page

### Admin Routes (protected)
- `/admin/login` — Admin login
- `/admin` — Dashboard overview (charts, stats)
- `/admin/products` — Product management + Digiflazz sync
- `/admin/categories` — Category management
- `/admin/transactions` — Transaction list + management
- `/admin/markup` — Markup rules
- `/admin/banners` — Banner management
- `/admin/testimonials` — Testimoni
- `/admin/blog` — Blog management
- `/admin/faq` — FAQ management
- `/admin/notifications` — Notification history
- `/admin/reports` — Profit reports + export
- `/admin/settings` — Website settings (API keys, SMTP, Fonnte, Tripay)

---

## PHASE 4: FRONTEND COMPONENTS

### Layout
- `src/components/layout/Navbar.tsx` — logo, kategori nav, cek transaksi
- `src/components/layout/Footer.tsx` — info, sosmed, payment badge
- `src/components/layout/AdminLayout.tsx` — sidebar + header

### Homepage Sections
- `src/components/home/HeroBanner.tsx` — carousel banner
- `src/components/home/CategoryGrid.tsx` — icon cards per kategori
- `src/components/home/ProductPopular.tsx` — produk populer
- `src/components/home/RecentTransactions.tsx` — live feed transaksi berhasil (realtime Supabase)
- `src/components/home/Testimonials.tsx`
- `src/components/home/FAQ.tsx`
- `src/components/home/BlogSection.tsx`

### Transaction Flow
- `src/components/order/OrderForm.tsx` — input nomor/ID game + pilih nominal
- `src/components/order/PaymentMethod.tsx` — pilih metode bayar
- `src/components/order/CheckoutSummary.tsx` — ringkasan + bayar
- `src/components/order/TransactionStatus.tsx` — status realtime + invoice

### Admin Components
- `src/components/admin/StatsCard.tsx`
- `src/components/admin/SalesChart.tsx`
- `src/components/admin/ProfitChart.tsx`
- `src/components/admin/TransactionTable.tsx`
- `src/components/admin/ProductTable.tsx`
- `src/components/admin/DigiflazzSync.tsx`

---

## PHASE 5: EDGE FUNCTIONS (Backend Logic)

### `supabase/functions/digiflazz-sync/index.ts`
- GET produk dari Digiflazz API
- Upsert ke tabel `products`
- Apply markup rules
- Log ke `api_logs`

### `supabase/functions/digiflazz-transaction/index.ts`
- POST transaksi ke Digiflazz
- Update status di `transactions`
- Trigger notifikasi

### `supabase/functions/digiflazz-webhook/index.ts`
- Terima callback Digiflazz
- Update transaction status
- Trigger invoice generation
- Send notifikasi (email, WhatsApp via Fonnte)

### `supabase/functions/tripay-create-payment/index.ts`
- Buat payment di Tripay
- Return payment_url / VA number
- Simpan di transactions

### `supabase/functions/tripay-webhook/index.ts`
- Verifikasi signature Tripay
- Update payment_status
- Trigger digiflazz-transaction

### `supabase/functions/send-notification/index.ts`
- Email via SMTP (nodemailer atau resend)
- WhatsApp via Fonnte API
- In-app notification insert

### `supabase/functions/generate-invoice/index.ts`
- Return invoice data JSON
- Frontend render ke PDF (print/jsPDF)

### `supabase/functions/export-report/index.ts`
- Export Excel (xlsx) / CSV
- Filter by date range

---

## PHASE 6: ADMIN AUTHENTICATION

- Supabase auth untuk admin login
- Middleware `src/hooks/useAdminAuth.ts` — check session + redirect
- Default admin: admin@shielacomcell.com / Admin@123456
- Force change password on first login (flag di settings)
- `src/pages/admin/Login.tsx`

---

## PHASE 7: MARKUP SYSTEM

- Tabel `markup_rules` dengan priority: product > category > global
- Function di database `calculate_sell_price(product_id)` → harga modal + markup tertinggi yang applicable
- Setiap kali admin update markup → all product prices update otomatis via trigger

---

## PHASE 8: REALTIME & SEO

- Supabase Realtime pada tabel `transactions` → live feed di homepage
- `public/robots.txt` — sudah ada, update
- `public/sitemap.xml` — generate dari blog + categories
- Meta tags per halaman (Helmet / react-helmet-async)

---

## PHASE 9: INVOICE & EXPORT

### Invoice PDF
- Render invoice di halaman `/transaction/:invoiceNo`
- Browser `window.print()` dengan CSS `@media print`
- Tampilkan: no invoice, produk, customer, jumlah, status, tanggal

### Export Reports
- Install `xlsx` dan `jspdf` packages
- Edge function `export-report` return data
- Frontend trigger download

---

## KEY FILES TO MODIFY
- `src/index.css` — design system overhaul
- `tailwind.config.ts` — brand colors + animations
- `src/router.tsx` — semua routes
- `src/App.tsx` — add AuthProvider
- `src/pages/Index.tsx` — homepage full rebuild

## NEW FILES (key)
- `src/lib/supabase.ts` — re-export client
- `src/hooks/useAdminAuth.ts`
- `src/hooks/useSettings.ts` — app settings context
- `src/contexts/AuthContext.tsx`
- `src/pages/admin/` — all admin pages
- `src/components/home/` — homepage sections
- `src/components/order/` — transaction flow
- `src/components/layout/` — Navbar, Footer, AdminLayout
- `supabase/functions/` — 6 edge functions

## PACKAGES TO INSTALL
- `react-helmet-async` — SEO meta tags
- `jspdf` + `jspdf-autotable` — PDF invoice
- `xlsx` — Excel export
- `@tanstack/react-query` — already installed

## VERIFICATION
1. Homepage loads dengan kategori + produk dari DB
2. Order flow: pilih produk → isi data → checkout → status page
3. Admin login dengan admin@shielacomcell.com
4. Admin dashboard tampil stats + grafik
5. Digiflazz sync dari panel admin
6. Tripay payment create + webhook callback
7. Invoice download PDF works
8. Export Excel/CSV dari laporan
9. Markup update → harga produk berubah otomatis
10. Notifikasi WhatsApp via Fonnte saat transaksi sukses
