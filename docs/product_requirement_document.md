# Product Requirement Document (PRD) - Si Monang

Dokumen ini mendefinisikan persyaratan produk, fungsionalitas, matriks otorisasi, model data, aturan bisnis, serta status implementasi (fitur yang sudah terpasang dan rencana fitur mendatang) dari aplikasi **Si Monang** (*Sistem Informasi Anggaran* - Innovation Gateway 2027).

---

## 1. Glosarium & Istilah Bisnis

| Istilah Bisnis | Definisi & Penjelasan |
| :--- | :--- |
| **PRK** | **Program Rencana Kerja**, yaitu kode unik identitas program kerja anggaran (misalnya, `2026.DRKR.4.001` untuk investasi). |
| **Pagu** | Batas plafon anggaran tertinggi yang diterbitkan untuk masing-masing PRK. |
| **Kontrak** | Perikatan kerja sama pihak ketiga (vendor) yang dibebankan kepada suatu PRK. |
| **Nota Dinas (ND)** | Surat/nota dinas internal resmi dari Bidang Pengusul yang mendasari proses pengadaan dan menjadi acuan awal perhitungan durasi pengerjaan (AMS). |
| **Lock Pagu** | Fitur proteksi anggaran otomatis yang memastikan total nilai kontrak tidak boleh melebihi sisa pagu PRK terkait. |
| **Adendum / Revisi Pagu** | Pencatatan resmi pergeseran alokasi pagu PRK berbasis SK yang terekam dalam histori transaksional. |
| **Approval Workflow** | *State machine* persetujuan bertingkat 4 tahap: `DRAFT` ➔ `PENDING_APPROVAL` ➔ `VERIFIED_FINANCE` ➔ `APPROVED_MANAGER` (atau `REJECTED`). |
| **Immutable Audit Trail** | Log jejak audit permanen otomatis di basis data yang mencatat setiap mutasi data (siapa, kapan, aksi, entitas, IP address, payload lama & baru). |
| **EWS** | **Early Warning System**, mesin penjadwal latar belakang (*background goroutines*) yang memindai deviasi anggaran dan backlog secara real-time. |
| **Backlog Nota Dinas** | Kontrak berjalan (status `PROSES`) yang tanggal Nota Dinasnya telah melampaui **30 hari kerja** tanpa penyelesaian. |
| **Pagu Kritis** | Kondisi di mana sisa pagu anggaran bebas suatu PRK berada di bawah **10%** dari total pagu awal. |
| **Dynamic RBAC** | Kontrol akses dinamis berbasis matriks hak akses (*Permission-Based Access Control*) yang dapat diatur transaksional dari UI Web. |

---

## 2. Fitur yang SUDAH Diimplementasikan (Implemented Features)

Aplikasi **Si Monang** versi saat ini telah mengimplementasikan secara penuh (*100% Production Ready*) modul-modul utama berikut:

### A. Dashboard Executive & Analitik Penyerapan
*   **KPI Cards Finansial**: Menyajikan Pagu Terbit, Pagu Terkontrak (Komitmen), Realisasi Bayar, dan Sisa Pagu Bebas secara real-time.
*   **Heatmap Penyerapan Per Bidang / Satker**: Visualisasi grid card interaktif unit pengusul (*PEMELIHARAAN, SCADA, KKU, TRANSAKSI ENERGI, K3 & LINGKUNGAN*) lengkap dengan indikator status kesehatan penyerapan (Optimal $\ge 80\%$, Moderat $\ge 50\%$, Kritis $<50\%$).
*   **Kurva S Target vs Realisasi**: Grafik Recharts dinamis membandingkan akumulasi target prognosa dan realisasi bayar bulanan.
*   **Pie Chart Distribusi Penyerapan**: Porsi penyerapan dana riil untuk analisis alokasi anggaran yang efisien.
*   **Ekspor Laporan PDF & CSV**: Cetak tampilan visual dashboard (print-friendly) dan ekspor tabel rekap ke format CSV.

### B. Manajemen PRK & Proteksi Pagu (*Lock Pagu*)
*   **CRUD PRK & Pagu**: Input dan pengelolaan data PRK beserta alokasi nilai pagunya.
*   **Aturan Lock Pagu**: Validasi otomatis yang menolak pembuatan/pembaruan nilai kontrak baru yang melampaui sisa kapasitas pagu PRK terkait.
*   **Indikator Keamanan Pagu**: Penanda otomatis kondisi anggaran (`AMAN`, `WARNING`, `KRITIS`).

