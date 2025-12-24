#!/bin/bash
# HealthCure - Deploy to Azure VM (Bash)
#
# DESCRIPTION:
#   Automated deployment script to deploy HealthCure application to Azure VM
#   Installs Docker, Docker Compose, and starts all services
#
# USAGE:
#   ./deploy-to-azure.sh
#   ./deploy-to-azure.sh custom-config.env
#
# PREREQUISITES:
#   1. OpenSSH client installed (Linux/Mac or WSL on Windows)
#   2. vm-config.env file configured with Azure VM credentials
#   3. Azure VM running with SSH access enabled
#   4. sshpass utility (for non-interactive password authentication)
#
# AUTHOR: HealthCure Dev Team

set -e

CONFIG_FILE="${1:-.\/vm-config.env}"

echo "=========================================="
echo "HealthCure - Azure VM Deployment"
echo "=========================================="
echo ""

# 1. Read configuration file
echo "[1/7] Reading configuration..."
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: vm-config.env not found at $CONFIG_FILE"
    exit 1
fi

set -a
source "$CONFIG_FILE"
set +a

echo "Configuration loaded"
echo "  VM IP: $VM_PUBLIC_IP"
echo "  User: $VM_USERNAME"
echo ""

# 2. Check sshpass utility
echo "[2/7] Checking sshpass utility..."
if ! command -v sshpass &> /dev/null; then
    echo "Warning: sshpass not found. Installing..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update > /dev/null 2>&1 && sudo apt-get install -y sshpass > /dev/null 2>&1
    elif command -v brew &> /dev/null; then
        brew install sshpass > /dev/null 2>&1
    else
        echo "Error: Cannot install sshpass. Please install manually."
        exit 1
    fi
fi
echo "sshpass available"
echo ""

# 3. Verify SSH connectivity
echo "[3/7] Verifying SSH connectivity..."
if ! sshpass -p "$VM_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=5 "$VM_USERNAME@$VM_PUBLIC_IP" "echo OK" >/dev/null 2>&1; then
    echo "Error: Cannot connect to VM via SSH"
    echo "Please verify:"
    echo "  1. Azure VM is running"
    echo "  2. SSH port (22) is open in security group"
    echo "  3. Credentials in vm-config.env are correct"
    exit 1
fi
echo "SSH connection verified"
echo ""

# 4. Install Docker and dependencies
echo "[4/7] Installing Docker and Docker Compose..."
sshpass -p "$VM_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$VM_USERNAME@$VM_PUBLIC_IP" << 'DOCKER_SETUP'
set -e
sudo apt-get update -y > /dev/null 2>&1
sudo apt-get upgrade -y > /dev/null 2>&1
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release > /dev/null 2>&1
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg > /dev/null 2>&1
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null 2>&1
sudo apt-get update -y > /dev/null 2>&1
sudo apt-get install -y docker-ce docker-ce-cli containerd.io > /dev/null 2>&1
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose > /dev/null 2>&1
sudo chmod +x /usr/local/bin/docker-compose
sudo usermod -aG docker $USER > /dev/null 2>&1
echo "Docker and Docker Compose installed"
DOCKER_SETUP
echo "Installation complete"
echo ""

# 5. Upload project files
echo "[5/7] Uploading project files to VM..."
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

sshpass -p "$VM_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$VM_USERNAME@$VM_PUBLIC_IP" "mkdir -p ~/sistem-data-pasien" 2>/dev/null
sshpass -p "$VM_PASSWORD" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -r "$PROJECT_ROOT/docker-compose.yml" "$VM_USERNAME@$VM_PUBLIC_IP:~/sistem-data-pasien/" >/dev/null 2>&1
sshpass -p "$VM_PASSWORD" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -r "$PROJECT_ROOT/docker" "$VM_USERNAME@$VM_PUBLIC_IP:~/sistem-data-pasien/" >/dev/null 2>&1
sshpass -p "$VM_PASSWORD" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -r "$PROJECT_ROOT/frontend" "$VM_USERNAME@$VM_PUBLIC_IP:~/sistem-data-pasien/" >/dev/null 2>&1
sshpass -p "$VM_PASSWORD" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -r "$PROJECT_ROOT/main-service" "$VM_USERNAME@$VM_PUBLIC_IP:~/sistem-data-pasien/" >/dev/null 2>&1
sshpass -p "$VM_PASSWORD" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -r "$PROJECT_ROOT/auth-service" "$VM_USERNAME@$VM_PUBLIC_IP:~/sistem-data-pasien/" >/dev/null 2>&1

echo "Project files uploaded"
echo ""

# 6. Start services via Docker Compose
echo "[6/7] Starting services..."
sshpass -p "$VM_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$VM_USERNAME@$VM_PUBLIC_IP" << 'DOCKER_RUN'
cd ~/sistem-data-pasien
docker compose up -d
sleep 5
docker compose ps
DOCKER_RUN
echo ""

# 7. Display summary
echo "[7/7] Deployment Summary"
echo ""
echo "=========================================="
echo "Deployment Complete"
echo "=========================================="
echo ""

echo "Application Information:"
echo "  URL: http://$VM_PUBLIC_IP:$APP_PORT"
echo "  Email: $ADMIN_EMAIL"
echo "  Password: $ADMIN_PASSWORD"
echo ""

echo "Next Steps:"
echo "  1. Wait 30-60 seconds for services to initialize"
echo "  2. Open browser: http://$VM_PUBLIC_IP:$APP_PORT"
echo "  3. Login with provided credentials"
echo ""

echo "Connect to VM:"
echo "  ssh $VM_USERNAME@$VM_PUBLIC_IP"
echo ""
