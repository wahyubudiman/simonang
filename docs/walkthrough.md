# Walkthrough - Si Monang: EWS, Detail Monitoring, Ekspor Laporan, & Konfigurasi Akses Dinamis

Dokumen ini memandu Anda dalam meninjau dan menguji seluruh fungsionalitas yang telah diimplementasikan, termasuk struktur menu baru dan **Manajemen Peran Dinamis (Sprint 5)**.

---

## 1. Rangkuman Perubahan (Sprint 5)

### A. Pengelompokan Sub-Menu
*   **[frontend/src/App.jsx](file:///Users/wahyubudiman/Documents/prototype/pku_zulfirman/frontend/src/App.jsx)**:
    *   Menu **Pengaturan User** dan **Matriks RBAC** kini disatukan di bawah satu grup menu lipat (collapsible dropdown) bernama **Konfigurasi Akses** dengan ikon `Settings`.
    *   Menambahkan sub-menu baru ketiga: **Pengaturan Peran**.

### B. Fitur Baru: Pengaturan Peran Dinamis (Roles CRUD)
*   **[backend/internal/models/models.go](file:///Users/wahyubudiman/Documents/prototype/pku_zulfirman/backend/internal/models/models.go)**:
    *   Mendefinisikan entitas database `Role` baru.
*   **[backend/internal/handlers/rbac.go](file:///Users/wahyubudiman/Documents/prototype/pku_zulfirman/backend/internal/handlers/rbac.go)**:
    *   Menambahkan handler API untuk mengelola peran: `GET /api/rbac/roles`, `POST /api/rbac/roles`, `PUT /api/rbac/roles/:name`, dan `DELETE /api/rbac/roles/:name`.
    *   Saat nama peran diperbarui (contoh: `PERENCANAAN` menjadi `DIVISI PERENCANAAN`), sistem memproses migrasi data di user & role_permissions secara transaksional (`tx.Begin()`).
*   **[backend/main.go](file:///Users/wahyubudiman/Documents/prototype/pku_zulfirman/backend/main.go)**:
    *   Mendaftarkan migrasi model `Role`, seeder data peran bawaan, dan endpoint API CRUD peran baru.

---

## 2. Panduan Pengujian Fitur Dinamis (Sprint 5)

1.  Jalankan server database, Go backend, dan React frontend.
2.  Buka web browser dan login menggunakan akun **Super Admin** (`admin` / `admin123`).
3.  **Uji Coba Collapsible Menu**:
    *   Perhatikan sidebar kiri. Menu manajemen user kini terbungkus rapi di dalam dropdown **Konfigurasi Akses**.
    *   Klik **Konfigurasi Akses** untuk melipat atau membuka daftar sub-menu: **Daftar Pengguna**, **Matriks RBAC**, dan **Pengaturan Peran**.
4.  **Uji Coba Tambah Peran Baru**:
    *   Buka sub-menu **Pengaturan Peran** $\rightarrow$ klik **Tambah Peran Baru**.
    *   Masukkan Nama Peran: `TESTER` dan deskripsi singkat, lalu klik **Simpan Peran**.
    *   Buka sub-menu **Matriks RBAC**. Sekarang kolom peran `TESTER` otomatis muncul sebagai kolom baru di tabel matriks! Centang beberapa izin untuk peran `TESTER` dan simpan.
5.  **Uji Coba Ubah Nama Peran (Transaksional)**:
    *   Daftarkan user baru di sub-menu **Daftar Pengguna** dengan nama peran `TESTER`.
    *   Buka kembali **Pengaturan Peran** $\rightarrow$ klik tombol **Edit** (ikon biru) di baris `TESTER`.
    *   Ubah namanya menjadi `QUALITY ASSURANCE`, lalu klik **Simpan Peran**.
    *   **Verifikasi**:
        *   Di sub-menu **Daftar Pengguna**, pastikan peran user yang Anda daftarkan tadi otomatis berubah menjadi `QUALITY ASSURANCE`.
        *   Di sub-menu **Matriks RBAC**, pastikan kolom `TESTER` berubah nama menjadi `QUALITY ASSURANCE` dan seluruh status centang izinnya ter-migrasi dengan utuh.
