# Si Monang - Sistem Informasi Anggaran (Innovation Gateway 2027)

**Si Monang** adalah platform web modern kelas enterprise yang dikembangkan khusus untuk mengelola, memantau, dan melindungi pagu anggaran Program Rencana Kerja (PRK) serta monitoring administrasi kontrak kerja di unit internal PT PLN secara real-time.

Aplikasi ini mengadopsi tampilan futuristik gelap (*sleek dark mode*), visualisasi interaktif data keuangan, perlindungan pagu dinamis melalui sistem peringatan dini (EWS), serta pembatasan hak akses berbasis izin granular (Dynamic RBAC).

---

## ⚡ Fitur Utama

### 1. Dashboard Executive Anggaran
*   **KPI Cards Finansial**: Informasi real-time mengenai Pagu Terbit, Pagu Terkontrak (Komitmen), Realisasi Bayar, dan Sisa Pagu Bebas.
*   **Kurva S Target vs Realisasi**: Grafik recharts dinamis membandingkan akumulasi target prognosa dan realisasi bayar bulanan.
*   **Pie Chart Distribusi Penyerapan**: Porsi penyerapan dana riil untuk analisis alokasi anggaran yang efisien.
*   **Ekspor PDF Laporan**: Fitur cetak visual ramah printer untuk kebutuhan pelaporan eksekutif.

### 2. Manajemen PRK & Proteksi Pagu (CRUD)
*   **Lock Pagu Keamanan**: Mencegah pembuatan/pembaruan nilai kontrak baru yang melampaui sisa kapasitas pagu PRK terkait.
*   **Status Keamanan Pagu**: Penanda otomatis kondisi anggaran: **AMAN**, **WARNING** (sisa pagu < 10%), dan **KRITIS** (pagu habis/EWS terdeteksi kritis).
*   **Ekspor CSV**: Mengunduh rekapitulasi data PRK ke format Excel.

### 3. Monitoring Kontrak & Nota Dinas
*   **Progress Administrasi**: Memantau nomor Nota Dinas (ND/AMS), tanggal terbit ND, User Bidang Pengusul (PEMELIHARAAN, SCADA, KKU, K3, dll), dan target durasi hari kerja.
*   **Progress Status**: Pengelompokan kontrak berdasarkan fase `DRAFT` (pencadangan), `PROSES` (berjalan), dan `SELESAI` (realisasi).

### 4. Early Warning System (EWS) Mandiri
*   **Backlog Nota Dinas**: Alarm otomatis terpicu jika kontrak berstatus `PROSES` belum selesai dan durasi Nota Dinas melampaui **30 hari kerja**.
*   **Pagu Kritis**: Alarm otomatis jika sisa pagu PRK berada di bawah **10%** dari total pagu awal.
*   **Visual Warning**: Banner merah berdenyut (*pulsing glow alert*) pada baris tabel yang bermasalah serta notifikasi banner di Header utama.

### 5. Konfigurasi Akses Terpusat (Sub-Menu Dropdown)
*   👥 **Daftar Pengguna**: CRUD akun user internal PLN beserta penetapan perannya.
*   🔒 **Matriks RBAC**: Matriks checkbox untuk memetakan izin fungsional (`prk:write`, `contract:write`, dll) ke setiap jabatan secara dinamis.
*   🏷️ **Pengaturan Peran (Dynamic Roles CRUD)**: Menambah atau mengubah nama peran (Role) secara transaksional di database (otomatis memindahkan relasi pengguna dan izin).

---

## 🛠️ Stack Teknologi

*   **Go (Backend Service)**: Gin Web Framework, GORM ORM, PostgreSQL Driver, JWT Authentication, Bcrypt Password Hashing, background EWS Goroutines.
*   **React (Frontend App)**: Vite, Tailwind CSS, Recharts (Data Visualization), Lucide React (Icons).
*   **Database**: PostgreSQL.

---

## 🚀 Panduan Instalasi Lokal

### Prasyarat
*   Sudah menginstal **Go (v1.21+)**
*   Sudah menginstal **Node.js (v20+)** dan package manager **pnpm** (atau `npm`)
*   Database **PostgreSQL** yang sedang berjalan.

### 1. Setup Database
Buat database kosong bernama `simonang` di instance PostgreSQL lokal Anda.

### 2. Jalankan Backend Go
1.  Masuk ke direktori backend:
    ```bash
    cd backend
    ```
2.  Konfigurasi variabel lingkungan (opsional, jika database Anda tidak menggunakan port/user default):
    ```bash
    export DB_HOST=localhost
    export DB_PORT=5432
    export DB_USER=postgres
    export DB_PASSWORD=yourpassword
    export DB_NAME=simonang
    ```
3.  Jalankan server backend (otomatis melakukan migrasi tabel & seeder data awal):
    ```bash
    go run main.go
    ```
    *Server backend akan berjalan di port `http://localhost:8080`.*

### 3. Jalankan Frontend React
1.  Masuk ke direktori frontend:
    ```bash
    cd ../frontend
    ```
2.  Instal dependensi modul:
    ```bash
    pnpm install  # atau npm install
    ```
3.  Jalankan dev server:
    ```bash
    pnpm dev      # atau npm run dev
    ```
    *Akses aplikasi di browser Anda melalui url: `http://localhost:5173`.*

---

## ☁️ Panduan Deployment Cloud
Aplikasi ini dirancang modular sehingga sangat mudah di-deploy ke arsitektur cloud terdistribusi secara gratis/affordable menggunakan **Supabase**, **Render**, dan **Vercel**. 

Untuk petunjuk deployment cloud selengkapnya, silakan baca dokumentasi berikut:
👉 **[Panduan Deployment Cloud](file:///Users/wahyubudiman/Documents/prototype/pku_zulfirman/docs/deployment_cloud_guide.md)**
