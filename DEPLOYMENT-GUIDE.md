# Panduan Lengkap Deployment & Hosting (Production Guide)
## CHA Technician Inventory System — PT Chand Hajar Aswad

Dokumen ini menjelaskan apa saja yang perlu diubah saat berpindah dari lingkungan **Localhost** ke **Production Hosting**, serta pilihan metode deployment langkah demi langkah.

---

## 📌 1. Perbedaan Localhost vs Production (Mengapa Port Berbeda?)

| Aspek | Local Development | Production Hosting |
| :--- | :--- | :--- |
| **Frontend** | Berjalan di `http://localhost:5173` via Vite Dev Server. | Di-build menjadi file statis (`HTML`, `CSS`, `JS`) di folder `frontend/dist`. Tidak ada port `5173`. |
| **Backend** | Berjalan di `http://localhost:5000`. | Berjalan di port dinamis (misal port `80`/`443` melalui domain/subdomain, atau port internal via PM2/Docker). |
| **Komunikasi API** | Menggunakan fitur proxy internal Vite (`vite.config.js`). | Menggunakan domain asli backend atau reverse proxy web server (Nginx/Apache). |
| **Database** | MySQL lokal (XAMPP / MariaDB `localhost:3306`). | MySQL Cloud Server (Railway, Aiven, cPanel MySQL, atau VPS MySQL). |

---

## ⚙️ 2. File & Variabel yang Perlu Diubah

### A. Konfigurasi Backend (`backend/.env`)

Ubah file `.env` di backend sesuai kredensial server hosting Anda:

```env
# 1. Port Server (Biarkan otomatis di Railway/Render/cPanel, atau tentukan di VPS)
PORT=5000
NODE_ENV=production

# 2. Koneksi Database MySQL Production
# Format: mysql://DB_USER:DB_PASSWORD@DB_HOST:DB_PORT/DB_NAME
DATABASE_URL="mysql://u1234567_cha:PasswordKuatDb123!@srv123.hosting.com:3306/u1234567_cha_inventory"

# 3. Kunci Rahasia JWT (Ganti dengan string acak yang aman dan panjang)
JWT_SECRET="generate-random-secret-key-super-aman-pt-cha-2026"
JWT_EXPIRES_IN="1d"

# 4. URL Frontend yang Diizinkan (CORS)
# Masukkan domain frontend Anda (pisahkan dengan koma jika ada lebih dari satu)
FRONTEND_URL="https://inventory.perusahaan-cha.co.id,https://cha-inventory.vercel.app"
```

---

### B. Konfigurasi Frontend (`frontend/.env.production` atau Dashboard Hosting)

Saat frontend di-build untuk production:

- **Jika Frontend & Backend Terpisah Domain** (misal Frontend di Vercel & Backend di Railway):
  Buat file `frontend/.env.production` atau tambahkan Environment Variable di Vercel:
  ```env
  VITE_API_URL="https://api-cha-inventory.up.railway.app"
  ```
- **Jika Frontend & Backend di 1 Domain yang Sama** (misal menggunakan Nginx Reverse Proxy atau 1 VPS):
  Kosongkan `VITE_API_URL` (atau tidak perlu diisi). Frontend akan otomatis memanggil `/api/*` ke domain yang sama.

---

## 🚀 3. Pilihan Cara Hosting (Langkah demi Langkah)

---

### 🌐 OPSI 1: Hosting Modern Terpisah (Vercel + Railway / Render) — *Paling Mudah & Rekomendasi Pemula*

