#!/bin/bash
# HealthCure - Complete Setup & Deployment
# 
# One-time setup untuk Azure VM Ubuntu
# Jalankan di VM: bash setup.sh
#
# Script ini akan:
# - Install Docker & Docker Compose
# - Clone repository
# - Start services
# - Display access info

set -e

echo "=========================================="
echo "HealthCure - Setup & Deployment"
echo "=========================================="
echo ""

# Update system
echo "[1/5] Updating system..."
sudo apt-get update -y > /dev/null 2>&1
sudo apt-get upgrade -y > /dev/null 2>&1
echo "✓ System updated"

# Install Docker
echo "[2/5] Installing Docker..."
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release > /dev/null 2>&1

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg 2>/dev/null
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null 2>&1

sudo apt-get update -y > /dev/null 2>&1
sudo apt-get install -y docker-ce docker-ce-cli containerd.io > /dev/null 2>&1
echo "✓ Docker installed"

# Install Docker Compose
echo "[3/5] Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose 2>/dev/null
sudo chmod +x /usr/local/bin/docker-compose
echo "✓ Docker Compose installed"

# Setup permissions
sudo usermod -aG docker $USER
echo "✓ Docker permissions configured"

# Clone & deploy
echo "[4/5] Deploying application..."
mkdir -p ~/sistem-data-pasien
cd ~/sistem-data-pasien

if [ ! -d .git ]; then
    git clone --depth 1 https://github.com/WaffleWhip/sistem-data-pasien.git . 2>/dev/null || {
        echo "Note: Git clone needs credentials for private repos"
        echo "Download and extract manually if needed"
    }
fi

echo "✓ Project ready"

# Start services
echo "[5/5] Starting services..."
docker compose up -d
sleep 5

echo ""
echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
docker compose ps
echo ""
echo "Application Info:"
echo "  URL: http://localhost:3000"
echo "  Admin Email: admin@healthcure.com"
echo "  Admin Password: admin123"
echo ""
echo "Access from your computer:"
echo "  Open browser: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
