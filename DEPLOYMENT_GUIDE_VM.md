# HealthCure - Azure VM Deployment Guide

## Prerequisites

Required Azure VM configuration:
- Ubuntu Server 24.04 LTS
- 2 vCPU, 4GB RAM (Standard B2ats v2)
- Public IP address
- SSH port (22) accessible
- Admin credentials (username and password)

---

## Deployment Steps

### Step 1: Prepare Project Files

```powershell
# Navigate to project directory
cd D:\Project

# Create deployment package
Compress-Archive -Path sistem-data-pasien -DestinationPath healthcure.zip

# Verify package
ls healthcure.zip
```

**Output:** `C:\Users\{username}\Project\healthcure.zip`

---

### Step 2: Upload to Azure VM

```powershell
# Configure VM details
$VM_IP = "YOUR_VM_PUBLIC_IP"
$VM_USER = "your_username"

# Upload deployment package
scp healthcure.zip ${VM_USER}@${VM_IP}:/home/${VM_USER}/
```

**Expected output:** Upload completes without errors

---

### Step 3: Connect to Azure VM via SSH

```powershell
# Establish SSH connection
ssh ${VM_USER}@YOUR_VM_PUBLIC_IP

# You will be prompted for password
```

---

### Step 4: Deploy Services on VM

Execute deployment script:

```bash
# Make script executable
chmod +x deploy-to-azure.sh

# Run automated deployment
./deploy-to-azure.sh
```

**Deployment Actions:**
- Updates system packages
- Installs Docker and Docker Compose
- Extracts project files
- Starts all services (Auth, Main, Frontend, MongoDB instances)

**Duration:** 2-3 minutes

---

### Step 5: Verify Service Deployment

```bash
# Check running services
docker compose ps

# Expected output:
# NAME                    IMAGE                 STATUS
# healthcure-auth-service               UP
# healthcure-main-service               UP
# healthcure-frontend                   UP
# healthcure-mongodb-auth               UP
# healthcure-mongodb-main               UP

# View service logs
docker compose logs -f
```

---

### Step 6: Access Application

Open web browser and navigate to:
```
http://YOUR_VM_PUBLIC_IP:3000
```

**Default Admin Credentials:**
```
Email: admin@healthcure.com
Password: admin123
```

---

## Troubleshooting

### Services Not Starting

Check service logs and restart:
```bash
# View service logs
docker compose logs

# Restart all services
docker compose restart

# Complete reset
docker compose down
docker compose up -d
```

### Port Already in Use

If port 3000 is occupied:
```bash
# Identify process using port 3000
sudo lsof -i :3000

# Modify docker-compose.yml to use different port:
# ports:
#   - "8000:3000"  # Use 8000 instead of 3000
```

### Permission Denied Errors

If permission errors occur:
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Logout and reconnect
exit
ssh ${VM_USER}@YOUR_VM_PUBLIC_IP
```

---

## Cleanup and Teardown

To remove application (if needed):

```bash
# Stop all services
docker compose down

# Remove all containers and volumes
docker compose down -v

# Remove project directory
rm -rf ~/sistem-data-pasien
```

---

## Common Docker Compose Commands

Essential commands for managing services:

```bash
# Check all running services
docker compose ps

# View real-time logs
docker compose logs -f

# View logs for specific service
docker compose logs -f auth-service

# Stop all services
docker compose stop

# Start all services
docker compose start

# Restart all services
docker compose restart

# View resource usage
docker stats

# Execute command in container
docker exec -it healthcure-auth-service bash
```

---

## System Architecture

```
Azure VM (Ubuntu 24.04)
├── Docker Engine
└── Docker Compose (5 containers)
    ├── Frontend Application (Port 3000)
    ├── Auth Service (Port 3001)
    ├── Main Service (Port 3002)
    ├── MongoDB - Authentication Database
    └── MongoDB - Project Database
```

---

## Support and Assistance

If issues occur during deployment:

1. Review service logs: `docker compose logs`
2. Verify network connectivity: `ping vm_ip`
3. Check SSH connection: `ssh ${VM_USER}@vm_ip`
4. Restart all services: `docker compose restart`
5. Consult troubleshooting section above

---

**Deployment Complete**
