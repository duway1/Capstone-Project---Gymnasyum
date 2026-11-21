# Gymnasyum – Smart Reminder & Follow-Up System
**Dicoding Bootcamp - Capstone Project**  
- **ID Tim:** B26B15J003  
- **Judul Proyek:** Smart Reminder & Follow-Up Gymnasyum  
- **Tema:** Gymnasyum – Smart Reminder & Follow UP  
- **Pengembang:** Dwi Alfiyanti (Solo Developer - Full-Stack Web Developer)  

---

## Ringkasan Eksekutif & Cakupan Proyek
Gymnasyum merupakan sistem **Dashboard CRM Admin** interaktif untuk bisnis gym dan private coaching. Sistem ini mengotomatisasi manajemen jadwal latihan, pelacakan alur pengingat kehadiran secara *end-to-end*, integrasi **Inference API** untuk klasifikasi prioritas pelanggan (*Low, Medium, High Priority*), serta penyediaan draf pesan follow-up semi-otomatis melalui tombol tautan langsung WhatsApp (`wa.me`).

---

## Akun Login Bawaan (Default Admin)
- **Username:** `admin` *(atau email: `admin@gymnasyum.com`)*
- **Password:** `admin123`
*(Tersedia opsi registrasi akun staf/admin baru pada halaman login)*

---

## 5 Fitur Utama Sesuai Project Plan

### 1. Kelola Data Pelanggan & Jadwal (Full CRUD)
- **Kelola Pelanggan (Customer / Member):**
  - Tambah, lihat daftar, cari, filter status keanggotaan (Aktif/Nonaktif), perbarui data, dan hapus pelanggan.
  - Form profil dilengkapi nama, nomor WhatsApp (format internasional `wa.me`), email, dan catatan preferensi kebugaran.
  - **Modal Detail Pelanggan:** Profil lengkap, indikator kehadiran (*attendance rate %*), total sesi, riwayat jadwal, dan histori rekam jejak komunikasi.
- **Kelola Jadwal Latihan (Group Class & Private Coaching):**
  - Buat jadwal sesi latihan baru dengan pemilih pelanggan, nama kelas/sesi, tipe sesi (*Group Class* / *Private Coaching*), nama instruktur/coach, waktu pelaksanaan, dan status kehadiran awal.
  - Otomatis membuat entri pengingat WhatsApp pada tanggal sesi tersebut.
  - Filter pencarian, filter status presensi (*pending*, *present*, *absent*, *rescheduled*), serta filter tanggal (Semua, Hari Ini, Besok).

### 2. Dashboard Reminder Harian
- Halaman khusus yang menampilkan daftar pelanggan dengan jadwal latihan atau agenda follow-up pada hari berjalan (*today*).
- **Navigasi Tanggal Interaktif:** Beralih cepat antara "Hari Ini", "Sebelumnya", "Besok", atau memilih tanggal kalender spesifik.
- **Metrik Harian:** Total pengingat hari ini, pelanggan prioritas tinggi (berisiko mangkir), pengingat yang perlu dikirim (scheduled/no response), dan persentase tingkat konfirmasi (*response rate %*).
- **Tab Tampilan Multifungsi:**
  1. Tabel Pengingat Sesi Harian
  2. Alur Pelacakan Status (*Pipeline Kanban Board*)
  3. Panduan Logika Prioritas & Draf Pesan Otomatis

### 3. Pelacakan Alur Status Reminder (End-to-End Tracking)
Alur status dirancang secara linier dan terstruktur sesuai spesifikasi project plan:
$$\text{Scheduled} \longrightarrow \text{Sent} \longrightarrow \text{Responded / No Response}$$

1. **1. Terjadwal (Scheduled):** Otomatis disiapkan oleh sistem saat jadwal sesi dibuat.
2. **2. Pesan Terkirim (Sent):** Staf membuka WhatsApp Web via tautan langsung (`wa.me`) dan sistem otomatis memperbarui status menjadi terkirim.
3. **3. Hasil / Respon (Responded / No Response):**
   - **Merespons (Responded):** Pelanggan mengonfirmasi hadir atau memberikan kabar izin.
   - **Tanpa Balasan (No Response):** Pesan terkirim tetapi belum ada balasan, memicu rekomendasi *Follow-Up 2* atau penawaran jadwal pengganti (*reschedule*).
- **Pipeline Kanban Board 3 Kolom:** Visualisasi alur status interaktif dengan kartu ringkasan dan aksi cepat.
- **Modal Lacak Alur (Audit Trail Stepper):** Stepper visual horizontal 3 tahap dengan riwayat audit log kronologis.

### 4. Riwayat Komunikasi (Communication Log)
- Rekam jejak kronologis seluruh interaksi pesan dan respon dari setiap pelanggan.
- **Pencatatan Otomatis:** Setiap transisi status reminder (`sent`, `responded`, `no_response`) otomatis dicatat ke riwayat log.
- **Fitur Catat Komunikasi Manual:** Staf dapat mencatat komunikasi masuk maupun keluar melalui WhatsApp, Panggilan Telepon, Tatap Muka di Resepsionis Gym, Instagram, atau SMS.
- **Filter Multi-Kriteria:** Filter berdasarkan pelanggan spesifik, jenis saluran komunikasi, kategori aksi, dan pencarian kata kunci.

