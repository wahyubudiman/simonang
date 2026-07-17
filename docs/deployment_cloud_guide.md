# Panduan Deployment Cloud: Supabase, Render, & Vercel - Si Monang

Dokumen ini menjelaskan langkah demi langkah untuk melakukan *deployment* mandiri aplikasi **Si Monang** ke platform cloud gratis/affordable: **Supabase** (Database PostgreSQL), **Render** (Go Backend), dan **Vercel** (React Frontend).

```mermaid
flowchart TD
    User([Pengguna / Browser]) <--> |Akses Web UI| Vercel[React Frontend on Vercel]
    Vercel <--> |Request API| Render[Go Backend on Render]
    Render <--> |Kueri SQL / Transaksi| Supabase[(PostgreSQL on Supabase)]
```

---

## 💾 Langkah 1: Setup PostgreSQL di Supabase

Supabase menyediakan database PostgreSQL managed-service. Karena Render tier gratis tidak mendukung jaringan outbound IPv6, kita **wajib** menggunakan alamat Connection Pooler (IPv4).

1.  **Daftar/Login**: Masuk ke [Supabase](https://supabase.com).
2.  **Buat Project Baru**:
    *   Masukkan Nama Project: `simonang-db`.
    *   Masukkan Password Database (Catat password ini untuk konfigurasi Render).
    *   Pilih Region terdekat (contoh: **Singapore (ap-southeast-1)**).
    *   Pilih tier gratis (*Free Tier*) $\rightarrow$ klik **Create new project**.
3.  **Dapatkan Alamat Connection Pooler (Wajib IPv4)**:
    *   Setelah proyek aktif, masuk ke **Settings** (ikon gerigi) $\rightarrow$ **Database**.
    *   Scroll ke bawah ke bagian **Connection Pooler**.
    *   Salin data parameter koneksi:
        *   **Host**: Formatnya seperti `aws-0-[region].pooler.supabase.com` (Contoh: `aws-0-ap-southeast-2.pooler.supabase.com`)
        *   **Database Name**: `postgres` (Nama database default Supabase, *jangan diganti ke simonang*)
        *   **Port**: `6543` (Port wajib untuk pooler IPv4)
        *   **User**: `postgres.[id-proyek-Anda]` (Contoh: `postgres.epchautlangrorrzdtsl`)

---

## 🚀 Langkah 2: Deploy Go Backend di Render

1.  **Daftar/Login**: Masuk ke [Render](https://render.com) menggunakan akun GitHub Anda.
2.  **Buat Web Service Baru**:
    *   Klik **New +** $\rightarrow$ **Web Service** $\rightarrow$ Hubungkan repositori Git proyek Anda.
3.  **Konfigurasi Parameter Web Service**:
    *   **Name**: `simonang-backend`
    *   **Language**: `Go`
    *   **Root Directory**: `backend` *(Sangat penting! Jika dikosongkan, Render akan gagal karena go.mod tidak di root).*
    *   **Build Command**: `go build -o main main.go`
    *   **Start Command**: `./main`
4.  **Konfigurasi Environment Variables**:
    Klik bagian **Advanced** $\rightarrow$ **Add Environment Variable**:
    
    | Key | Value di Render | Keterangan |
    | :--- | :--- | :--- |
    | `DB_HOST` | `aws-0-...pooler.supabase.com` | Host dari menu Connection Pooler Supabase |
    | `DB_PORT` | `6543` | Port wajib Connection Pooler |
    | `DB_USER` | `postgres.[id-proyek]` | Username lengkap dari pooler Supabase |
    | `DB_PASSWORD`| *[Password DB Supabase Anda]* | Password database yang Anda buat saat inisiasi |
    | `DB_NAME` | `postgres` | Harus `postgres` |
    | `JWT_SECRET` | *[String Acak Kuat]* | Contoh: `simonangsupersecretjwtkey123!` |
    | `GIN_MODE` | `release` | Mengaktifkan optimasi performa rilis Go |

5.  **Deploy**: Klik **Create Web Service**. Tunggu hingga logs menunjukkan status **Live**.

---

## 💻 Langkah 3: Deploy React Frontend di Vercel

1.  **Daftar/Login**: Masuk ke [Vercel](https://vercel.com).
2.  **Impor Project**:
    *   Klik **Add New** $\rightarrow$ **Project** $\rightarrow$ Impor repositori Git proyek Anda.
    *   *(Jika repositori tidak terlihat, klik **Configure GitHub App** di bagian bawah repositori Vercel untuk memberikan izin akses).*
3.  **Konfigurasi Parameter Project**:
    *   **Framework Preset**: `Vite`
    *   **Root Directory**: Pilih folder `frontend`
    *   **Build & Development Settings**: Biarkan default (`vite build` dan `dist`)
4.  **Konfigurasi Environment Variables**:
    Buka bagian **Environment Variables** dan tambahkan:
    
    | Key | Value | Keterangan |
    | :--- | :--- | :--- |
    | `VITE_API_URL` | `https://simonang.onrender.com` | URL endpoint Web Service Render Anda |

    *Pastikan mencentang ketiga opsi lingkungan: **Production, Preview, dan Development**.*
5.  **Deploy**: Klik **Deploy**.
6.  **Penting - Redeploy**: Setiap kali ada perubahan nilai variabel lingkungan di Vercel, Anda **wajib** melakukan re-deploy proyek (masuk ke tab **Deployments** $\rightarrow$ klik titik tiga $\rightarrow$ **Redeploy**) agar file React dikompilasi ulang dengan variabel baru.

---

## 🔍 Langkah 4: Pengujian & Validasi Integrasi

1.  Buka URL produksi utama Vercel Anda (e.g. `https://simonang.vercel.app`).
2.  Gunakan akun demo bawaan (e.g. `admin` / `admin123`).
3.  Server Render memiliki program auto-migration bawaan, sehingga saat backend pertama kali terhubung ke Supabase, seluruh skema tabel akan terbentuk otomatis tanpa perlu konfigurasi manual!

---

## 🔗 Lampiran: Cara Kerja Penghubung Vercel & Render

Vercel (Frontend React) dan Render (Backend Go) terhubung menggunakan protokol HTTP/REST API melalui jaringan internet. Berikut penjelasannya:

1.  **Variabel Environment `VITE_API_URL`**:
    Di dalam kode frontend React ([App.jsx](file:///Users/wahyubudiman/Documents/prototype/pku_zulfirman/frontend/src/App.jsx)), endpoint API tidak ditulis secara statis (`localhost`), melainkan dibaca dari variabel lingkungan:
    ```javascript
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    ```
    Saat Anda mengisi `VITE_API_URL` dengan URL Render Anda (misalnya `https://simonang.onrender.com`) di pengaturan dashboard Vercel, program React saat dicompile akan mengarahkan semua kueri `fetch()` ke server Render Anda.

2.  **CORS (Cross-Origin Resource Sharing)**:
    Karena domain web frontend Vercel (e.g. `https://pku-zulfirman.vercel.app`) berbeda dengan domain API Render (e.g. `https://simonang.onrender.com`), browser secara default akan memblokir request demi keamanan jika tidak diizinkan oleh backend.
    
    Aplikasi backend Go kita sudah otomatis dikonfigurasi untuk mengizinkan hal ini di berkas [main.go](file:///Users/wahyubudiman/Documents/prototype/pku_zulfirman/backend/main.go) menggunakan middleware CORS:
    ```go
    r.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"http://localhost:5173", "*"},
        AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
        ExposeHeaders:    []string{"Content-Length"},
        AllowCredentials: true,
        MaxAge:           12 * time.Hour,
    }))
    ```
    Penggunaan tanda bintang (`"*"`) memastikan domain Vercel Anda dapat mengirimkan request data dengan lancar tanpa ada error *CORS Blocked* di konsol browser.
