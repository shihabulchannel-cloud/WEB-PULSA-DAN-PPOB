# Plan: Sistem Reseller Lengkap

## Context
User ingin sistem reseller penuh: registrasi via WA, admin buat akun reseller, portal reseller terpisah, sistem saldo, dan verifikasi deposit. Seluruh konfigurasi Digiflazz, database, dan transaksi existing harus DIPERTAHANKAN.

---

## 1. Database Migration (safe — hanya ADD, tidak DELETE)

### Tabel Baru:

**`reseller_applications`** — form pendaftaran dari halaman reseller publik
- id, nama, whatsapp, email, kota, nama_toko, status (waiting/approved/rejected), notes, created_at

**`resellers`** — profil reseller (terhubung ke Supabase auth user)
- id, user_id (FK auth.users), nama, username, whatsapp, email, kota, is_active, created_by (admin), created_at

**`reseller_balances`** — saldo reseller
- id, reseller_id (FK resellers), balance (numeric default 0), updated_at

**`reseller_balance_history`** — histori semua perubahan saldo
- id, reseller_id, type (credit/debit), amount, balance_before, balance_after, description, reference_id, created_by, created_at

**`reseller_deposits`** — pengajuan deposit dari reseller
- id, reseller_id, amount, bank_name, sender_name, proof_url, status (pending/approved/rejected), notes, approved_by, approved_at, created_at

**`reseller_prices`** — harga khusus reseller
- id, reseller_id (null=global), product_id (null=kategori), category_id (null=semua), markup_amount, markup_type (fixed/percent), is_active, created_at

### RLS Policies:
- resellers: admin can ALL, reseller can read own
- reseller_balances: admin can ALL, reseller can read own
- reseller_deposits: admin can ALL, reseller can INSERT+read own
- reseller_applications: public can INSERT, admin can ALL
- reseller_balance_history: admin can ALL, reseller can read own
- reseller_prices: admin can ALL, reseller can read

### Storage Bucket:
- `reseller-deposits` bucket — untuk upload bukti transfer (public read)

---

## 2. Auth System Update

**AuthContext.tsx** — tambah `isReseller: boolean`
- Reseller = user dengan `user_metadata.role === 'reseller'`
- Admin tetap = `user_metadata.role === 'admin'`

**`create-reseller` Edge Function** — admin-only
- Input: nama, username, email, password, whatsapp, saldo_awal
- Pakai Supabase Admin API (`supabase.auth.admin.createUser`)
- Set `user_metadata: { role: 'reseller' }`
- Insert ke `resellers` + `reseller_balances`
- Jika saldo_awal > 0, insert ke `reseller_balance_history`

**`reseller-deposit-action` Edge Function** — admin-only
- Input: deposit_id, action (approve/reject), notes
- Jika approve: update reseller_balances + insert balance_history

---

## 3. Files Baru yang Dibuat

### Components:
- `src/components/layout/ResellerLayout.tsx` — sidebar + header portal reseller
- `src/components/ProtectedResellerRoute.tsx` — guard untuk halaman reseller

### Halaman Reseller Portal:
- `src/pages/reseller/Login.tsx` — login reseller (gunakan email+password)
- `src/pages/reseller/Dashboard.tsx` — dashboard: saldo, transaksi terbaru, shortcuts
- `src/pages/reseller/Deposit.tsx` — form deposit + upload bukti transfer
- `src/pages/reseller/Transactions.tsx` — histori transaksi
- `src/pages/reseller/Profile.tsx` — ubah password + profil

### Halaman Admin Baru:
- `src/pages/admin/Resellers.tsx` — CRUD reseller + lihat saldo + reset password
- `src/pages/admin/ResellerApplications.tsx` — lihat aplikasi, approve/reject
- `src/pages/admin/ResellerDeposits.tsx` — verifikasi deposit reseller

### Halaman Publik Update:
- `src/pages/ResellerPage.tsx` — PERBAIKI: tambah form pendaftaran modal/inline → submit ke `reseller_applications` + redirect WA

---

## 4. Files yang Diupdate (TANPA mengubah fungsi existing)

### `src/router.tsx`
Tambah routes (TIDAK hapus yang ada):
- `/reseller/login`
- `/reseller/dashboard`
- `/reseller/deposit`
- `/reseller/transactions`
- `/reseller/profile`
- `/admin/resellers`
- `/admin/reseller-applications`
- `/admin/reseller-deposits`

### `src/components/layout/AdminLayout.tsx`
Tambah group menu "RESELLER":
- Manajemen Reseller → `/admin/resellers`
- Aplikasi Masuk → `/admin/reseller-applications`
- Deposit Reseller → `/admin/reseller-deposits`

### `src/contexts/AuthContext.tsx`
Tambah `isReseller` field (TIDAK ubah isAdmin, signIn, signOut).

---

## 5. Urutan Implementasi

1. **DB Migration** — semua tabel baru + RLS + storage bucket
2. **Edge Functions** — `create-reseller` + `reseller-deposit-action`
3. **AuthContext** — tambah isReseller
4. **ResellerLayout + ProtectedResellerRoute**
5. **Halaman Reseller Portal** (Login, Dashboard, Deposit, Transactions, Profile)
6. **Admin Pages** (Resellers, Applications, Deposits)
7. **Update Router + AdminLayout + ResellerPage**

---

## 6. Keamanan
- Reseller TIDAK bisa akses `/admin/*` (ProtectedRoute cek isAdmin)
- Admin TIDAK bisa akses dari `/reseller/*` (hanya reseller atau redirect ke login)
- Semua operasi sensitif (buat akun, approve deposit) via Edge Function dengan auth check
- Semua konfigurasi Digiflazz, API Key, Webhook TIDAK disentuh

---

## 7. Verification
- Kunjungi `/reseller` → ada form pendaftaran → isi → klik submit → redirect WA + data masuk DB
- Admin buka `/admin/reseller-applications` → lihat data pendaftar
- Admin buka `/admin/resellers` → buat akun reseller baru → berhasil
- Login ke `/reseller/login` dengan akun yang dibuat admin → masuk dashboard
- Reseller buka `/reseller/deposit` → upload bukti transfer → submit
- Admin buka `/admin/reseller-deposits` → approve → saldo reseller bertambah
- Cek `/admin/resellers` → saldo reseller terlihat updated
