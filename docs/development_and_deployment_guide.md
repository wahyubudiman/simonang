# Panduan Pengembangan & Deployment Lokal - Si Monang

Dokumen ini memuat petunjuk lengkap untuk setup pengembangan secara hibrida di macOS, penjelasan penggunaan pustaka **Air** (*live-reloading* Go), metode deployment kontainer Docker, serta alur pengujian hak akses peran (**Multi-level Approval & RBAC**).

---

## ⚡ 1. Tentang Pustaka Live-Reloading `air`

Di dalam folder `backend/` terdapat berkas konfigurasi **`.air.toml`**. 

### Apa fungsi `air`?
`Air` adalah pustaka *Hot-Reloading* CLI untuk aplikasi bahasa Go. 
*   **Masalah Tanpa Air**: Setiap kali Anda mengubah kode Go (seperti menambah route baru atau memperbarui logika handler), Anda harus menghentikan server secara manual (`Ctrl + C`) dan menjalankan ulang `go run main.go`.
*   **Solusi Dengan Air**: `air` mengamati seluruh perubahan berkas `.go`. Saat Anda menyimpan berkas (`Cmd + S`), `air` secara otomatis melakukan kompilasi ulang biner ke direktori `./tmp/main` dan merestart server dalam orde milidetik **tanpa mematikan sesi terminal Anda**.

---

## 💻 2. Opsi A: Pengembangan Hibrida (Direkomendasikan)

Metode ini paling efisien untuk pengembangan sehari-hari: Database PostgreSQL berjalan di dalam kontainer, sedangkan Backend (Go) dan Frontend (React) dijalankan secara *native* di laptop Mac Anda.

### Prasyarat Sistem
1.  **Go Runtime** (v1.22+): `brew install go`
2.  **Node.js & pnpm**: `brew install node && npm install -g pnpm`
3.  **Docker Desktop** atau **Apple Container CLI** (untuk kontainer DB `simonang-db`).

### Langkah-Langkah Jalankan
1.  **Jalankan Database PostgreSQL di Kontainer**:
    ```bash
    container run -d \
      --name simonang-db \
      --publish 5432:5432 \
      -e POSTGRES_USER=postgres \
      -e POSTGRES_PASSWORD=secretpassword \
      -e POSTGRES_DB=simonang \
      postgres:17-alpine
    ```
2.  **Jalankan Backend Go (Terminal 1)**:
    ```bash
    cd backend
    export DB_HOST=localhost
    export DB_PORT=5432
    export DB_USER=postgres
    export DB_PASSWORD=secretpassword
    export DB_NAME=simonang
    export JWT_SECRET=simonangsupersecretjwtkey123!
    export PORT=8080
    
    # Install & Jalankan Air (Live-Reload)
    go install github.com/air-verse/air@latest
    air
    ```
    *(Atau tanpa Air: `go run main.go`)*.

3.  **Jalankan Frontend React (Terminal 2)**:
    ```bash
    cd frontend
    pnpm install
    pnpm dev
    ```
    Aplikasi dapat diakses di browser: 👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🐳 3. Opsi B: Deployment Full Container (`./run_containers.sh`)

Metode ini digunakan jika Anda ingin menjalankan seluruh komponen (PostgreSQL, Backend, Frontend) terisolasi di dalam container Docker.

```bash
# Untuk menjalankan seluruh kontainer:
./run_containers.sh

# Untuk menghentikan seluruh kontainer:
./stop_containers.sh
```

---

## 👥 4. Akun Uji Coba Default & Alur Approval Workflow

Sistem telah dilengkapi seeder data pengguna awal untuk menguji **Multi-level Approval Workflow** dan **Immutable Audit Trail Log**:

| Username | Password | Peran (Role) | Wewenang & Hak Akses |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | **ADMIN** | Super User (Akses Penuh Seluruh Fitur & RBAC Matrix) |
| `perencanaan` | `ren123` | **PERENCANAAN** | Pengusul (Buat PRK, Kontrak Baru, `SUBMIT` Pengajuan) |
| `keuangan` | `keu123` | **KEUANGAN** | Verifikator (Verifikasi Dokumen, `VERIFY` / `REJECT` Kontrak) |
| `manajer` | `boss123` | **MANAJER** | Approval Final (Eksekutif Viewer, `APPROVE` / `REJECT` Kontrak) |

### Skema Pengujian Approval Workflow Kontrak:
1. Login sebagai `perencanaan` $\rightarrow$ Buat kontrak baru $\rightarrow$ Klik tombol **`Ajukan`** (`SUBMIT`).
2. Logout & Login sebagai `keuangan` $\rightarrow$ Periksa kelengkapan $\rightarrow$ Klik tombol **`Verifikasi`** (`VERIFY`) atau **`Tolak`** (`REJECT` + catatan).
3. Logout & Login sebagai `manajer` $\rightarrow$ Tinjau alokasi anggaran $\rightarrow$ Klik tombol **`Setujui`** (`APPROVE`) untuk otorisasi final.
4. Login sebagai `admin` $\rightarrow$ Buka sub-menu **Log Audit Transaksi** untuk meninjau rekaman jejak mutasi permanen (*Audit Trail*).
