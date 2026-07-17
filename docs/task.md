# Task List - Si Monang: Sub-Menu Konfigurasi & Manajemen Peran (Sprint 5)

- [x] **Model Database Role Dinamis**
  - [x] Tambahkan struct `Role` di `backend/internal/models/models.go`
  - [x] Migrasikan model `Role` di `backend/main.go`
  - [x] Buat seeder data peran bawaan (`ADMIN`, `PERENCANAAN`, `KEUANGAN`, `MANAJER`) di `backend/main.go`
- [x] **API CRUD Peran (Go Backend)**
  - [x] Implementasikan API CRUD untuk peran di `backend/internal/handlers/rbac.go`
  - [x] Daftarkan rute API baru (`GET/POST/PUT/DELETE /api/rbac/roles`) di `backend/main.go`
- [x] **Penyelarasan Menu & Pengaturan Peran (React Frontend)**
  - [x] Implementasikan grup menu lipat (collapsible dropdown) **Konfigurasi Akses** di sidebar `frontend/src/App.jsx`
  - [x] Buat tab menu baru **Pengaturan Peran** (tab: `roles`) beserta form modal tambah/edit di `frontend/src/App.jsx`
  - [x] Sesuaikan pemilihan peran user (dropdown) dan kolom matriks RBAC agar dinamis mengambil data dari API
- [x] **Verifikasi & Pengujian**
  - [x] Lakukan pengujian perubahan nama peran dinamis dan verifikasi transaksional database
