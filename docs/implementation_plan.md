# Rencana Implementasi: Fase 1 & Fase 2 (Compliance, Multi-level Approval, Revisi Pagu & Heatmap)

Rencana ini memuat langkah-langkah teknis untuk mengimplementasikan fitur **Fase 1 (Kepatuhan Hukum & Kontrol Internal)** dan **Fase 2 (Perencanaan Revisi & Analitik Eksekutif)** pada aplikasi **Si Monang**.

---

## User Review Required

> [!IMPORTANT]
> **Struktur Utama & Alur Kerja Baru**
> 
> 1. **Fase 1: Compliance & Kontrol Internal**
>    * **Immutable Audit Trail Log (`audit_logs`)**: Menambahkan pencatatan transaksi otomatis (stempel waktu, user, role, IP address, aksi, data lama vs data baru) untuk semua mutasi PRK, Pagu, Kontrak, dan Otorisasi.
>    * **Multi-level Approval Workflow**: Mengubah alur persetujuan kontrak menjadi 4 tahap verifikasi berjenjang:
>      `DRAFT` $\rightarrow$ `PENDING_APPROVAL` (Diajukan Bidang/Perencanaan) $\rightarrow$ `VERIFIED_FINANCE` (Diverifikasi Keuangan) $\rightarrow$ `APPROVED_MANAGER` (Disetujui Manajer) $\rightarrow$ `SELESAI` (Realisasi Bayar). Termasuk fitur penolakan (`REJECTED`) dengan catatan perbaikan.
> 
> 2. **Fase 2: Perencanaan Revisi & Analitik**
>    * **Manajemen Revisi Pagu / Adendum (`pagu_revisions`)**: Mengakomodir snapshot revisi anggaran (APBD-Perubahan / Adendum) yang menyimpan histori sisa/pagu sebelum dan sesudah revisi beserta nomor SK/Revisi dan alasan pergeseran.
>    * **Heatmap Penyerapan Per Bidang/Satker**: Komponen visualisasi interaktif pada Dashboard yang memeringkatkan rasio penyerapan dari bidang terkritis (merah) hingga tertinggi (hijau) secara *real-time*.

---

## Proposed Changes

### [Backend - Go Service]

#### [MODIFY] [models.go](file:///Users/wahyubudiman/Documents/prototype/pku_zulfirman/backend/internal/models/models.go)
* Menambahkan struct `AuditLog` untuk tabel log mutasi permanen.
* Menambahkan struct `PaguRevision` untuk tabel histori revisi pagu/adendum.
* Memperbarui struct `Contract` dengan kolom status approval: `ApprovalStatus`, `ApprovalNotes`, `ApprovedByFinance`, `ApprovedByManager`.

#### [NEW] [audit.go (Middleware / Utility)](file:///Users/wahyubudiman/Documents/prototype/pku_zulfirman/backend/internal/handlers/audit.go)
* Fungsi pembantu `RecordAuditLog(tx, userID, username, role, action, entity, entityID, oldValue, newValue, ip)` untuk mencatat log otomatis dalam setiap transaksi.
* Handler API `GET /api/audit-logs` untuk melihat daftar log audit.

#### [NEW] [revision.go (Handlers)](file:///Users/wahyubudiman/Documents/prototype/pku_zulfirman/backend/internal/handlers/revision.go)
* Handler `POST /api/prks/:id/revise` untuk menyimpan revisi pagu anggaran (adendum/APBD-P) dengan snapshot nilai lama vs baru.
* Handler `GET /api/prks/:id/revisions` untuk membaca riwayat revisi PRK.

#### [MODIFY] [contract.go (Handlers)](file:///Users/wahyubudiman/Documents/prototype/pku_zulfirman/backend/internal/handlers/contract.go)
* Menambahkan handler `POST /api/contracts/:id/approval` untuk memproses aksi workflow (`SUBMIT`, `VERIFY`, `APPROVE`, `REJECT`).
* Menyematkan pencatatan `RecordAuditLog` pada pembuatan, perubahan, penghapusan, dan persetujuan kontrak.

#### [MODIFY] [prk.go (Handlers)](file:///Users/wahyubudiman/Documents/prototype/pku_zulfirman/backend/internal/handlers/prk.go)
* Menyematkan `RecordAuditLog` pada aksi CRUD PRK dan Pagu.

#### [MODIFY] [main.go](file:///Users/wahyubudiman/Documents/prototype/pku_zulfirman/backend/main.go)
* Mendaftarkan model `AuditLog` dan `PaguRevision` di `AutoMigrate`.
* Menambahkan permission baru (`audit:read`, `contract:approve_finance`, `contract:approve_manager`, `pagu:revise`) ke dalam seeder database.
* Mendaftarkan rute API baru untuk Audit Logs, Approval Workflow, dan Revisi Pagu.

---

### [Frontend - React / Vite]

#### [MODIFY] [App.jsx](file:///Users/wahyubudiman/Documents/prototype/pku_zulfirman/frontend/src/App.jsx)
* **Heatmap Penyerapan Bidang**: Membuat widget visual Heatmap Card Grid di Dashboard yang menampilkan persentase penyerapan per Bidang Pengusul (Pemeliharaan, SCADA, KKU, Transaksi Energi, K3).
* **Multi-level Approval UI**:
  * Menambahkan badge status persetujuan pada tabel Monitoring.
  * Menambahkan tombol aksi khusus untuk role Keuangan (**Verifikasi**) dan Manajer (**Setujui**) serta tombol **Tolak** dengan modal alasan perbaikan.
* **Fitur Revisi Pagu / Adendum**:
  * Menambahkan tombol **Revisi Pagu** di tabel Rekap PRK.
  * Modal formulir input revisi pagu (Nilai Baru, Nomor SK/Adendum, Alasan Pergeseran).
  * Modal viewer **Riwayat Revisi Anggaran**.
* **Sub-menu Log Audit**:
  * Menambahkan sub-menu **Log Audit Transaksi** di bawah dropdown Konfigurasi Akses untuk meninjau riwayat mutasi anggaran secara transparan.

---

## Verification Plan

### Automated Tests
Verifikasi kompilasi backend Go dan build React frontend:
```bash
cd backend && go build -o tmp/main main.go
cd ../frontend && pnpm build
```

### Manual Verification
1. **Pengujian Audit Trail**: Lakukan penambahan/edit PRK dan Kontrak, lalu buka tab **Log Audit Transaksi** sebagai admin untuk memastikan stempel waktu, user, dan perubahan data tercatat dengan tepat.
2. **Pengujian Approval Workflow**:
   * Login sebagai `perencanaan`, buat kontrak baru (status `DRAFT` $\rightarrow$ klik **Ajukan Persetujuan**).
   * Login sebagai `keuangan`, verifikasi kontrak pada tab Monitoring (status berubah menjadi `DIVERIFIKASI KEUANGAN`).
   * Login sebagai `manajer`, setujui kontrak (status berubah menjadi `DISERTUJUI MANAJER`).
3. **Pengujian Revisi Pagu (Adendum)**: Lakukan revisi pagu pada PRK, pastikan sisa pagu ter-update dan riwayat revisi (snapshot sebelum/sesudah) tampil di modal Riwayat Revisi.
4. **Pengujian Heatmap**: Pastikan persentase penyerapan per bidang di Dashboard terhitung presisi berdasarkan status kontrak selesai per bidang.
