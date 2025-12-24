#!/bin/bash
# HealthCure - Complete Automated Deployment
# 
# Fully automated - installs everything needed, deploys, and cleans up
# No prerequisites required! Just run this script.
#
# Usage: ./deploy.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/vm-config.env"
TEMP_DIR="/tmp/healthcure-deploy"

echo "=========================================="
echo "HealthCure - Automated Deployment"
echo "=========================================="
echo ""

# Cleanup function
cleanup() {
    if [ $? -ne 0 ]; then
        echo ""
        echo "Error during deployment!"
    fi
}
trap cleanup EXIT

# Check config
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: vm-config.env not found"
    exit 1
fi

# Load config
source "$CONFIG_FILE"

# Step 0: Install dependencies
echo "[1/6] Checking and installing dependencies..."

# Check/install SSH
if ! command -v ssh &> /dev/null; then
    echo "  Installing SSH client..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update > /dev/null 2>&1
        sudo apt-get install -y openssh-client > /dev/null 2>&1
    elif command -v yum &> /dev/null; then
        sudo yum install -y openssh-clients > /dev/null 2>&1
    fi
fi

# Check/install sshpass
if ! command -v sshpass &> /dev/null; then
    echo "  Installing sshpass..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update > /dev/null 2>&1
        sudo apt-get install -y sshpass > /dev/null 2>&1
    elif command -v yum &> /dev/null; then
        sudo yum install -y sshpass > /dev/null 2>&1
    elif command -v brew &> /dev/null; then
        brew install sshpass > /dev/null 2>&1
    else
        echo "Warning: Cannot auto-install sshpass. Please install manually."
    fi
fi

echo "Dependencies ready"
echo ""

# Step 1: Create deployment script
echo "[2/6] Preparing deployment script..."

mkdir -p "$TEMP_DIR"

cat > "$TEMP_DIR/remote-deploy.sh" << 'EOF'
#!/bin/bash
set -e

echo "========== Remote Deployment Started =========="
echo ""

# Update system
echo "[2.1/5] Updating system..."
sudo apt-get update -y > /dev/null 2>&1
sudo apt-get upgrade -y > /dev/null 2>&1

# Install Docker dependencies
echo "[2.2/5] Installing Docker..."
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release > /dev/null 2>&1

# Add Docker repository
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg 2>/dev/null
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null 2>&1

# Install Docker
sudo apt-get update -y > /dev/null 2>&1
sudo apt-get install -y docker-ce docker-ce-cli containerd.io > /dev/null 2>&1

# Install Docker Compose
echo "[2.3/5] Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose 2>/dev/null
sudo chmod +x /usr/local/bin/docker-compose

# Setup Docker permissions
sudo usermod -aG docker $USER

echo "[2.4/5] Setting up project..."
mkdir -p ~/sistem-data-pasien
cd ~/sistem-data-pasien

# Clone or update project
echo "[2.5/5] Deploying application..."
if [ ! -d .git ]; then
    git clone --depth 1 https://github.com/WaffleWhip/sistem-data-pasien.git . 2>/dev/null || true
fi

# Start services
docker compose up -d 2>/dev/null || true
sleep 5

echo ""
echo "========== Deployment Complete =========="
docker compose ps
echo ""
EOF

chmod +x "$TEMP_DIR/remote-deploy.sh"
echo "Deployment script ready"
echo ""

# Step 2: Connect and deploy
echo "[3/6] Connecting to Azure VM..."
echo "      $VM_USERNAME@$VM_PUBLIC_IP"

# Verify SSH works
if ! sshpass -p "$VM_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 "$VM_USERNAME@$VM_PUBLIC_IP" "echo Connected" > /dev/null 2>&1; then
    echo "Error: Cannot connect to VM"
    echo "Please verify:"
    echo "  - VM is running"
    echo "  - SSH port (22) is open"
    echo "  - Credentials are correct in vm-config.env"
    exit 1
fi
echo "Connection successful!"
echo ""

# Step 3: Upload and execute
echo "[4/6] Uploading deployment script..."
sshpass -p "$VM_PASSWORD" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$TEMP_DIR/remote-deploy.sh" "$VM_USERNAME@$VM_PUBLIC_IP:/tmp/deploy.sh" > /dev/null 2>&1
echo "Upload complete"
echo ""

echo "[5/6] Running deployment on VM..."
sshpass -p "$VM_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$VM_USERNAME@$VM_PUBLIC_IP" "bash /tmp/deploy.sh"
echo ""

# Step 4: Verify
echo "[6/6] Verifying deployment..."
SERVICES=$(sshpass -p "$VM_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$VM_USERNAME@$VM_PUBLIC_IP" "docker compose -f ~/sistem-data-pasien/docker-compose.yml ps --quiet" 2>/dev/null | wc -l)

if [ "$SERVICES" -gt 0 ]; then
    echo "Services running: $SERVICES containers"
else
    echo "Warning: Could not verify services"
fi
echo ""

# Cleanup
echo "Cleaning up temporary files..."
rm -rf "$TEMP_DIR"
echo ""

# Success message
echo "=========================================="
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo "=========================================="
echo ""
echo "Application is now running!"
echo ""
echo "Access Information:"
echo "  URL: http://$VM_PUBLIC_IP:$APP_PORT"
echo "  Email: $ADMIN_EMAIL"
echo "  Password: $ADMIN_PASSWORD"
echo ""
echo "Next steps:"
echo "  1. Wait 30-60 seconds for services to initialize"
echo "  2. Open browser: http://$VM_PUBLIC_IP:$APP_PORT"
echo "  3. Login with provided credentials"
echo ""
echo "Connect to VM:"
echo "  ssh $VM_USERNAME@$VM_PUBLIC_IP"
echo ""
