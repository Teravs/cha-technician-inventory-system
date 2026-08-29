# CHA Technician Inventory System

Sistem Informasi Manajemen Inventaris, Pengajuan Suku Cadang/Material Teknisi, dan Audit Mutasi Stok untuk **PT Chand Hajar Aswad**.

---

## 📌 Daftar Isi
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Fitur Utama](#-fitur-utama)
- [Prasyarat Sistem (Prerequisites)](#-prasyarat-sistem-prerequisites)
- [Panduan Setup & Instalasi](#-panduan-setup--instalasi-langkah-demi-langkah)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Persiapan Database MySQL](#2-persiapan-database-mysql)
  - [3. Konfigurasi & Menjalankan Backend](#3-konfigurasi--menjalankan-backend)
  - [4. Konfigurasi & Menjalankan Frontend](#4-konfigurasi--menjalankan-frontend)
- [Akun Pengguna Default (Demo Credentials)](#-akun-pengguna-default-demo-credentials)
- [Struktur Direktori Proyek](#-struktur-direktori-proyek)
- [Catatan & Troubleshooting](#-catatan--troubleshooting)

---

## 🛠 Teknologi yang Digunakan

### Backend
- **Runtime & Framework**: Node.js, Express.js
- **Database & ORM**: MySQL, Prisma ORM
- **Authentication**: JSON Web Token (JWT) & HTTP-Only Cookie / Bearer Token, Bcrypt
- **PDF Report Engine**: PDFKit (Native Vector PDF Generator)

### Frontend
- **Framework & Bundler**: React.js 19, Vite
- **Routing & State**: React Router v7, Context API (RBAC Protected Routes)
- **UI & Styling**: Bootstrap 5, Bootstrap Icons
- **HTTP Client**: Axios

---

## ✨ Fitur Utama

1. **Role-Based Access Control (RBAC)**:
   - **Super Admin**: Akses penuh, Master Data (User, Kategori, Satuan), Monitoring Stok, Audit Log, Laporan PDF.
   - **Kepala Teknisi**: Approval/Rejection Pengajuan Material, Penyesuaian Stok Manual (IN/OUT/ADJUSTMENT), Audit Log, Laporan PDF.
   - **Staff / Teknisi Lapangan**: Pengajuan Permintaan Material (Multi-item Request), Monitoring Status Tiket Pengajuan.
2. **Automated Stock Monitoring**:
   - Status otomatis: `READY`, `MENIPIS / LOW STOCK` ($\le \text{Batas Minimum}$), dan `HABIS / OUT OF STOCK`.
3. **Atomic Request & Approval**:
   - Pengurangan stok dan pencatatan buku besar mutasi dijalankan dalam Prisma Database Transaction untuk mencegah inkonsistensi stok.
4. **Audit Trail Mutasi Stok**:
   - Riwayat pencatatan keluar/masuk barang secara kronologis dengan eksekutor dan referensi tiket.
5. **Ekspor Laporan PDF Resmi**:
   - Download laporan mutasi 7 hari terakhir (mingguan) dan laporan audit bulanan lengkap dengan ringkasan metrik dan kolom pengesahan.

---

## 💻 Prasyarat Sistem (Prerequisites)

Pastikan perangkat Anda telah terinstall:
- **Node.js**: Versi `v18.x` atau `v20.x+` ([Download Node.js](https://nodejs.org/))
- **NPM**: Versi `9.x+` (otomatis terpasang bersama Node.js)
- **MySQL Database Server**: Dapat menggunakan **XAMPP**, **MySQL Server**, **MariaDB**, atau **Docker**.
- **Git**: ([Download Git](https://git-scm.com/))

---

## 🚀 Panduan Setup & Instalasi (Langkah demi Langkah)

### 1. Clone Repository
Buka terminal / command prompt, lalu clone repository ini ke komputer Anda:
```bash
git clone https://github.com/username/cha-technician-inventory-system.git
cd cha-technician-inventory-system
```

---

### 2. Persiapan Database MySQL
1. Buka aplikasi **XAMPP** dan klik **Start** pada modul **MySQL** & **Apache** (atau jalankan service MySQL Anda).
2. Buka browser dan akses **phpMyAdmin** (`http://localhost/phpmyadmin`).
3. Buat database baru dengan nama:
   ```sql
   cha_technician_inventory
   ```

---

### 3. Konfigurasi & Menjalankan Backend

1. Buka terminal baru dan masuk ke folder `backend`:
   ```bash
   cd backend
   ```

2. Install dependensi backend:
   ```bash
   npm install
   # Jika di Windows PowerShell muncul error script execution, gunakan:
   # npm.cmd install
   ```

3. Buat file konfigurasi `.env`:
   Salin file `.env.example` menjadi `.env`:
   - **Windows (Command Prompt)**:
     ```cmd
     copy .env.example .env
     ```
   - **PowerShell / Linux / macOS**:
     ```bash
     cp .env.example .env
     ```
   
   Isi file `backend/.env` (sesuaikan user dan password MySQL Anda jika ada password):
   ```env
   PORT=5000
   NODE_ENV=development

   # Format: mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME
   DATABASE_URL="mysql://root:@localhost:3306/cha_technician_inventory"

   JWT_SECRET="cha-technician-inventory-secret"
   JWT_EXPIRES_IN="1d"
   ```

4. Jalankan Migrasi Database Prisma:
   Perintah ini akan membuat semua tabel di MySQL secara otomatis:
   ```bash
   npx prisma migrate dev --name init
   ```

5. Jalankan Seed Database (Mengisi User Default, Kategori, dan Satuan Awal):
   ```bash
   node prisma/seed.js
   ```

6. Jalankan Server Backend:
   ```bash
   npm run dev
   ```
   Backend akan berjalan di: **`http://localhost:5000`**

---

### 4. Konfigurasi & Menjalankan Frontend

1. Buka terminal baru (biarkan terminal backend tetap berjalan) dan masuk ke folder `frontend`:
   ```bash
   cd frontend
   ```

2. Install dependensi frontend:
   ```bash
   npm install
   # Jika di Windows PowerShell muncul error script execution, gunakan:
   # npm.cmd install
   ```

3. Jalankan Dev Server Frontend:
   ```bash
   npm run dev
   ```

4. Buka Browser:
   Akses aplikasi di alamat: **`http://localhost:5173`**

---

## 👥 Akun Pengguna Default (Demo Credentials)

Berikut akun awal yang telah disiapkan melalui perintah `seed.js`:

| Role | Username | Password | Hak Akses Utama |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `admin123` | Kelola User, Kategori, Satuan, Monitoring Stok, Mutasi, Laporan |
| **Kepala Teknisi** | `kepala` | `kepala123` | Approve/Reject Permintaan Barang, Mutasi Stok Manual, Laporan |
| **Teknisi (Staff)** | `teknisi` | `teknisi123` | Buat Permintaan Barang, Cek Status Tiket |

---

## 📁 Struktur Direktori Proyek

```text
cha-technician-inventory-system/
├── backend/
│   ├── prisma/
│   │   ├── migrations/         # Riwayat migrasi skema database
│   │   ├── schema.prisma       # Model database Prisma ORM
│   │   └── seed.js             # Data seeder awal (User, Kategori, Satuan)
│   ├── src/
│   │   ├── controllers/        # Logika handler API (Auth, Item, Request, User, dll.)
│   │   ├── middleware/         # Auth verification & RBAC authorization
│   │   ├── routes/             # Definisi REST Endpoint Express
│   │   ├── services/           # PDFKit Report Generator Service
│   │   ├── app.js              # Inisialisasi Express & Middleware
│   │   └── server.js           # Entrypoint HTTP Server
│   ├── .env.example            # Template environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI & ProtectedRoute
│   │   ├── hooks/              # Auth Context & State Hook
│   │   ├── layouts/            # Sidebar Dashboard & Responsive AppLayout
│   │   ├── pages/              # Halaman Tampilan (Dashboard, Inventory, Request, dll.)
│   │   ├── App.jsx             # React Router Declarative Routes
│   │   └── main.jsx            # React Entrypoint & Bootstrap Imports
│   ├── vite.config.js          # Konfigurasi Vite & Reverse Proxy API
│   └── package.json
│
└── README.md                   # Dokumentasi Utama
```

---

## ❓ Catatan & Troubleshooting

### 1. PowerShell Script Execution Error di Windows
Jika muncul error: `npm.ps1 cannot be loaded because running scripts is disabled on this system`, gunakan perintah dengan akhiran `.cmd`:
```powershell
npm.cmd install
npm.cmd run dev
```

### 2. Error Koneksi Database (`Can't reach database server at localhost:3306`)
- Pastikan MySQL di XAMPP / service lokal sudah dalam keadaan **Running** (berwarna hijau).
- Periksa kembali konfigurasi `DATABASE_URL` di file `backend/.env`.

### 3. Port Sudah Terpakai (`EADDRINUSE: address already in use :::5000`)
- Pastikan tidak ada aplikasi lain atau terminal lama yang masih menjalankan backend di port 5000.
- Anda dapat mengubah nilai `PORT=5000` di `backend/.env` dan target proxy di `frontend/vite.config.js` jika diperlukan.

---

**PT Chand Hajar Aswad © 2026** — *Technician Inventory & Asset Management System*

