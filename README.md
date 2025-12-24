# HealthCure - Sistem Data Pasien

Sistem manajemen data pasien berbasis web dengan arsitektur microservices. Memungkinkan admin (petugas klinik) mengelola data pasien dan dokter, serta user (pasien) melihat dan memperbarui data pribadi mereka.

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Browser modern

### Jalankan Aplikasi

```bash
docker compose up -d
```

Tunggu ~30 detik hingga semua services siap, lalu akses:
- Frontend: http://localhost:3000
- Default Admin: admin@healthcure.com / admin123

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

## Cara Deploy

### Local (Docker)

```bash
# Start
docker compose up -d

# Stop
docker compose down

# Rebuild setelah ada perubahan
docker compose up -d --build

# Lihat logs
docker compose logs -f [service]
```

### Deploy ke Azure (Automated Script)

Kami menyediakan script otomatis untuk deploy ke Azure Web App for Containers.

**Prerequisites:**
1. Akun Azure (Azure for Students supported)
2. Akses ke [Azure Cloud Shell](https://shell.azure.com) (Bash)

**Langkah-langkah:**

1. Buka Azure Cloud Shell (Bash).
2. Clone repository ini:
   ```bash
   git clone https://github.com/WaffleWhip/sistem-data-pasien.git
   cd sistem-data-pasien
   ```
3. Jalankan script deployment:
   ```bash
   bash deploy-to-azure.sh
   ```
4. Script akan otomatis:
   - Mencari region yang valid (default: Indonesia Central).
   - Membuat Resource Group & Container Registry.
   - Build image docker di cloud.
   - Membuat App Service Plan & Web App.
   - Memberikan URL aplikasi yang sudah jadi.

**Masalah Umum: Provider Masih "Registering"**

Jika Anda melihat error bahwa `Microsoft.ContainerRegistry` atau `Microsoft.Web` sedang dalam status "Registering", jalankan perintah ini di Cloud Shell untuk memantau statusnya hingga berubah menjadi "Registered":

```bash
while true; do
  acr_status=$(az provider show -n Microsoft.ContainerRegistry --query "registrationState" -o tsv)
  web_status=$(az provider show -n Microsoft.Web --query "registrationState" -o tsv)
  echo "ACR: $acr_status | Web: $web_status"
  
  if [ "$acr_status" == "Registered" ] && [ "$web_status" == "Registered" ]; then
    echo "✅ Semua provider sudah terdaftar! Silakan jalankan deploy script lagi."
    break
  fi
  sleep 10
done
```

Tunggu hingga script di atas berhenti dan menampilkan pesan sukses, lalu coba deploy lagi.

### Environment Variables

```env
JWT_SECRET=<your-secure-random-key>
NODE_ENV=production
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<database>
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Services tidak jalan | docker compose logs |
| Database connection error | docker compose restart mongodb-auth mongodb-main |
| Port sudah dipakai | Ubah port di docker-compose.yml |
| Admin belum ada | Sistem auto-create saat startup |

---

## Struktur File

```
sistem-data-pasien/
├── auth-service/        - JWT authentication
├── main-service/        - Patient/Doctor CRUD & Visit management
├── frontend/            - Web interface & API gateway
├── docker/              - MongoDB initialization scripts
├── docker-compose.yml   - Container orchestration
├── README.md            - Ini (penggunaan & deploy)
├── ARCHITECTURE.md      - Cara kerja & komponen detail
├── QUICK_START.md       - Quick start guide
├── .env.example         - Environment template
└── .gitignore          - Git exclusions
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
- Deployment: Azure Container Apps

---

## Dokumentasi Lengkap

Untuk memahami cara kerja sistem secara detail, lihat ARCHITECTURE.md yang mencakup:
- Arsitektur sistem & flow data
- Daftar komponen & fungsinya
- Model data & relationships
- Alur autentikasi
- Cara kerja setiap fitur

---

Status: Production Ready