### C. Manajemen Revisi Pagu Adendum (APBD-P / Pergeseran)
*   **Modal Form Revisi Pagu**: Pencatatan histori pergeseran/adendum pagu anggaran (`pagu_revisions`) lengkap dengan nomor SK adendum, nilai pagu lama vs baru, dan alasan pergeseran.
*   **Viewer Riwayat Revisi**: Modal interaktif untuk meninjau jejak histori perubahan pagu PRK dari waktu ke waktu.

### D. Monitoring Kontrak & Multi-Level Approval Workflow
*   **Progress Administrasi ND/AMS**: Memantau nomor Nota Dinas, tanggal terbit ND, User Bidang Pengusul, dan target durasi hari kerja.
*   **Multi-Level Approval State Machine**:
    *   `DRAFT` (Pencadangan oleh Bidang)
    *   `PENDING_APPROVAL` (Diajukan untuk Verifikasi Keuangan)
    *   `VERIFIED_FINANCE` (Diverifikasi oleh User Keuangan)
    *   `APPROVED_MANAGER` (Disetujui Final oleh Manajer)
    *   `REJECTED` (Ditolak dengan catatan pertimbangan perbaikan)
*   **Status Realisasi**: Pengelompokan fase kontrak (`DRAFT`, `PROSES`, `SELESAI`).

### E. Immutable Audit Trail Log
*   **Automated Mutating Audit Logger**: Pencatatan log otomatis di backend Go untuk setiap operasi `CREATE`, `UPDATE`, `DELETE`, `APPROVE`, `REJECT`, dan `REVISE`.
*   **Detail Rekaman Log**: Merekam `user_id`, `username`, `aksi`, `entitas`, `entitas_id`, `detail_payload`, `ip_address`, dan `timestamp`.
*   **UI Audit Trail Viewer**: Menu khusus bagi Admin/Auditor untuk memantau log jejak audit transaksional.

### F. Early Warning System (EWS) Engine
*   **Background Worker Goroutine**: Engine latar belakang yang memindai database secara berkala untuk mengecek Backlog ND (>30 hari) & Pagu Kritis (<10%).
*   **Visual Warning Alerts**: Banner notifikasi di header utama dan baris tabel bermasalah yang menyala dengan efek **merah berdenyut (*pulsing glow*)**.

### G. Konfigurasi Akses Terpusat (Dynamic RBAC)
*   **Manajemen Peran (Roles CRUD)**: Menambah, mengubah, atau menghapus peran pengguna secara transaksional di database (`ADMIN`, `PERENCANAAN`, `KEUANGAN`, `MANAJER`).
*   **Matriks RBAC Checkbox UI**: Grid matriks checkbox interaktif di UI Web untuk mengaktifkan/menonaktifkan 10 hak akses granular (`prk:read`, `prk:write`, `pagu:revise`, `contract:read`, `contract:write`, `contract:approve_finance`, `contract:approve_manager`, `user:manage`, `rbac:manage`, `audit:read`).
*   **Dynamic Backend Middleware**: `PermissionMiddleware` di Go backend yang memverifikasi izin berbasis database secara real-time.

---

## 3. Fitur yang BELUM Diimplementasikan (Unimplemented / Future Roadmap)

Fitur-fitur berikut direncanakan untuk dikembangkan pada fase rilis berikutnya (Roadmap 2027):

| No | Nama Fitur / Modul | Deskripsi & Target Pengembangan | Status saat ini |
| :---: | :--- | :--- | :---: |
| 1 | **Real-Time WebSockets / SSE Alerts** | Menggantikan mekanika *polling* alert HTTP dengan koneksi WebSockets / Server-Sent Events (SSE) agar notifikasi EWS terdorong (*push notification*) secara instan tanpa reload. | ⏳ Backlog |
| 2 | **Integrasi API Sistem Enterprise PLN (AMS / SAP ERP / E-Proc)** | Integrasi otomatis REST API dua arah dengan sistem AMS (Aplikasi Manajemen Surat) PLN untuk sinkronisasi Nota Dinas & SAP ERP untuk pencairan realisasi anggaran. | ⏳ Backlog |
| 3 | **Multi-File Document Attachment (Upload PDF Kontrak & SK)** | Fitur upload dan penyimpanan berkas fisik PDF dokumen kontrak, nota dinas, dan SK Adendum ke Cloud Object Storage (MinIO / AWS S3 / Supabase Storage). | ⏳ Backlog |
| 4 | **AI Financial Forecasting & Predictive Analytics** | Penggunaan Machine Learning / Predictive Analytics untuk memprediksi risiko deviasi Kurva S dan keterlambatan proyek berdasarkan tren historis vendor. | ⏳ Backlog |
| 5 | **Email & WhatsApp Gateway Notification** | Pengiriman notifikasi peringatan EWS (pagu kritis & backlog ND) secara otomatis via email resmi perusahaan dan WhatsApp Gateway ke HP Manajer/Finance. | ⏳ Backlog |
| 6 | **SSO Enterprise Integration (OAuth2 / SAML / 2FA)** | Integrasi autentikasi Single Sign-On (SSO) PLN Active Directory dengan dukungan Multi-Factor Authentication (2FA). | ⏳ Backlog |

