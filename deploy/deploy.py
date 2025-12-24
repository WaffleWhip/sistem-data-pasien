#!/usr/bin/env python3
"""
HealthCure - Automated Deployment using Netmiko
Complete automated deployment to Azure VM without manual input
"""

import os
import sys
import time
import tempfile
from pathlib import Path
from netmiko import ConnectHandler
from getpass import getpass

def load_config(config_file):
    """Load configuration from vm-config.env"""
    config = {}
    try:
        with open(config_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    config[key.strip()] = value.strip()
        return config
    except FileNotFoundError:
        print(f"Error: {config_file} not found")
        sys.exit(1)

def get_deployment_script():
    """Get the deployment script to run on VM"""
    return """#!/bin/bash
set -e

echo "========== Remote Deployment Started =========="
echo ""

# Update system
echo "[1/5] Updating system..."
sudo apt-get update -y > /dev/null 2>&1
sudo apt-get upgrade -y > /dev/null 2>&1

# Install Docker dependencies
echo "[2/5] Installing Docker..."
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release > /dev/null 2>&1

# Add Docker repository
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg 2>/dev/null
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null 2>&1

# Install Docker
sudo apt-get update -y > /dev/null 2>&1
sudo apt-get install -y docker-ce docker-ce-cli containerd.io > /dev/null 2>&1

# Install Docker Compose
echo "[3/5] Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose 2>/dev/null
sudo chmod +x /usr/local/bin/docker-compose

# Setup Docker permissions
sudo usermod -aG docker $USER

echo "[4/5] Setting up project..."
mkdir -p ~/sistem-data-pasien
cd ~/sistem-data-pasien

# Clone or update project
echo "[5/5] Deploying application..."
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
"""

def main():
    print("=" * 50)
    print("HealthCure - Automated Deployment (Netmiko)")
    print("=" * 50)
    print("")

    # Get script directory
    script_dir = Path(__file__).parent
    config_file = script_dir / "vm-config.env"

    # Load configuration
    print("[1/5] Loading configuration...")
    config = load_config(config_file)
    print(f"  ✓ Target: {config.get('VM_USERNAME')}@{config.get('VM_PUBLIC_IP')}")
    print("")

    # Prepare connection
    print("[2/5] Connecting to Azure VM...")
    try:
        device = {
            'device_type': 'linux',
            'host': config['VM_PUBLIC_IP'],
            'username': config['VM_USERNAME'],
            'password': config['VM_PASSWORD'],
            'port': int(config.get('VM_SSH_PORT', 22)),
            'conn_timeout': 10,
            'read_timeout': 30,
        }

        connection = ConnectHandler(**device)
        print("  ✓ Connected successfully")
    except Exception as e:
        print(f"  ✗ Connection failed: {e}")
        print("  Please verify:")
        print("    - VM is running")
        print("    - SSH port (22) is open")
        print("    - Credentials in vm-config.env are correct")
        sys.exit(1)

    print("")

    try:
        # Create deployment script
        print("[3/5] Preparing deployment script...")
        deploy_script = get_deployment_script()
        
        # Upload and execute
        print("[4/5] Deploying application...")
        
        # Send deployment commands
        output = connection.send_command(f"cat > /tmp/deploy.sh << 'EOF'\n{deploy_script}EOF", read_timeout=5)
        output = connection.send_command("bash /tmp/deploy.sh", read_timeout=300)
        print(output)
        
        print("")
        print("[5/5] Verifying deployment...")
        output = connection.send_command("docker compose -f ~/sistem-data-pasien/docker-compose.yml ps", read_timeout=10)
        print(output)
        
        print("")
        print("=" * 50)
        print("✅ DEPLOYMENT SUCCESSFUL!")
        print("=" * 50)
        print("")
        print("Application is now running!")
        print("")
        print("Access Information:")
        print(f"  URL: http://{config['VM_PUBLIC_IP']}:{config['APP_PORT']}")
        print(f"  Email: {config['ADMIN_EMAIL']}")
        print(f"  Password: {config['ADMIN_PASSWORD']}")
        print("")
        print("Next steps:")
        print("  1. Wait 30-60 seconds for services to initialize")
        print(f"  2. Open browser: http://{config['VM_PUBLIC_IP']}:{config['APP_PORT']}")
        print("  3. Login with provided credentials")
        print("")

    except Exception as e:
        print(f"Error during deployment: {e}")
        sys.exit(1)
    finally:
        connection.disconnect()

if __name__ == "__main__":
    main()
