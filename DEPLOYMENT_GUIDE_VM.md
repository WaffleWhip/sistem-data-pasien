# HealthCure - VM Deployment Guide (Final)

## Prerequisites

✅ Azure VM dengan:
- Ubuntu Server 24.04 LTS
- 2 vCPU, 4GB RAM (Standard B2ats v2)
- Public IP address
- SSH port (22) open
- Admin credentials (username & password)

---

## Deployment Steps

### Step 1: Prepare on Your Laptop

```powershell
# Navigate to project
cd D:\Project

# Zip the project
Compress-Archive -Path sistem-data-pasien -DestinationPath healthcure.zip

# Verify zip created
ls healthcure.zip
```

**Result:** `C:\Users\YOUR_USER\Project\healthcure.zip`

---

### Step 2: Upload to VM

```powershell
# Set variables
$VM_IP = "YOUR_VM_PUBLIC_IP"
$VM_USER = "waf"

# Upload zip file
scp healthcure.zip ${VM_USER}@${VM_IP}:/home/waf/

# Upload setup script
scp deploy/vm-setup-final.sh ${VM_USER}@${VM_IP}:/home/waf/
```

**Expected output:** No errors = success ✅

---

### Step 3: SSH to VM

```powershell
# Connect to VM
ssh waf@YOUR_VM_PUBLIC_IP

# You'll be prompted for password (enter VM password)
```

---

### Step 4: Run Setup Script (Inside VM)

```bash
# Make script executable
chmod +x /home/waf/vm-setup-final.sh

# Run setup script
bash /home/waf/vm-setup-final.sh
```

**What it does:**
- Updates system packages
- Installs Docker & Docker Compose
- Sets up permissions
- Extracts project files
- Starts all services (MongoDB, Auth, Main, Frontend)

**Duration:** 2-3 minutes

---

### Step 5: Verify Services

```bash
# Check if services running
docker-compose ps

# Expected output:
# NAME                 IMAGE              STATUS
# healthcure-auth-service     UP
# healthcure-main-service     UP
# healthcure-frontend         UP
# healthcure-mongodb-auth     UP
# healthcure-mongodb-main     UP

# View logs
docker-compose logs -f
```

---

### Step 6: Access Application

**Open browser:**
```
http://YOUR_VM_PUBLIC_IP:3000
```

**Login with:**
```
Email: admin@healthcure.com
Password: admin123
```

---

## Troubleshooting

### Services not starting?
```bash
# Check logs
docker-compose logs

# Restart services
docker-compose restart

# Full reset
docker-compose down
docker-compose up -d
```

### Port already in use?
```bash
# Check what's using port 3000
sudo lsof -i :3000

# Change port in docker-compose.yml
# ports:
#   - "8000:3000"  # Changed from 3000:3000
```

### Permission denied?
```bash
# Re-run setup
sudo usermod -aG docker $USER
newgrp docker

# Logout and login again
exit
ssh waf@YOUR_VM_PUBLIC_IP
```

---

## Cleanup (if needed)

```bash
# Stop all services
docker-compose down

# Remove all containers and volumes
docker-compose down -v

# Remove project
rm -rf ~/sistem-data-pasien
```

---

## Useful Commands

```bash
# Check service status
docker-compose ps

# View logs (real-time)
docker-compose logs -f

# View logs for specific service
docker-compose logs -f auth-service

# Stop services
docker-compose stop

# Start services
docker-compose start

# Restart services
docker-compose restart

# View resource usage
docker stats

# Connect to container
docker exec -it healthcure-auth-service bash
```

---

## Architecture

```
Azure VM (Ubuntu 24.04)
├── Docker Engine
└── Docker Compose (5 containers)
    ├── Frontend (Port 3000)
    ├── Auth Service (Port 3001)
    ├── Main Service (Port 3002)
    ├── MongoDB (Auth DB)
    └── MongoDB (Main DB)
```

---

## Support

Jika ada masalah:
1. Check logs: `docker-compose logs`
2. Verify connectivity: `ping vm_ip`
3. Check SSH: `ssh waf@vm_ip`
4. Restart all: `docker-compose restart`

---

**Deployment complete!** 🎉
