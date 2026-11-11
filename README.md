# Gymnasyum – Smart Reminder & Follow-Up

React + Vite frontend, Express REST API with JWT Authentication, PostgreSQL, bcrypt password hashing, Axios.

## Akun Login Bawaan (Default Admin)
- **Username:** `admin` (atau email: `admin@gymnasyum.com`)
- **Password:** `admin123`
*(Tersedia juga fitur registrasi akun baru pada halaman login)*

## Setup & Menjalankan

1. **Database:**
   - Pastikan PostgreSQL berjalan dan database `gymnasyum` sudah dibuat.
   - Skrip tabel berada di `backend/schema.sql` (tabel `users`, `members`, `schedules`, `reminders`, `communication_logs`).
2. **Backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   Server berjalan di `http://localhost:3001`. Akun admin bawaan akan otomatis di-seed saat pertama kali server dijalankan jika database masih kosong.
3. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Buka di browser: `http://localhost:5173`.

## Fitur Utama
- **Autentikasi & Otorisasi:** Login berbasis JWT, registrasi akun staff/admin, enkripsi kata sandi menggunakan `bcryptjs`, proteksi endpoint API, tombol Logout.
- **Member & Jadwal:** CRUD Member, CRUD Jadwal kelas, status kehadiran (*pending*, *present*, *absent*, *rescheduled*).
- **Pengingat & Follow-up Cerdas:** Auto-generate reminder saat jadwal dibuat, penentuan prioritas otomatis (*high*, *medium*, *low*) berdasarkan riwayat ketidakhadiran, integrasi draf tautan WhatsApp, riwayat komunikasi log status.
