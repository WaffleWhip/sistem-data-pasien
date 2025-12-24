# Quick Start - Pull & Run HealthCure

Panduan cepat untuk pull aplikasi dari GitHub dan menjalankannya.

## Step 1: Clone dari GitHub

```bash
git clone https://github.com/WaffleWhip/sistem-data-pasien.git
cd sistem-data-pasien
```

## Step 2: Jalankan dengan Docker

```bash
docker compose up -d
```

## Step 3: Tunggu Services Siap

Tunggu ~30 detik hingga semua services healthy:

```bash
docker compose ps
```

Pastikan status semua container adalah healthy atau Up

## Step 4: Akses Aplikasi

Buka browser dan go to:

```
http://localhost:3000
```

## Step 5: Login dengan Admin

```
Email:    admin@healthcure.com
Password: admin123
```

---

## Verify Semuanya Berjalan

```bash
# Check all services running
docker compose ps

# Check logs jika ada error
docker compose logs [service-name]

# Contoh:
# docker compose logs frontend
# docker compose logs auth-service
# docker compose logs main-service
```

---

## Apa yang Bisa Dilakukan

### Sebagai Admin (Default Login)
- Lihat daftar pasien
- Tambah/edit/hapus pasien
- Lihat daftar dokter
- Tambah/edit/hapus dokter
- Buat rujukan untuk pasien
- Track riwayat kunjungan

### Sebagai User (Register & Verify)
- Lihat profil diri sendiri
- Update data pribadi
- Lihat riwayat kunjungan

---

## Stop Services

```bash
docker compose down
```

## Restart Services

```bash
docker compose restart
```

## Rebuild Images (setelah ada perubahan code)

```bash
docker compose up -d --build
```

---

## Troubleshooting

### Services tidak berjalan
```bash
docker compose logs
```

### Port sudah digunakan
Edit docker-compose.yml, ubah port:
```yaml
ports:
  - "3000:3000"  # ubah 3000 jadi port lain, misal 8000
```

### Database connection error
```bash
docker compose restart mongodb-auth mongodb-main
```

### Hapus semua dan restart bersih
```bash
docker compose down -v
docker compose up -d
```

---

Status: Ready to use!

Selamat menggunakan HealthCure.
