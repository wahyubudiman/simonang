# Panduan Git & Keamanan Kode: Si Monang

Dokumen ini memandu Anda dalam melakukan setup Git lokal dengan aman, memastikan **tidak ada data sensitif** (seperti password database, JWT secret, atau file biner terkompilasi) yang bocor ke repositori publik seperti GitHub.

---

## 🔒 1. Perlindungan Data Sensitif dengan `.gitignore`

Kami telah memasang berkas **[.gitignore](file:///Users/wahyubudiman/Documents/prototype/pku_zulfirman/.gitignore)** di root proyek Anda untuk secara otomatis mengecualikan berkas-berkas rawan berikut:

*   **Berkas Lingkungan (`.env`, `.env.local`)**: Menyimpan kredensial database Supabase dan token JWT API.
*   **Modul Dependensi Node (`node_modules/`)**: Folder pustaka frontend yang ukurannya sangat besar dan tidak perlu diunggah.
*   **Biner Terkompilasi Go (`backend/tmp/`, `backend/main`)**: File hasil kompilasi backend yang dijalankan secara lokal.
*   **Metadata OS/IDE (`.DS_Store`, `.vscode/`)**: Berkas sampah bawaan macOS/Windows dan pengaturan editor.

> [!CAUTION]
> Jangan pernah mengedit atau menghapus berkas `.gitignore` tanpa meneliti implikasinya. Kebocoran file `.env` di repositori publik GitHub dapat menyebabkan database Supabase Anda disalahgunakan oleh pihak ketiga.

---

## 🚀 2. Panduan Inisialisasi Git Langkah demi Langkah

Jalankan perintah berikut di aplikasi terminal pada root direktori proyek (`/Users/wahyubudiman/Documents/prototype/pku_zulfirman`):

### A. Inisialisasi Repositori Git Lokal
```bash
git init
```

### B. Periksa Status Berkas yang Diabaikan
Jalankan perintah ini untuk memastikan `.gitignore` berfungsi:
```bash
git status
```
*Pastikan folder `node_modules`, folder `backend/tmp`, file `.env`, dan biner kompilasi **TIDAK muncul** dalam daftar "Untracked files". Hanya folder sumber kode seperti `backend/internal`, `frontend/src`, `.github/`, dan dokumen konfigurasi yang boleh terdaftar.*

### C. Tambahkan Berkas ke Staging Area & Lakukan Commit Pertama
```bash
git add .
git commit -m "feat: inisialisasi repositori proyek Si Monang dengan setup RBAC dinamis dan proteksi gitignore"
```

### D. Hubungkan & Push ke GitHub
1.  Buat repositori baru di akun [GitHub](https://github.com) Anda (pilih jenis **Private** untuk keamanan internal).
2.  Hubungkan repositori lokal Anda ke repositori GitHub yang baru dibuat:
```bash
git branch -M main
git remote add origin https://github.com/USERNAME_ANDA/NAMA_REPO_ANDA.git
git push -u origin main
```

---

## 🔍 3. Cara Mengamankan Kredensial Saat Deploy di Cloud

Untuk tetap menjaga keamanan data sensitif tanpa mengunggah file `.env` ke GitHub, gunakan mekanisme **Environment Variables** bawaan platform hosting:

1.  **Di Render (Go Backend)**: Masukkan variabel `DB_PASSWORD`, `JWT_SECRET`, dll melalui menu **Environment Variables** di panel dashboard Render.
2.  **Di Vercel (React Frontend)**: Masukkan variabel `VITE_API_URL` melalui menu **Environment Variables** di dashboard Vercel.
3.  **Di Supabase (Database)**: Password database hanya didefinisikan saat pembuatan proyek dan tidak boleh disematkan di dalam kode backend manapun (cukup dibaca via `os.Getenv("DB_PASSWORD")`).
