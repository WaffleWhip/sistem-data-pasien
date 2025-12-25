#!/bin/bash
set -e

echo "=========================================="
echo "HealthCure - Setup & Deployment"
echo "=========================================="
echo ""

echo "[1/6] Updating system..."
sudo apt-get update -y > /dev/null 2>&1
sudo apt-get upgrade -y > /dev/null 2>&1
echo "OK"

echo "[2/6] Installing Docker..."
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release > /dev/null 2>&1
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg 2>/dev/null
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null 2>&1
sudo apt-get update -y > /dev/null 2>&1
sudo apt-get install -y docker-ce docker-ce-cli containerd.io > /dev/null 2>&1
echo "OK"

echo "[3/6] Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose 2>/dev/null
sudo chmod +x /usr/local/bin/docker-compose
echo "OK"

echo "[4/6] Configuring Docker permissions..."
sudo usermod -aG docker $USER
# Apply group immediately without logout
newgrp docker << 'ENDGROUP'
echo "Docker permissions configured"
ENDGROUP
echo "OK"

echo "[5/6] Starting services..."
# Run docker compose in new group context
newgrp docker << 'ENDGROUP'
cd ~/sistem-data-pasien
docker compose up -d
sleep 5
ENDGROUP
echo "OK"

echo "[6/6] Verifying deployment..."
# Get IP for display
IP=$(hostname -I | awk '{print $1}')

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
docker compose ps
echo ""
echo "Access: http://${IP}"
echo "Email: admin@healthcure.com"
echo "Password: admin123"
echo ""
