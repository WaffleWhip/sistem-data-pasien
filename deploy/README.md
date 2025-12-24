# HealthCure - Deployment Guide

Panduan deployment aplikasi HealthCure ke Azure VM menggunakan Docker Compose.

## 📋 Prerequisites

- **Azure VM** dengan:
  - Ubuntu Server 20.04 LTS atau lebih baru
  - Minimal 2 vCPU, 4GB RAM
  - Public IP address yang accessible
  - SSH port (22) terbuka
  - Docker dan Docker Compose sudah installed

- **Host Machine** (laptop/workstation):
  - PowerShell 7+ (untuk Windows) atau Bash (untuk Linux/Mac/WSL)
  - SSH client
  - Akses ke GitHub repository

## 🚀 Quick Start

### 1. Setup Configuration File

```bash
# Copy template configuration
cp deploy/vm-config.env.example deploy/vm-config.env

# Edit dengan credentials Azure VM Anda
# Ganti:
# - VM_USERNAME: username untuk SSH
# - VM_PASSWORD: password untuk SSH  
# - VM_PUBLIC_IP: public IP address dari Azure VM
```

### 2. Run Deployment Script

**Untuk Windows (PowerShell):**
```powershell
cd deploy
.\deploy-to-azure.ps1
```

**Untuk Linux/Mac/WSL (Bash):**
```bash
cd deploy
chmod +x deploy-to-azure.sh
./deploy-to-azure.sh
```

### 3. Verify Deployment

```bash
# SSH ke VM
ssh VM_USERNAME@VM_PUBLIC_IP

# Check docker services
docker compose ps

# View logs
docker compose logs -f
```

### 4. Access Application

Buka browser dan akses:
```
http://VM_PUBLIC_IP:3000
```

Login dengan credentials:
- Email: `admin@healthcure.com`
- Password: `admin123`

## 📁 File Structure

```
deploy/
├── README.md                      # Dokumentasi ini
├── deploy-to-azure.ps1           # PowerShell deployment script
├── deploy-to-azure.sh            # Bash deployment script
├── vm-config.env                 # Configuration (LOCAL ONLY - .gitignore)
└── vm-config.env.example         # Configuration template (untuk reference)
```

## ⚙️ Configuration (vm-config.env)

File `vm-config.env` berisi semua konfigurasi yang dibutuhkan untuk deployment:

### Azure VM Credentials (Required)
```env
VM_USERNAME=azureuser          # SSH username
VM_PASSWORD=SecurePass123!     # SSH password
VM_PUBLIC_IP=1.2.3.4          # Public IP dari Azure VM
VM_SSH_PORT=22                # SSH port (default 22)
```

### Deployment Configuration (Optional)
```env
DEPLOYMENT_PATH=/home/azureuser/healthcure   # Direktori di VM
APP_PORT=3000                                  # Port frontend
DOCKER_COMPOSE_VERSION=2.0                    # Docker Compose version
```

### Application Credentials (Optional)
```env
ADMIN_EMAIL=admin@healthcure.com   # Admin email
ADMIN_PASSWORD=admin123            # Admin password
JWT_SECRET=your-secret-key         # JWT secret
```

## 🔒 Security Notes

⚠️ **IMPORTANT:**
- `vm-config.env` berisi credentials sensitif dan **TIDAK boleh** di-commit ke repository
- File sudah di-list di `.gitignore`
- Gunakan `vm-config.env.example` sebagai template saja
- Jangan share credentials dalam plain text
- Untuk production, gunakan Azure Key Vault atau secrets management lainnya

## 📝 Deployment Script Details

### PowerShell Script (deploy-to-azure.ps1)

**Apa yang dilakukan:**
1. ✅ Membaca konfigurasi dari `vm-config.env`
2. ✅ Prepare deployment package (zip project files)
3. ✅ Upload ke Azure VM via SFTP
4. ✅ Extract files di VM
5. ✅ Run `docker compose up -d`
6. ✅ Verify services berjalan

**Keuntungan:**
- Fully automated, dari lokal langsung ke VM
- Error handling yang baik
- Cleanup otomatis
- Support untuk password dan SSH key auth

### Bash Script (deploy-to-azure.sh)

**Apa yang dilakukan:** Same seperti PowerShell version

**Keuntungan:**
- Compatible dengan Linux, Mac, WSL
- Lebih ringan dan cepat
- Support untuk SSH key authentication

## 🐛 Troubleshooting

### Connection Error
```
Error: Unable to connect to VM
```
**Solution:**
1. Verify VM public IP di Azure Portal
2. Check SSH port terbuka (port 22)
3. Verify username dan password benar di `vm-config.env`
4. Test SSH manual: `ssh VM_USERNAME@VM_PUBLIC_IP`

### Docker Services Not Starting
```bash
# SSH ke VM
ssh VM_USERNAME@VM_PUBLIC_IP

# Check docker status
docker compose ps

# View error logs
docker compose logs

# Restart services
docker compose down
docker compose up -d
```

### Port Already in Use
```bash
# Check what's using port 3000
lsof -i :3000

# Change port di docker-compose.yml di VM:
nano docker-compose.yml
# Ubah ports: "3000:3000" menjadi "8000:3000"

# Restart
docker compose restart
```

### Permission Denied
```bash
# Verify user di docker group
groups

# Jika tidak ada 'docker', run:
sudo usermod -aG docker $USER
newgrp docker
```

## 📚 Useful Commands

```bash
# Check service status
docker compose ps

# View real-time logs
docker compose logs -f

# View logs untuk specific service
docker compose logs -f auth-service

# Stop services
docker compose stop

# Start services
docker compose start

# Restart services
docker compose restart

# Remove everything (careful!)
docker compose down -v

# Connect to container
docker exec -it healthcure-frontend bash
```

## 🔄 Manual Deployment (Alternative)

Jika script tidak berjalan, bisa deploy manual:

```bash
# 1. Compress project di lokal
cd sistem-data-pasien
zip -r healthcure.zip . -x ".git/*" "node_modules/*" ".env"

# 2. Upload ke VM
scp healthcure.zip VM_USERNAME@VM_PUBLIC_IP:/tmp/

# 3. SSH ke VM
ssh VM_USERNAME@VM_PUBLIC_IP

# 4. Extract dan run
cd /home/VM_USERNAME
unzip /tmp/healthcure.zip
docker compose up -d
```

## 📞 Support

Jika ada pertanyaan atau masalah:
1. Check logs: `docker compose logs`
2. Verify connectivity: `ping VM_IP`
3. Test SSH: `ssh VM_USERNAME@VM_IP`
4. Review configuration di `vm-config.env`

## 📝 Version History

- **v1.0** - Initial deployment scripts (PowerShell & Bash)
  - Automated deployment to Azure VM
  - Configuration-driven setup
  - Docker Compose integration

---

**Last Updated:** December 24, 2024  
**Status:** Production Ready ✅