---

## 4. Matriks Otorisasi RBAC Dinamis (Dynamic Permission Matrix)

Berikut adalah tabel pemetaan izin default (*Permission Mapping*) yang dikelola secara dinamis melalui UI Matriks RBAC:

| Kode Izin (*Permission Code*) | Nama Deskripsi | ADMIN | PERENCANAAN | KEUANGAN | MANAJER |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `prk:read` | Membaca Data PRK & Pagu | ✓ | ✓ | ✓ | ✓ |
| `prk:write` | Tambah / Edit / Hapus PRK | ✓ | ✓ | - | - |
| `pagu:revise` | Melakukan Revisi Pagu Adendum | ✓ | ✓ | - | - |
| `contract:read` | Membaca Data Kontrak Kerja | ✓ | ✓ | ✓ | ✓ |
| `contract:write` | Tambah / Edit / Hapus Kontrak | ✓ | ✓ | - | - |
| `contract:approve_finance` | Verifikasi Keuangan Kontrak | ✓ | - | ✓ | - |
| `contract:approve_manager` | Persetujuan Manajer Kontrak | ✓ | - | - | ✓ |
| `user:manage` | Mengelola Account User | ✓ | - | - | - |
| `rbac:manage` | Mengelola Matriks Role & Permission | ✓ | - | - | - |
| `audit:read` | Meninjau Log Audit Transaksi | ✓ | - | - | - |

---

## 5. Model Data Relasional (Database Schema)

Skema basis data PostgreSQL aplikasi **Si Monang**:

*   `User`: Data akun pengguna (`id`, `name`, `username`, `password_hash`, `role`, `created_at`).
*   `Role`: Master peran pengguna (`name` [PK], `deskripsi`, `created_at`).
*   `Permission`: Master hak akses granular (`code` [PK], `nama`, `kategori`).
*   `RolePermission`: Relasi matriks izin (`role_name` [FK], `permission_code` [FK]).
*   `PRK`: Master Program Rencana Kerja (`id`, `nomor_prk`, `uraian_prk`, `jenis_anggaran`, `tahun`, `created_at`).
*   `Pagu`: Plafon anggaran terkait PRK (`id`, `prk_id` [FK], `nilai_pagu`, `tahun`, `created_at`).
*   `PaguRevision`: Histori adendum pagu (`id`, `prk_id` [FK], `nomor_sk`, `pagu_lama`, `pagu_baru`, `alasan`, `user_id` [FK], `created_at`).
*   `Contract`: Data perikatan kontrak kerja (`id`, `prk_id` [FK], `nomor_kontrak`, `judul_pekerjaan`, `vendor`, `nilai_kontrak`, `status_proses`, `approval_stage`, `tgl_nd`, `no_nd`, `user_bidang`, `hari_kerja`, `created_at`).
*   `AuditLog`: Permanent audit log (`id`, `user_id`, `username`, `aksi`, `entitas`, `entitas_id`, `detail`, `ip_address`, `created_at`).
*   `Alert`: Peringatan EWS (`id`, `contract_id` [FK, null], `prk_id` [FK, null], `tipe`, `pesan`, `created_at`).

---

## 6. Logika Aturan Bisnis Utama (Key Business Rules)

1.  **Zero Over-budget Protection (Lock Pagu)**:
    $$\sum \text{Nilai Kontrak}_{\text{PRK}_i} \le \text{Nilai Pagu}_{\text{PRK}_i}$$
    Sistem menolak pembuatan/pembaruan kontrak yang melampaui nilai pagu PRK terkait.
2.  **Validasi Revisi Pagu Adendum**:
    Penurunan nilai pagu PRK melalui fitur Revisi Adendum ditolak jika alokasi pagu baru lebih kecil dari akumulasi nilai kontrak yang sudah terkunci (`APPROVED` / `VERIFIED` / `PROSES`).
3.  **Strict Approval State Machine**:
    Transisi status persetujuan kontrak wajib mengikuti alur hirarki `DRAFT` ➔ `PENDING_APPROVAL` ➔ `VERIFIED_FINANCE` ➔ `APPROVED_MANAGER`. Pembatalan/penolakan (`REJECTED`) dapat dilakukan oleh Keuangan atau Manajer dengan mencantumkan alasan tertulis.
4.  **Immutable Audit Logging**:
    Setiap transaksi yang mengubah state basis data wajib menghasilkan entri log permanen di tabel `audit_logs` dan tidak dapat diubah maupun dihapus (*append-only*).
