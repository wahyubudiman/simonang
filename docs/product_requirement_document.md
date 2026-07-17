# Product Requirement Document (PRD) - Si Monang

Dokumen ini mendefinisikan persyaratan produk, fungsionalitas, model data, dan aturan bisnis dari aplikasi **Si Monang** (Sistem Informasi Monitoring Anggaran).

---

## 1. Glosarium & Istilah Bisnis

| Istilah Bisnis | Definisi & Penjelasan |
| :--- | :--- |
| **PRK** | **Program Rencana Kerja**, yaitu kode unik identitas program kerja anggaran (misalnya, `2026.DRKR.4.001` untuk investasi). |
| **Pagu** | Batas plafon anggaran tertinggi yang diterbitkan untuk masing-masing PRK. |
| **Kontrak** | Perikatan kerja sama pihak ketiga (vendor) yang dibebankan kepada suatu PRK. |
| **Nota Dinas (ND)** | Surat/nota dinas internal resmi dari Bidang Pengusul yang mendasari proses pengadaan dan menjadi acuan awal perhitungan durasi pengerjaan. |
| **Nilai Kontrak** | Jumlah nominal Rupiah yang mengikat anggaran PRK terkait. |
| **Lock Pagu** | Fitur proteksi anggaran otomatis yang memastikan total nilai kontrak tidak boleh melebihi sisa pagu PRK terkait. |
| **EWS** | **Early Warning System**, mesin penjadwal latar belakang yang memindai deviasi anggaran dan backlog secara real-time. |
| **Backlog Nota Dinas** | Kontrak berjalan (status `PROSES`) yang tanggal Nota Dinasnya telah melampaui **30 hari kerja** tanpa penyelesaian. |
| **Pagu Kritis** | Kondisi di mana sisa pagu anggaran bebas suatu PRK berada di bawah **10%** dari total pagu awal. |
| **Realisasi** | Anggaran yang sudah selesai dibayarkan kepada pihak ketiga (status kontrak `SELESAI`). |
| **Komitmen** | Anggaran yang sudah terikat oleh kontrak berjalan namun belum sepenuhnya cair (status kontrak `PROSES` / `DRAFT`). |

---

## 2. Matriks Hak Akses Pengguna (User RBAC Matrix)

Sistem menggunakan otorisasi berbasis peran (**Role-Based Access Control**) untuk menjaga integritas data keuangan:

| Fitur / Modul | ADMIN | PERENCANAAN | KEUANGAN | MANAJER |
| :--- | :---: | :---: | :---: | :---: |
| **Melihat Dashboard & S-Curve** | ✓ | ✓ | ✓ | ✓ |
| **Membaca Data PRK & Kontrak** | ✓ | ✓ | ✓ | ✓ |
| **Tambah / Edit / Hapus PRK** | ✓ | ✓ | - | - |
| **Tambah / Edit / Hapus Kontrak** | ✓ | ✓ | - | - |
| **Manajemen Pengguna (User RBAC)** | ✓ | - | - | - |
| **Menerima Banner Peringatan EWS** | ✓ | ✓ | ✓ | ✓ |
| **Melakukan Ekspor Data (Excel/PDF)** | ✓ | ✓ | ✓ | ✓ |

---

## 3. Fitur dan Fungsi Utama

### A. Dashboard Prognosa & Kurva S
*   **Visualisasi KPI Keuangan**: Menyajikan total Pagu Terbit, total Terkontrak, total Realisasi Pembayaran, dan Sisa Pagu Anggaran secara interaktif.
*   **Kurva S (S-Curve)**: Grafik perbandingan akumulasi target prognosis bulanan dengan realisasi pembayaran aktual.
*   **Donut Chart Distribusi**: Menunjukkan persentase realisasi riil terhadap komitmen kontrak dan sisa dana bebas.

### B. Manajemen Pemetaan Anggaran (PRK & Pagu)
*   Formulir CRUD lengkap untuk mengelola PRK dengan atribut: Nomor PRK, Uraian, Jenis Anggaran (Operasi / Investasi), Tahun, dan Nilai Pagu.
*   Penerapan aturan *Lock Pagu* pada aksi penyuntingan nominal pagu.

### C. Monitoring Kontrak & Nota Dinas
*   Formulir CRUD lengkap untuk menginput kontrak dengan atribut: Nomor Kontrak, Judul Pekerjaan, Vendor, Nilai, Status, serta opsional detail Nota Dinas (Nomor ND, Tanggal ND, Bidang Pengusul, Hari Kerja).
*   Validasi otomatis sisa pagu saat simpan/edit kontrak.

### D. Early Warning System (EWS) Engine
*   Background worker backend yang secara terus-menerus memindai anomali data di database.
*   Menghasilkan notifikasi banner visual dan mewarnai baris tabel yang kritis dengan efek **merah berdenyut (pulsing glow)**.

### E. Ekspor Data
*   **Ekspor PDF**: Mengunduh tata letak visual halaman dashboard utama dalam format siap cetak (print-friendly).
*   **Ekspor Excel**: Mengunduh data tabel Rekap PRK dan Monitoring Kontrak ke dalam file format CSV.

---

## 4. Model Data Relasional (Database Schema)

*   `User`: Menyimpan identitas pegawai (`id`, `name`, `username`, `password` (hashed), `role`, `created_at`).
*   `PRK`: Menyimpan program kerja (`id`, `nomor_prk`, `uraian_prk`, `jenis_anggaran`, `tahun`, `created_at`).
*   `Pagu`: Menyimpan plafon anggaran terkait PRK (`id`, `prk_id`, `nilai_pagu`, `tahun`, `created_at`).
*   `Contract`: Menyimpan data perikatan kerja (`id`, `prk_id`, `nomor_kontrak`, `judul_pekerjaan`, `vendor`, `nilai_kontrak`, `status_proses`, `tgl_nd`, `no_nd`, `user_bidang`, `hari_kerja`, `created_at`).
*   `Alert`: Menyimpan alarm EWS (`id`, `contract_id` (nullable), `prk_id` (nullable), `tipe`, `pesan`, `created_at`).

---

## 5. Logika Aturan Bisnis (Key Business Rules)

1.  **Zero Over-budget Rule (Lock Pagu)**:
    $$\sum \text{Nilai Kontrak}_{\text{PRK}_i} \le \sum \text{Nilai Pagu}_{\text{PRK}_i}$$
    Sistem akan menolak penyimpanan kontrak baru atau perubahan nilai kontrak yang melanggar pertidaksamaan di atas.
2.  **Lock Pagu saat Penurunan Pagu**:
    Sistem melarang penurunan alokasi pagu PRK jika nilai pagu baru lebih rendah dari total nilai kontrak yang sudah mengikat PRK tersebut.
3.  **Cascading Deletes**:
    Jika suatu PRK dihapus, seluruh data Pagu dan Kontrak yang merujuk pada PRK tersebut akan dihapus dari database secara otomatis demi menjaga integritas data.
