# Si Monang - Sistem Informasi Anggaran (Innovation Gateway 2027)

**Si Monang** adalah platform web modern kelas enterprise yang dikembangkan khusus untuk mengelola, memantau, dan melindungi pagu anggaran Program Rencana Kerja (PRK) serta monitoring administrasi kontrak kerja di unit internal PT PLN secara real-time.

Aplikasi ini mengadopsi tampilan futuristik gelap (*sleek dark mode*), visualisasi interaktif data keuangan, perlindungan pagu dinamis melalui sistem peringatan dini (EWS), pengawasan akuntabilitas melalui **Immutable Audit Trail Log**, persetujuan bertingkat (**Multi-level Approval Workflow**), manajemen **Revisi Pagu Adendum**, serta pembatasan hak akses berbasis izin granular (Dynamic RBAC).

---

## ⚡ Fitur Utama

### 1. Dashboard Executive & Analitik Penyerapan
*   **KPI Cards Finansial**: Informasi real-time mengenai Pagu Terbit, Pagu Terkontrak (Komitmen), Realisasi Bayar, dan Sisa Pagu Bebas.
*   **🔥 Heatmap Penyerapan Per Bidang / Satker**: Visualisasi grid card interaktif per unit pengusul (PEMELIHARAAN, SCADA, KKU, TRANSAKSI ENERGI, K3 & LINGKUNGAN) lengkap dengan indikator status kesehatan penyerapan (Optimal $\ge 80\%$, Moderat $\ge 50\%$, Kritis $<50\%$).
*   **Kurva S Target vs Realisasi**: Grafik recharts dinamis membandingkan akumulasi target prognosa dan realisasi bayar bulanan.
*   **Pie Chart Distribusi Penyerapan**: Porsi penyerapan dana riil untuk analisis alokasi anggaran yang efisien.
*   **Ekspor PDF Laporan**: Fitur cetak visual ramah printer untuk kebutuhan pelaporan eksekutif.

### 2. Manajemen PRK, Proteksi Pagu & Revisi Adendum
*   **Lock Pagu Keamanan**: Mencegah pembuatan/pembaruan nilai kontrak baru yang melampaui sisa kapasitas pagu PRK terkait.
*   **📝 Revisi Pagu Anggaran (Adendum / APBD-P)**: Pencatatan histori pergeseran/adendum pagu anggaran (`pagu_revisions`) lengkap dengan nomor SK adendum, perbandingan pagu lama vs baru, alasan pergeseran, dan modal viewer **Riwayat Revisi**.
*   **Status Keamanan Pagu**: Penanda otomatis kondisi anggaran: **AMAN**, **WARNING** (sisa pagu < 10%), dan **KRITIS** (pagu habis/EWS terdeteksi kritis).
*   **Ekspor CSV**: Mengunduh rekapitulasi data PRK ke format Excel.

### 3. Monitoring Kontrak & Multi-Level Approval Workflow
*   **Progress Administrasi**: Memantau nomor Nota Dinas (ND/AMS), tanggal terbit ND, User Bidang Pengusul, dan target durasi hari kerja.
*   **✍️ Multi-Level Approval Workflow**: State machine persetujuan bertingkat 4 tahap:
    *   `DRAFT` (Pencadangan oleh Bidang)
    *   `PENDING_APPROVAL` (Diajukan untuk Verifikasi Keuangan)
    *   `VERIFIED_FINANCE` (Diverifikasi oleh User Keuangan)
    *   `APPROVED_MANAGER` (Disetujui Final oleh Manajer)
    *   `REJECTED` (Ditolak dengan catatan pertimbangan perbaikan)
*   **Progress Realisasi Status**: Pengelompokan kontrak berdasarkan fase `DRAFT`, `PROSES` (berjalan), dan `SELESAI` (realisasi).

### 4. Immutable Audit Trail Log & Early Warning System (EWS)
*   **🛡️ Log Audit Transaksi (Audit Trail)**: Catatan permanen otomatis (`audit_logs`) yang merekam *siapa, kapan, jenis aksi, entitas target, nilai lama/baru, dan IP address* untuk menjaga akuntabilitas audit internal & kepatuhan hukum.
*   **Backlog Nota Dinas**: Alarm otomatis terpicu jika kontrak berstatus `PROSES` belum selesai dan durasi Nota Dinas melampaui **30 hari kerja**.
*   **Pagu Kritis**: Alarm otomatis jika sisa pagu PRK berada di bawah **10%** dari total pagu awal.
*   **Visual Warning**: Banner merah berdenyut (*pulsing glow alert*) pada baris tabel yang bermasalah serta notifikasi banner di Header utama.

### 5. Konfigurasi Akses Terpusat (Sub-Menu Dropdown)
*   👥 **Daftar Pengguna**: CRUD akun user internal PLN beserta penetapan perannya.
*   🔒 **Matriks RBAC**: Matriks checkbox untuk memetakan izin fungsional (`prk:write`, `contract:write`, `audit:read`, `pagu:revise`, `contract:approve_finance`, `contract:approve_manager`, dll) ke setiap jabatan secara dinamis.
*   🏷️ **Pengaturan Peran (Dynamic Roles CRUD)**: Menambah atau mengubah nama peran (Role) secara transaksional di database.
*   📜 **Log Audit Transaksi**: Sub-menu viewer untuk meninjau log jejak audit mutasi data.

---

## 🛠️ Stack Teknologi

*   **Go (Backend Service)**: Gin Web Framework, GORM ORM, PostgreSQL Driver, JWT Hashing, Air (Hot-Reloading), background EWS Goroutines.
*   **React (Frontend App)**: Vite, Tailwind CSS, Recharts (Data Visualization), Lucide React (Icons).
*   **Database**: PostgreSQL 17.

---

## 🚀 Panduan Instalasi & Jalankan Lokal

### Prasyarat
*   Sudah menginstal **Go (v1.22+)**
*   Sudah menginstal **Node.js (v20+)** dan package manager **pnpm**
*   Database **PostgreSQL** yang sedang berjalan (Host: `localhost`, Port: `5432`, DB: `simonang`).

### 1. Jalankan Backend Go (dengan Live-Reload `air`)
```bash
cd backend

# (Opsional) Install Air untuk live-reload otomatis saat kode disimpan
go install github.com/air-verse/air@latest

# Jalankan server (otomatis auto-migrate tabel & seeder)
air
# Atau jika tanpa air: go run main.go
```
*Server backend akan berjalan di port `http://localhost:8080`.*

### 2. Jalankan Frontend React
```bash
cd frontend
pnpm install
pnpm dev
```
*Akses aplikasi di browser Anda melalui URL: **`http://localhost:5173`**.*

---

## ☁️ Panduan Deployment Cloud
Aplikasi ini dirancang modular sehingga sangat mudah di-deploy ke arsitektur cloud terdistribusi secara gratis/affordable menggunakan **Supabase**, **Render**, dan **Vercel**. 

Untuk petunjuk deployment cloud selengkapnya, silakan baca dokumentasi berikut:
👉 **[Panduan Deployment Cloud](file:///Users/wahyubudiman/Documents/prototype/pku_zulfirman/docs/deployment_cloud_guide.md)**
