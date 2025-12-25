# HealthCure - Sistem Data Pasien

Sistem manajemen data pasien berbasis web dengan arsitektur microservices.

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Browser modern

### Jalankan Lokal

```bash
git clone https://github.com/WaffleWhip/sistem-data-pasien.git
cd sistem-data-pasien
docker compose up -d
```

Tunggu ~30 detik, lalu akses: **http://localhost:3000**

**Admin Login:** `admin@healthcure.com` / `admin123`

### Deploy ke Azure VM

Lihat panduan lengkap di **[DEPLOYMENT.md](DEPLOYMENT.md)**

**Quick Deploy:**
```bash
# SSH ke VM dan jalankan:
ssh azureuser@<VM_IP> 'bash -s' < deploy/setup.sh
```

---

## Fitur & Cara Penggunaan

### Login/Register

1. Buka http://localhost:3000
2. Klik "Login" atau "Daftar"
3. Masukkan data yang diperlukan
4. Untuk user baru, admin harus verify sebelum akses data pasien

---

### ADMIN - Kelola Data Pasien

Akses Menu "Data Pasien"

- Lihat Pasien: Tabel semua pasien dengan pencarian
- Tambah Pasien: Klik tombol "Tambah Pasien" dan isi form lengkap
  - Nama, Email, No HP
  - Tanggal Lahir, Jenis Kelamin
  - Alamat, Golongan Darah, Alergi, Riwayat Medis
- Edit Pasien: Klik nama/tombol "Edit" dan ubah data
- Hapus Pasien: Klik "Hapus" dan konfirmasi

---

### ADMIN - Kelola Data Dokter

Akses Menu "Data Dokter"

- Lihat Dokter: Tabel semua dokter
- Tambah Dokter: Isi: Nama, NIP, Spesialisasi, No HP, Email, Jadwal, Ruangan
- Edit/Hapus Dokter: Sama seperti pasien

---

### ADMIN - Buat Rujukan

Akses Menu "Rujukan Pasien" > "Buat Rujukan Baru"

Step 1: Pilih Pasien
- Cari pasien dengan nama/email/no HP
- Klik pasien yang dipilih

Step 2: Cek Data Pasien
- Jika data lengkap > Lanjut ke Step 3
- Jika data belum lengkap:
  - Warning muncul dengan daftar field yang kurang
  - Pilih: Isi langsung di form ATAU klik "Lengkapi di Halaman Pasien"

Step 3: Isi Detail Rujukan
- Keluhan/Alasan rujukan (required)
- Pilih dokter yang menangani (required)
- Tanggal kunjungan (default: hari ini)
- Catatan tambahan (optional)
- Klik "Simpan Rujukan"

Kelola Rujukan
- Filter: Semua / Sedang Berlangsung / Selesai
- Pencarian by nama pasien
- Tombol "Edit" untuk ubah diagnosis, treatment, resep
- Tombol "Tandai Selesai" untuk mark completed
- Tombol "Riwayat" untuk lihat detail kunjungan pasien

---

### USER (PASIEN) - Kelola Data Diri

Akses Menu "Profil Saya"

- Lihat Profil: Informasi personal & data medis
- Edit Profil: Ubah Nama, Email, No HP
- Klik "Simpan Perubahan"

---

### USER (PASIEN) - Lihat Riwayat Kunjungan

Akses Menu "Kunjungan Saya"

- Kunjungan Sedang Berlangsung: Status, dokter, tanggal, keluhan
- Riwayat Kunjungan (Completed): Detail lengkap diagnosis, penanganan, resep

---

## Arsitektur

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser   │────▶│   Frontend   │────▶│ Auth Service │
│             │     │   (Gateway)  │     │   Port 3001  │
└─────────────┘     │   Port 3000  │     └──────┬───────┘
                    └──────┬───────┘            │
                           │              ┌─────▼─────┐
                           │              │  MongoDB  │
                           │              │ (auth_db) │
                    ┌──────▼───────┐      └───────────┘
                    │ Main Service │
                    │   Port 3002  │      ┌───────────┐
                    └──────┬───────┘      │  MongoDB  │
                           └─────────────▶│ (main_db) │
                                          └───────────┘
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Services tidak jalan | docker compose logs |
| Database connection error | docker compose restart mongodb-auth mongodb-main |
| Port sudah dipakai | Ubah port di docker-compose.yml |
| Admin belum ada | Sistem auto-create saat startup |
| **Login page loading terus (buffer)** | **Cek apakah auth-service ready. Lihat troubleshooting login di bawah** |

### Login Buffer / Timeout Issues

Jika login page terus loading/buffer, kemungkinan:

**1. Auth Service tidak ready**
```bash
docker compose logs auth-service
docker compose restart auth-service
```

**2. MongoDB belum connect**
```bash
docker compose restart mongodb-auth
# Tunggu 10-15 detik sebelum login
```

---

## Project Structure

```
sistem-data-pasien/
├── auth-service/          # JWT Authentication Service
├── main-service/          # Patient & Doctor Management
├── frontend/              # Web UI & API Gateway
├── docker/                # MongoDB Init Scripts
├── deploy/                # Deployment Scripts
│   └── setup.sh           # VM Setup Script
├── docker-compose.yml     # Container Orchestration
├── DEPLOYMENT.md          # Azure VM Deployment Guide
└── README.md              # Project Documentation
```

---

## API Endpoints

### Auth Service (Port 3001)

```
POST   /api/auth/login           - Login
POST   /api/auth/register        - Register
GET    /api/auth/verify          - Verify token (JWT)
GET    /api/auth/me              - Get current user (JWT)
```

### Main Service (Port 3002)

```
# Patients
GET    /api/patients             - List all (JWT)
POST   /api/patients             - Create (JWT, Admin)
GET    /api/patients/:id         - Get detail (JWT)
PUT    /api/patients/:id         - Update (JWT)
DELETE /api/patients/:id         - Delete (JWT, Admin)
GET    /api/patients/search?q=   - Search (JWT)

# Doctors
GET    /api/doctors              - List all (JWT)
POST   /api/doctors              - Create (JWT, Admin)
PUT    /api/doctors/:id          - Update (JWT, Admin)
DELETE /api/doctors/:id          - Delete (JWT, Admin)

# Visits/Referrals
GET    /api/visits               - List all (JWT, Admin)
POST   /api/visits               - Create (JWT, Admin)
GET    /api/visits/my-visits     - Get user's visits (JWT)
PUT    /api/visits/:id           - Update (JWT, Admin)
DELETE /api/visits/:id           - Delete (JWT, Admin)
```

---

## Security

- JWT Authentication (24-hour expiry)
- Password hashing (bcrypt)
- Role-based access control
- Input validation
- Secure credential management

---

## Tech Stack

- Backend: Node.js, Express.js
- Database: MongoDB (2 instances)
- Authentication: JWT
- Frontend: EJS, CSS3, Vanilla JS
- Container: Docker & Docker Compose
- Deployment: Azure VM

---

**Status:** Production Ready ✓
