# Health Cure System (Sistem Data Pasien)

Health Cure adalah sistem manajemen data pasien berbasis Microservices Architecture. Aplikasi ini dirancang untuk menyelesaikan permasalahan pencatatan data pasien yang manual, memudahkan dokter melacak riwayat, dan memungkinkan pasien memantau data mereka sendiri.

Aplikasi ini memenuhi kriteria Tugas Besar Pengembangan Aplikasi Terdistribusi.

---

## Arsitektur Sistem

Sistem ini dibangun dengan arsitektur Microservices yang berjalan di atas Docker Containers, terdiri dari:

1.  Gateway Service (Port 3000)
    *   Pintu gerbang utama (API Gateway).
    *   Menangani routing ke service lain.
    *   Melakukan validasi Token JWT dan menyisipkan informasi User/Role ke downstream services.
2.  Auth Service (Port 3001)
    *   Mengelola registrasi, login, dan validasi token (JWT).
    *   Database: MongoDB (authdb).
3.  Patient Service (Port 3002)
    *   Mengelola data pasien (CRUD).
    *   Database: MongoDB (patientdb).
    *   Role Logic: Admin bisa akses semua, User hanya data milik sendiri.
4.  Doctor Service (Port 3003)
    *   Mengelola data dokter.
    *   Database: MongoDB (doctordb).
    *   Role Logic: Hanya Admin yang boleh akses.
5.  Frontend Service (Port 80)
    *   Antarmuka pengguna berbasis React + Vite + Tailwind CSS.

---

## Cara Menjalankan Aplikasi (How to Run)

Kami menyediakan skrip otomatis agar Anda tidak perlu mengetik perintah satu per satu. Skrip ini akan mengecek apakah Docker sudah terinstal, membangun aplikasi, dan langsung membukanya di browser.

### Instalasi Cepat (Otomatis)

1.  **Clone Repository**
    ```bash
    git clone <repository-url>
    cd sistem-data-pasien
    ```

2.  **Jalankan Skrip sesuai OS Anda**
    *   **Windows:** Klik 2x file `setup-windows.bat`
    *   **Mac/Linux:** Jalankan `bash setup-mac-linux.sh` di terminal.

Skrip akan secara otomatis mengarahkan Anda ke link download jika Docker belum terdeteksi.

### Instalasi Manual (Docker Compose)

Jika Anda lebih suka menjalankan perintah sendiri:
1.  Pastikan Docker Desktop sudah berjalan.
2.  Build dan jalankan container:
    ```bash
    docker-compose up -d --build
    ```
3.  Akses aplikasi di http://localhost.

---

## Akun Default dan Pengujian

Saat pertama kali dijalankan, sistem akan membuat satu akun Superadmin secara otomatis.

### 1. Akun Superadmin (Default)
Gunakan akun ini untuk login pertama kali, mendaftarkan dokter, atau admin lain.
*   Username: superadmin
*   Password: superpassword

### Konfigurasi Keamanan (Mengubah Password Default)

Secara default, password superadmin diatur di dalam skrip inisialisasi database. Jika Anda ingin mengubahnya sebelum men-deploy aplikasi:

1.  Generate Hash Baru
    Anda perlu mengubah password teks biasa menjadi hash bcrypt. Kami menyediakan tool sederhana untuk ini:
    *   Buka file auth-service/generate-hash.js.
    *   Ubah variabel const password = 'superpassword'; menjadi password yang Anda inginkan.
    *   Jalankan script:
        ```bash
        cd auth-service
        node generate-hash.js
        ```
    *   Copy output hash yang muncul (contoh: $2b$12$...).

2.  Update Script Inisialisasi
    *   Buka file mongodb/auth/init-users.js.
    *   Cari bagian password: pada user superadmin.
    *   Paste hash baru yang Anda dapatkan tadi.

3.  Rebuild Database
    Jika Anda sudah pernah menjalankan aplikasi sebelumnya, Anda harus menghapus volume database lama agar data inisialisasi ulang termuat:
    ```bash
    docker-compose down -v
    docker-compose up --build
    ```

### 2. Cara Membuat Akun Lain (Testing)
Anda bisa mendaftar melalui halaman Register di Frontend, atau menggunakan Postman ke endpoint API.
*   Admin: Memiliki akses penuh (CRUD Dokter dan Pasien).
*   User: Hanya bisa melihat dan mengedit data pasien milik akun tersebut.

Catatan: Untuk keperluan testing/demo, endpoint Register saat ini mengizinkan pengiriman parameter role ('admin' atau 'user').

### 3. Menjalankan Integration Test (Opsional)
Jika Anda memiliki Node.js terinstal di laptop, Anda bisa menjalankan skrip tes otomatis yang sudah disediakan untuk memverifikasi semua fitur berjalan:
```bash
# Pastikan aplikasi sedang berjalan via Docker
node gateway-service/test-integration.js
```

### 4. Reset Database (Menghapus Semua Data)
Jika Anda ingin menghapus semua data (User, Pasien, Dokter) dan mengembalikan aplikasi ke kondisi awal (hanya ada Superadmin), jalankan perintah berikut:

```bash
# Matikan container dan hapus volume database
docker-compose down -v

# Jalankan kembali aplikasi
docker-compose up --build
```
**Peringatan:** Semua data yang telah Anda input akan hilang permanen.

---

## Dokumentasi API Endpoint

Semua request harus melalui Gateway Service (Port 3000).

### Auth (/api/auth)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | /login | Masuk ke sistem (mendapatkan JWT). |
| POST | /register | Mendaftar akun baru. |
| POST | /verify | Cek validitas token. |

### Doctors (/api/doctors) - Admin Only
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | / | Mengambil semua data dokter. |
| POST | / | Menambah dokter baru. |
| PUT | /:id | Update data dokter. |
| DELETE | /:id | Hapus data dokter. |

### Patients (/api/patients)
| Method | Endpoint | Role Access |
|--------|----------|-------------|
| GET | / | Admin: Semua data. User: Hanya data sendiri. |
| GET | /:id | Admin: Detail pasien. User: Hanya jika milik sendiri. |
| POST | / | Admin Only. (User tidak bisa membuat pasien sendiri, harus Admin). |
| PUT | /:id | Admin: Bebas update. User: Update data sendiri. |
| DELETE | /:id | Admin Only. |

---

## Teknologi yang Digunakan

*   Backend: Node.js, Express.js
*   Database: MongoDB (Multi-database instance)
*   Frontend: React.js, Vite, Tailwind CSS
*   Containerization: Docker dan Docker Compose
*   Security: JSON Web Token (JWT), BCrypt, Helmet, CORS
*   Validation: Joi

---

**&copy; 2025 Health Cure System | Tugas Besar Pengembangan Aplikasi Terdistribusi**