#### Langkah 1: Setup Database MySQL Cloud
1. Daftar di penyedia MySQL gratis/murah seperti **[Railway.app](https://railway.app)** atau **[Aiven.io](https://aiven.io)**.
2. Buat database MySQL baru, lalu salin connection string URL-nya (`mysql://...`).

#### Langkah 2: Deploy Backend ke Railway / Render
1. Hubungkan repository GitHub Anda ke **Railway** atau **Render**.
2. Pilih subfolder `backend` sebagai Root Directory.
3. Atur Environment Variables di menu Settings:
   - `DATABASE_URL` = (URL MySQL dari Langkah 1)
   - `JWT_SECRET` = (Kunci rahasia Anda)
   - `NODE_ENV` = `production`
   - `FRONTEND_URL` = (URL domain Vercel Anda)
4. Masuk ke tab **Deploy / Terminal** dan jalankan migrasi database:
   ```bash
   npx prisma migrate deploy
   node prisma/seed.js
   ```
5. Simpan URL Backend publik yang diberikan (contoh: `https://cha-backend.up.railway.app`).

#### Langkah 3: Deploy Frontend ke Vercel
1. Masuk ke **[Vercel.com](https://vercel.com)** dan import repository GitHub Anda.
2. Atur:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Tambahkan **Environment Variable**:
   - `VITE_API_URL` = `https://cha-backend.up.railway.app` (URL backend dari Langkah 2).
4. Klik **Deploy**. Website Anda langsung aktif dengan domain HTTPS gratis (contoh: `https://cha-inventory.vercel.app`).

---

### 🖥️ OPSI 2: Deploy di VPS Ubuntu (DigitalOcean, AWS, IDCloudHost, Biznet) — *Standar Profesional & Kantor*

Di VPS, Frontend dan Backend dapat berjalan di 1 IP/Domain yang sama menggunakan **Nginx** sebagai Reverse Proxy.

#### 1. Masuk ke VPS & Install Prasyarat
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install nodejs npm mysql-server nginx git -y
sudo npm install -g pm2
```

#### 2. Setup Database & Clone Repository
```bash
cd /var/www
git clone https://github.com/username/cha-technician-inventory-system.git
cd cha-technician-inventory-system
```

#### 3. Build Frontend & Setup Backend
```bash
# Setup Backend
cd /var/www/cha-technician-inventory-system/backend
npm install
cp .env.example .env
nano .env # Edit DATABASE_URL, JWT_SECRET, dll.
npx prisma migrate deploy
node prisma/seed.js

# Jalankan Backend dengan PM2 (Background Daemon)
pm2 start src/server.js --name "cha-backend"
pm2 save
pm2 startup

# Build Frontend
cd /var/www/cha-technician-inventory-system/frontend
npm install
npm run build
# Hasil build ada di /var/www/cha-technician-inventory-system/frontend/dist
```

#### 4. Konfigurasi Nginx Reverse Proxy
Edit file konfigurasi Nginx:
```bash
sudo nano /etc/nginx/sites-available/cha-inventory
```

Isi konfigurasi berikut:
```nginx
server {
    listen 80;
    server_name inventory.perusahaan-cha.co.id; # atau IP VPS Anda

    # Sajikan Frontend React (SPA)
    location / {
        root /var/www/cha-technician-inventory-system/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Teruskan request /api ke Backend Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktifkan konfigurasi Nginx & Pasang SSL HTTPS Gratis:
```bash
sudo ln -s /etc/nginx/sites-available/cha-inventory /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Pasang SSL Certbot Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d inventory.perusahaan-cha.co.id
```

---

### 📂 OPSI 3: Deploy di Shared Hosting / cPanel (Setup Node.js App)

1. **Database**: Buat database & user MySQL melalui menu **MySQL Databases** di cPanel.
2. **Backend**:
   - Upload folder `backend` ke direktori luar `public_html` (misal `/home/user/backend-app`).
   - Masuk ke menu **Setup Node.js App** di cPanel -> Klik **Create Application**.
   - Pilih Node.js version (18.x / 20.x), Application root: `backend-app`, Application startup file: `src/server.js`.
   - Tambahkan Environment Variables di cPanel (`DATABASE_URL`, `JWT_SECRET`, dll.).
   - Klik **Run NPM Install** dan jalankan migrasi database via terminal cPanel (`npx prisma migrate deploy`).
3. **Frontend**:
   - Di komputer lokal, jalankan `npm run build` di folder `frontend`.
   - Upload seluruh isi folder `frontend/dist` ke folder `public_html` cPanel Anda.
   - Buat file `.htaccess` di `public_html` untuk routing React SPA:
     ```apache
     <IfModule mod_rewrite.c>
       RewriteEngine On
       RewriteBase /
       RewriteRule ^index\.html$ - [L]
       RewriteCond %{REQUEST_FILENAME} !-f
       RewriteCond %{REQUEST_FILENAME} !-d
       RewriteRule . /index.html [L]
     </IfModule>
     ```

---

## 📋 Checklist Sebelum Aplikasi Live (Go-Live Checklist)

- [ ] Data admin & password awal sudah diganti melalui menu **User Management** atau langsung di database.
- [ ] Nilai `JWT_SECRET` di backend `.env` sudah diganti dengan string acak yang kuat dan aman.
- [ ] Status migrasi database sudah sukses (`npx prisma migrate deploy`).
- [ ] Endpoint health check dapat diakses di `https://domain-anda/api/health` dan mengembalikan `{"status":"ok"}`.
- [ ] Fitur download PDF laporan mingguan & bulanan telah diuji di domain production.
- [ ] Fitur otentikasi login, logout, dan pengajuan tiket teknisi berfungsi normal.

