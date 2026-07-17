# Ide Roadmap Pengembangan Tingkat Lanjut - Si Monang

Selain pengelolaan Matriks RBAC Dinamis, terdapat beberapa ide inovasi strategis yang relevan dengan proses bisnis PT PLN untuk dikembangkan pada fase berikutnya:

---

## 1. Integrasi & Sinkronisasi Dua Arah Google Sheets (Fase Lanjutan 1)
*   **Latar Belakang**: Pegawai PLN Perencanaan & Keuangan terbiasa mengelola anggaran menggunakan spreadsheet.
*   **Fungsionalitas**:
    *   **Impor Otomatis**: Backend secara berkala memantau Google Sheet unit. Perubahan baris PRK/Pagu di spreadsheet akan tersinkronisasi otomatis ke database PostgreSQL.
    *   **Ekspor Sinkron**: Setiap kali terdapat kontrak baru yang lolos validasi *Lock Pagu* di Web UI, sistem secara otomatis menulis baris baru ke Google Sheet target menggunakan Google Sheets API.

---

## 2. Saluran Notifikasi EWS (WhatsApp & Email Gateway) (Fase Lanjutan 2)
*   **Latar Belakang**: Alarm di dashboard web kurang efektif jika pengelola tidak sedang membuka aplikasi.
*   **Fungsionalitas**:
    *   **WA Notifikasi**: Integrasi dengan WA API (misalnya Fonnte / Twilio) untuk mengirimkan pesan pengingat langsung ke nomor ponsel penanggung jawab Bidang Pengusul (User Bidang) saat Nota Dinas mereka terdeteksi backlog (>30 hari).
    *   **Email Mingguan**: Laporan mingguan otomatis ke Manajer berisi ringkasan PRK kritis (<10%) dan grafik Kurva S penyerapan saat ini.

---

## 3. Prognosa Prediktif Cerdas (Machine Learning Regression) (Fase Lanjutan 3)
*   **Latar Belakang**: Estimasi kurva penyerapan saat ini masih berbasis persentase linear statis.
*   **Fungsionalitas**:
    *   **Machine Learning / Regression**: Menggunakan algoritma regresi polinomial (bisa diproses di Go menggunakan library `gonum` atau Python FastAPI) untuk memproyeksikan sisa anggaran akhir tahun berdasarkan tren kecepatan realisasi kontrak bulanan dari tahun-tahun sebelumnya.
    *   **Proyeksi S Sempurna**: Menghasilkan kurva prognosis cerdas yang menyesuaikan diri secara otomatis dengan pola penyerapan musiman PLN.

---

## 4. Log Audit Transaksi Keuangan (Audit Trails) (Fase Lanjutan 4)
*   **Latar Belakang**: Pentingnya akuntabilitas dan transparansi dalam pengelolaan pagu keuangan negara/korporasi.
*   **Fungsionalitas**:
    *   **Immutable Logs**: Membuat tabel `audit_logs` di database yang mencatat detail aktivitas: *Siapa melakukan apa, kapan, dan perubahan data apa* (misal: "User A menaikkan pagu PRK X dari Rp 10M menjadi Rp 12M").
    *   **Viewer Log**: Halaman khusus untuk Auditor atau Manajer guna meninjau riwayat transaksi demi mencegah fraud.
