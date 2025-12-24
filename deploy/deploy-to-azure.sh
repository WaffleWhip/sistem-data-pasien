#!/bin/bash
# HealthCure - Deploy to Azure VM (Bash)
# Membaca config dari vm-config.env dan deploy ke Azure VM

set -e

CONFIG_FILE="${1:-.\/vm-config.env}"

echo "=========================================="
echo "HealthCure - Azure VM Deployment"
echo "=========================================="
echo ""

# 1. Read config file
echo "[1/5] Reading configuration..."
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: vm-config.env not found at $CONFIG_FILE"
    exit 1
fi

# Source the config file (safely)
set -a
source "$CONFIG_FILE"
set +a

echo "✓ Config loaded"
echo "  VM: $VM_PUBLIC_IP"
echo "  User: $VM_USERNAME"
echo ""

# 2. Prepare deployment package
echo "[2/5] Preparing deployment package..."
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ZIP_FILE="$(dirname "$0")/healthcure-deploy.zip"

rm -f "$ZIP_FILE"
cd "$PROJECT_ROOT"

zip -q -r "$ZIP_FILE" \
    docker-compose.yml \
    docker/ \
    frontend/ \
    main-service/ \
    auth-service/

echo "✓ Package created: $ZIP_FILE"
echo ""

# 3. Upload to Azure VM and extract
echo "[3/5] Uploading to Azure VM..."
echo "  Target: $VM_USERNAME@$VM_PUBLIC_IP"

scp -o StrictHostKeyChecking=no \
    -o UserKnownHostsFile=/dev/null \
    -o ConnectTimeout=10 \
    "$ZIP_FILE" "$VM_USERNAME@$VM_PUBLIC_IP:/tmp/healthcure-deploy.zip"

echo "✓ Upload complete"
echo ""

# 4. Extract and start services
echo "[4/5] Extracting files and starting services..."

ssh -o StrictHostKeyChecking=no \
    -o UserKnownHostsFile=/dev/null \
    "$VM_USERNAME@$VM_PUBLIC_IP" << 'REMOTE_COMMANDS'
set -e
echo "✓ Connected to VM"

# Extract files
mkdir -p ~/healthcure
cd ~/healthcure
unzip -q -o /tmp/healthcure-deploy.zip
rm -f /tmp/healthcure-deploy.zip

echo "✓ Files extracted"

# Start services
docker compose up -d
sleep 5
docker compose ps

echo "✓ Services started"
REMOTE_COMMANDS

echo ""

echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""

echo "Application Info:"
echo "  URL: http://$VM_PUBLIC_IP:$APP_PORT"
echo "  Email: $ADMIN_EMAIL"
echo "  Password: $ADMIN_PASSWORD"
echo ""

echo "Next steps:"
echo "1. Wait 30-60 seconds for services to initialize"
echo "2. Open browser: http://$VM_PUBLIC_IP:$APP_PORT"
echo "3. Login with credentials above"
echo ""

echo "SSH to VM for debugging:"
echo "  ssh $VM_USERNAME@$VM_PUBLIC_IP"
echo ""

# Cleanup
rm -f "$ZIP_FILE"
echo "Cleanup: Temporary zip file removed"
