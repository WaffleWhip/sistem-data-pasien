# HealthCure - Azure VM Deployment Guide

Panduan deployment aplikasi HealthCure ke Azure Virtual Machine (Linux).

---

## Prerequisites

- Azure account dengan subscription aktif
- SSH client (Terminal/PowerShell/PuTTY)

---

## Step 1: Buat Azure VM

### Via Azure Portal

1. Login ke [Azure Portal](https://portal.azure.com)
2. Klik **"Create a resource"** → **"Virtual Machine"**
3. Konfigurasi:

| Setting | Value |
|---------|-------|
| **Resource Group** | `healthcure-rg` (create new) |
| **VM Name** | `healthcure-vm` |
| **Region** | East Asia (atau region terdekat) |
| **Image** | Ubuntu Server 24.04 LTS |
| **Size** | Standard B2s (2 vCPU, 4GB RAM) |
| **Authentication** | Password |
| **Username** | `azureuser` |
| **Password** | (set strong password) |

4. **Networking** → Pastikan port **22 (SSH)** dan **3000 (HTTP)** terbuka
5. Klik **Review + Create** → **Create**
6. Tunggu deployment selesai (~2-3 menit)
7. Catat **Public IP Address** dari VM

---

## Step 2: Buka Port 3000

Setelah VM dibuat, buka port untuk akses aplikasi:

1. Di Azure Portal, buka VM → **Networking**
2. Klik **Add inbound port rule**
3. Konfigurasi:
   - **Destination port ranges**: `3000`
   - **Protocol**: TCP
   - **Name**: `Allow-HTTP-3000`
4. Klik **Add**

---

## Step 3: Deploy Aplikasi

Hanya 2 command saja dari komputer lokal:

### Command 1: SSH ke VM

```bash
ssh azureuser@<VM_PUBLIC_IP>
```

Masukkan password saat diminta.

### Command 2: Di Dalam VM - Clone & Run Setup

Setelah SSH masuk, copy-paste command ini:

```bash
git clone https://github.com/WaffleWhip/sistem-data-pasien.git && cd sistem-data-pasien && bash deploy/setup.sh
```

Script akan otomatis:
- ✅ Update system packages
- ✅ Install Docker & Docker Compose
- ✅ Clone repository (jika belum)
- ✅ Start semua services
- ✅ Show access information

Tunggu ~5 menit hingga selesai.

---

## Step 4: Akses Aplikasi

Buka browser:
```
http://<VM_PUBLIC_IP>:3000
```

### Default Login Admin
| | |
|---|---|
| **Email** | admin@healthcure.com |
| **Password** | admin123 |

> ⚠️ **PENTING**: Ganti password admin setelah login pertama!

---

## Maintenance Commands

Setelah deployment, gunakan commands ini untuk maintenance:

```bash
# SSH ke VM
ssh azureuser@<VM_PUBLIC_IP>
cd sistem-data-pasien

# Cek status services
docker compose ps

# Lihat logs real-time
docker compose logs -f

# Lihat logs specific service
docker compose logs -f auth-service

# Restart semua services
docker compose restart

# Stop semua services
docker compose down

# Update aplikasi ke version terbaru
git pull
docker compose down
docker compose up -d --build
```

---

## Troubleshooting

### Services tidak jalan
```bash
docker compose logs
docker compose restart
```

### Port sudah dipakai
```bash
sudo lsof -i :3000
# Ubah port di docker-compose.yml jika perlu
```

### Permission denied
```bash
sudo usermod -aG docker $USER
# Logout dan login ulang
```

### Database error
```bash
docker compose restart mongodb-auth mongodb-main
# Tunggu 10-15 detik
```

---

## Cleanup (Hapus Resources)

### Di VM:
```bash
docker compose down -v
rm -rf ~/sistem-data-pasien
```

### Di Azure Portal:
1. Buka Resource Group `healthcure-rg`
2. Klik **Delete resource group**
3. Konfirmasi dengan ketik nama resource group
4. Klik **Delete**

---

## Estimasi Biaya

| Resource | Harga (per bulan) |
|----------|-------------------|
| VM Standard B2s | ~$30-40 |
| Storage 30GB | ~$5 |
| **Total** | **~$35-45** |

*Harga dapat bervariasi tergantung region dan usage.*

---

## Quick Reference

| Item | Value |
|------|-------|
| **App URL** | `http://<VM_IP>:3000` |
| **SSH** | `ssh azureuser@<VM_IP>` |
| **Admin Email** | admin@healthcure.com |
| **Admin Password** | admin123 |
| **Frontend Port** | 3000 |
| **Auth Service** | 3001 (internal) |
| **Main Service** | 3002 (internal) |

---

**Status:** Production Ready ✓