### 5. Logika Prioritas & Pesan Otomatis (Inference API & Smart Follow-Up)
- **Klasifikasi Prioritas Cerdas (Inference Logic):**
  - **Prioritas Tinggi (High Priority):** Pelanggan dengan riwayat ketidakhadiran (*absent*) $\ge$ 2 kali dalam 14 hari terakhir (berisiko mangkir/churn). Pendekatan personal empati & cek kendala.
  - **Prioritas Sedang (Medium Priority):** Pelanggan dengan 1 kali riwayat absen, atau sesi saat ini absen, atau pengingat sesi sebelumnya tanpa balasan (*no_response*). Pendekatan konfirmasi kuota kelas & penawaran reschedule.
  - **Prioritas Normal (Low Priority):** Pelanggan aktif disiplin dengan presensi teratur. Pengingat santun standar persiapan latihan.
- **Generator Draf Pesan & Direct WhatsApp Link (`wa.me`):**
  - Katalog 6 template pesan follow-up siap pakai yang otomatis disesuaikan dengan prioritas:
    1. Pengingat Standar Ramah (Low Priority)
    2. Konfirmasi Kuota Kelas (Medium Priority)
    3. Pendekatan Personal & Cek Kendala (High Priority)
    4. Follow-Up Lanjutan Tanpa Respon (Medium/High Priority)
    5. Penawaran Reschedule Fleksibel (Private Coaching / Group Class)
    6. Apresiasi Pasca-Latihan (Apresiasi kehadiran)
  - Otomatis mengisi variabel dinamis `{nama}`, `{kelas}`, `{tipe_sesi}`, `{instruktur}`, dan `{hari_tanggal_jam}` WIB.
  - Dilengkapi fitur editor pratinjau langsung, salin teks pesan, dan 1-klik buka WhatsApp Web (`wa.me`).

---

## Tool Pendukung Capstone Project

### 1. Data Seeder & Generator
Menyediakan data awal terstruktur yang merepresentasikan kondisi operasional Gymnasyum (profil member, jadwal kelas & private coaching, riwayat presensi 14 hari terakhir, reminder hari ini berbagai status, dan log komunikasi).
- **Melalui Baris Perintah (CLI):**
  ```bash
  npm run seed
  ```
- **Melalui REST API:** `POST /api/v1/dataset/generate` atau `POST /api/v1/dataset/reset`

### 2. Postman Collection (Tool #5)
Koleksi pengujian endpoint REST API siap impor tersedia di:  
`backend/postman_collection.json`  
Mencakup pengujian Autentikasi, CRUD Members, CRUD Schedules, Reminders, Inference API, Synthetic Dataset, dan Communication Logs.

### 3. Dual Database Support (PostgreSQL + SQLite Zero-Config)
Sesuai strategi mitigasi risiko di Dokumen Project Plan (Halaman 2 & 5):
- Jika server **PostgreSQL** aktif, sistem otomatis terhubung ke PostgreSQL.
- Jika PostgreSQL tidak terpasang/tidak berjalan, sistem secara cerdas beralih ke **SQLite lokal** (`backend/gymnasyum.sqlite`) sehingga aplikasi dapat langsung diuji secara instan (*zero-configuration out of the box*).

---

## Panduan Instalasi & Menjalankan Proyek

### 1. Prasyarat
- Node.js versi 18 ke atas (Direkomendasikan Node.js 20+)
- Browser modern (Google Chrome, Firefox, Edge)

### 2. Setup & Jalankan Backend API
```bash
# Masuk ke direktori backend
cd backend

# Install dependencies (jika belum)
npm install

# (Opsional) Generate dataset simulasi awal
npm run seed

# Jalankan backend API
npm run dev
```
Backend berjalan pada: `http://localhost:3001`  
*(Penyimpanan database otomatis menggunakan SQLite lokal `gymnasyum.sqlite` atau PostgreSQL jika aktif).*

### 3. Jalankan Frontend Web (React + Vite)
Buka terminal baru:
```bash
# Masuk ke direktori frontend
cd frontend

# Install dependencies (jika belum)
npm install

# Jalankan server frontend Vite
npm run dev
```
Buka browser pada: `http://localhost:5173`  
Gunakan akun login bawaan: `admin` / `admin123`.

---

## Pengujian Otomatis (Automated Test Suite)
Untuk memvalidasi integritas database, generator dataset, alur status reminder, dan logika Inference API:
```bash
node backend/test_api.js
```
Hasil pengujian:
```text
✅ Test 1: Database initialized successfully
✅ Test 2: Synthetic Dataset Generator berhasil
✅ Test 3: Data member tersimpan
✅ Test 4: Inference API berhasil mengklasifikasikan prioritas
✅ Test 5: Alur Status Reminder berhasil (Scheduled -> Sent -> Responded)
✅ Test 6: Riwayat komunikasi (communication_logs) terverifikasi
```
