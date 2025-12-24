#!/bin/bash
set -e

echo "=========================================="
echo "HealthCure - Setup & Deployment"
echo "=========================================="
echo ""

echo "[1/5] Updating system..."
sudo apt-get update -y > /dev/null 2>&1
sudo apt-get upgrade -y > /dev/null 2>&1
echo "OK"

echo "[2/5] Installing Docker..."
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release > /dev/null 2>&1
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg 2>/dev/null
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null 2>&1
sudo apt-get update -y > /dev/null 2>&1
sudo apt-get install -y docker-ce docker-ce-cli containerd.io > /dev/null 2>&1
echo "OK"

echo "[3/5] Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose 2>/dev/null
sudo chmod +x /usr/local/bin/docker-compose
sudo usermod -aG docker $USER
echo "OK"

echo "[4/5] Deploying application..."
mkdir -p ~/sistem-data-pasien
cd ~/sistem-data-pasien
[ ! -d .git ] && git clone --depth 1 https://github.com/WaffleWhip/sistem-data-pasien.git . 2>/dev/null || true
echo "OK"

echo "[5/5] Starting services..."
docker compose up -d
sleep 5
echo "OK"

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
docker compose ps
echo ""
echo "Access: http://$(hostname -I | awk '{print $1}'):3000"
echo "Email: admin@healthcure.com"
echo "Password: admin123"
echo ""
