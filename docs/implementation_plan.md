# Rencana Implementasi: Sub-Menu Konfigurasi & Manajemen Peran (Sprint 5)

Rencana ini memuat langkah-langkah teknis untuk mengelompokkan menu manajemen pengguna dan RBAC menjadi satu kesatuan sub-menu **"Konfigurasi Akses"**, serta menambahkan fitur **CRUD Peran / Role** (termasuk mengubah nama peran secara dinamis).

---

## User Review Required

> [!IMPORTANT]
> **Penyempurnaan Struktur Menu & Manajemen Peran Dinamis**
> 
> 1.  **Pengelompokan Menu (Frontend)**:
>     *   Membuat menu kolaps/dropdown **"Konfigurasi Akses"** di sidebar.
>     *   Sub-menu di dalamnya:
>         *   👥 **Daftar Pengguna**: Mengelola data user (sebelumnya "Pengaturan User").
>         *   🔒 **Matriks RBAC**: Mengelola centang izin (sebelumnya "Matriks RBAC" menu utama).
>         *   🏷️ **Pengaturan Peran**: Menu baru untuk mengelola nama peran (Role) dan deskripsinya.
> 2.  **Manajemen Peran Dinamis (Backend)**:
>     *   Membuat tabel `roles` di database.
>     *   Saat nama peran diubah (misal: `PERENCANAAN` menjadi `DIVISI PERENCANAAN`), sistem secara otomatis (transaksional) mengupdate:
>         1.  Nama peran di tabel `roles`.
>         2.  Kolom role milik user di tabel `users`.
>         3.  Kolom role di pemetaan izin tabel `role_permissions`.
> 3.  **Dropdown & Kolom Dinamis**:
>     *   Pemilihan role saat membuat user baru dan nama kolom pada matriks RBAC tidak lagi menggunakan nilai statis, melainkan membaca data riil dari API `/api/rbac/roles`.

---

## Proposed Changes

### [Backend - Go Service]

#### [MODIFY] [models.go](file:///Users/wahyubudiman/Documents/prototype/pku_zulfirman/backend/internal/models/models.go)
*   Menambahkan struct `Role` untuk representasi tabel peran di database.

#### [MODIFY] [rbac.go (Handlers)](file:///Users/wahyubudiman/Documents/prototype/pku_zulfirman/backend/internal/handlers/rbac.go)
*   Menambahkan fungsi handler CRUD peran:
    *   `GET /api/rbac/roles` -> List seluruh peran.
    *   `POST /api/rbac/roles` -> Tambah peran baru.
    *   `PUT /api/rbac/roles/:name` -> Update nama peran & deskripsi (transaksional update user & permissions).
    *   `DELETE /api/rbac/roles/:name` -> Hapus peran (dihambat jika masih ada user terikat).

#### [MODIFY] [main.go](file:///Users/wahyubudiman/Documents/prototype/pku_zulfirman/backend/main.go)
*   Mendaftarkan migrasi model `Role`.
*   Mendaftarkan seeder awal untuk roles (`ADMIN`, `PERENCANAAN`, `KEUANGAN`, `MANAJER`) dan mengaitkannya dengan seeder permissions.
*   Mendaftarkan endpoint CRUD role baru.

---

### [Frontend - React / Vite]

#### [MODIFY] [App.jsx](file:///Users/wahyubudiman/Documents/prototype/pku_zulfirman/frontend/src/App.jsx)
*   **Menu Navigasi Sidebar**:
    *   Mengimplementasikan menu collapsible dropdown **"Konfigurasi Akses"** dengan ikon `Settings`.
    *   Sub-menu: Daftar Pengguna, Matriks RBAC, dan Pengaturan Peran.
*   **Dropdown Dinamis**:
    *   Mengambil daftar role dari backend untuk kolom tabel Matriks RBAC dan opsi dropdown tambah/edit user.
*   **Halaman Pengaturan Peran (Tab: `roles`)**:
    *   Menampilkan tabel peran, deskripsi, serta tombol edit/hapus.
    *   Menyediakan formulir modal untuk tambah/edit nama peran.

---

## Verification Plan

### Automated Tests
Verifikasi kompilasi backend Go:
```bash
cd backend && go build -o tmp/main main.go
```

### Manual Verification
1.  **Pengujian Tampilan Navigasi**: Pastikan menu "Konfigurasi Akses" ber-animasi buka/tutup dengan lancar saat diklik.
2.  **Pengujian Ubah Peran (Uji Kasus Kritis)**:
    *   Login sebagai admin, buat peran baru bernama `TESTER`.
    *   Beri centang beberapa izin pada tabel **Matriks RBAC** untuk peran `TESTER`.
    *   Daftarkan user baru dengan peran `TESTER`.
    *   Masuk to **Pengaturan Peran**, ubah nama `TESTER` menjadi `QUALITY CONTROL`.
    *   Verifikasi di database/UI bahwa user baru tadi sekarang otomatis memiliki peran `QUALITY CONTROL` dan daftar izin matriksnya berpindah dengan sukses tanpa ada data yang hilang.
