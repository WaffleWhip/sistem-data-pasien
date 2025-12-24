#!/bin/bash
# HealthCure - VM Setup Script (Final Version)
# Jalankan di Ubuntu VM setelah upload files

set -e

echo "=========================================="
echo "HealthCure - VM Setup Script"
echo "=========================================="
echo ""

# 1. Update system
echo "[1/5] Updating system packages..."
sudo apt-get update -y > /dev/null 2>&1
sudo apt-get upgrade -y > /dev/null 2>&1

# 2. Install Docker
echo "[2/5] Installing Docker & Docker Compose..."
sudo apt-get install -y docker.io docker-compose > /dev/null 2>&1

# 3. Setup permissions
echo "[3/5] Setting up user permissions..."
sudo usermod -aG docker $(whoami)
newgrp docker

# 4. Extract dan navigate
echo "[4/5] Extracting project files..."
cd /home/azureuser
unzip -q healthcure.zip
cd sistem-data-pasien

# 5. Start services
echo "[5/5] Starting services with docker-compose..."
docker-compose up -d > /dev/null 2>&1

echo ""
echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "Application is running!"
echo ""
echo "Next steps:"
echo "1. Wait 30-60 seconds for services to initialize"
echo "2. Open browser: http://YOUR_VM_IP:3000"
echo "3. Login: admin@healthcure.com / admin123"
echo ""
echo "Useful commands:"
echo "  docker-compose ps          # Check status"
echo "  docker-compose logs -f     # View logs"
echo "  docker-compose stop        # Stop services"
echo "  docker-compose down        # Stop and remove"
echo ""
