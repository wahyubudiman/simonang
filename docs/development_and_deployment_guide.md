# Panduan Pengembangan & Deployment Lokal - Si Monang

Dokumen ini memuat langkah-langkah lengkap untuk setup pengembangan secara hibrida di macOS, serta metode deployment mandiri kontainer Docker untuk keperluan pengujian.

---

## 1. Opsi A: Pengembangan Hibrida (Native + Container DB) - Direkomendasikan

Metode ini paling efisien untuk menulis kode: Database PostgreSQL berjalan di dalam kontainer, sedangkan Backend (Go) dan Frontend (React) dijalankan secara native di macOS Anda untuk fitur live-reload yang cepat.

### Prasyarat Sistem (Prerequisites)
Pastikan laptop Mac Anda sudah terpasang:
1.  **Go (Golang) Runtime** (v1.22 atau versi terbaru):
    ```bash
    brew install go
    ```
2.  **Node.js & npm** (termasuk pnpm):
    ```bash
    brew install node
    npm install -g pnpm
    ```
3.  **Docker Desktop** atau **Apple Container CLI** (untuk kontainer database).

### Langkah-Langkah Setup
1.  **Jalankan Database PostgreSQL di Kontainer**:
    Jalankan perintah ini untuk menyalakan database PostgreSQL 17 di latar belakang:
    ```bash
    container run -d \
      --name simonang-db \
      --publish 5432:5432 \
      -e POSTGRES_USER=postgres \
      -e POSTGRES_PASSWORD=secretpassword \
      -e POSTGRES_DB=simonang \
      postgres:17-alpine
    ```
2.  **Jalankan Backend Go secara Native**:
    Masuk ke direktori backend, ekspor konfigurasi database, dan jalankan:
    ```bash
    cd backend
    export DB_HOST=localhost
    export DB_PORT=5432
    export DB_USER=postgres
    export DB_PASSWORD=secretpassword
    export DB_NAME=simonang
    export JWT_SECRET=simonangsupersecretjwtkey123!
    export PORT=8080
    
    # Jalankan live-reload tool (Air)
    go install github.com/air-verse/air@latest
    air
    ```
3.  **Jalankan Frontend React secara Native**:
    Buka tab terminal baru, masuk ke direktori frontend, lalu jalankan dev server:
    ```bash
    cd frontend
    pnpm install
    pnpm dev
    ```
    Aplikasi dapat diakses di: 👉 **[http://localhost:5173](http://localhost:5173)**

---

## 2. Opsi B: Deployment Penuh Kontainer (Docker Compose)

Metode ini digunakan untuk menguji aplikasi secara keseluruhan di dalam lingkungan kontainer yang identik dengan kondisi produksi.

### Cara Menjalankan
1.  Jalankan Docker Compose di root folder proyek:
    ```bash
    docker-compose up --build
    ```
2.  Akses aplikasi web di: 👉 **[http://localhost:5173](http://localhost:5173)**
3.  Untuk menghentikan dan menghapus seluruh kontainer serta volumenya:
    ```bash
    docker-compose down -v
    ```

---

## 3. Akun Uji Coba Default (Demo Accounts)

Sistem telah dilengkapi data awal pengguna (seeder) untuk pengujian RBAC:

| Username | Password | Role | Deskripsi |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | **ADMIN** | Super Admin (akses kelola user & data anggaran) |
| `perencanaan` | `ren123` | **PERENCANAAN** | User Perencanaan (bisa buat PRK & Kontrak baru) |
| `keuangan` | `keu123` | **KEUANGAN** | User Keuangan (read-only, verifikator bayar) |
| `manajer` | `boss123` | **MANAJER** | Supervisor / Manager (read-only, dashboard viewer) |
