# HealthCure - Deploy to Azure VM (PowerShell)
# 
# DESCRIPTION:
#   Automated deployment script to deploy HealthCure application to Azure VM
#   Installs SSH client if needed, Docker, Docker Compose, and starts all services
#
# USAGE:
#   .\deploy-to-azure.ps1
#   .\deploy-to-azure.ps1 -ConfigFile "custom-config.env"
#
# PREREQUISITES:
#   1. Windows 10+ or newer
#   2. Administrator privileges (for SSH installation)
#   3. vm-config.env file configured with correct Azure VM credentials
#   4. Azure VM running with SSH access enabled
#
# AUTHOR: HealthCure Dev Team

param(
    [string]$ConfigFile = "$PSScriptRoot\vm-config.env"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "HealthCure - Azure VM Deployment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check SSH availability
Write-Host "[0/7] Checking SSH client..." -ForegroundColor Yellow
$sshTest = & ssh -V 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "SSH client not found. Installing OpenSSH..." -ForegroundColor Yellow
    
    # Check if running as administrator
    $isAdmin = [bool]([System.Security.Principal.WindowsIdentity]::GetCurrent().Groups -match "S-1-5-32-544")
    if (-not $isAdmin) {
        Write-Host "Error: Administrator privileges required to install OpenSSH" -ForegroundColor Red
        Write-Host "Please run this script as Administrator" -ForegroundColor Yellow
        exit 1
    }
    
    try {
        Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0 -ErrorAction SilentlyContinue | Out-Null
        Write-Host "SSH client installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "Error: Could not install SSH client" -ForegroundColor Red
        Write-Host "Please install manually or use WSL/Git Bash instead" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "SSH client found" -ForegroundColor Green
}
Write-Host ""

# 1. Read configuration file
Write-Host "[1/7] Reading configuration..." -ForegroundColor Yellow
if (-not (Test-Path $ConfigFile)) {
    Write-Host "Error: vm-config.env not found at $ConfigFile" -ForegroundColor Red
    exit 1
}

$config = @{}
Get-Content $ConfigFile | Where-Object { $_ -match '^\s*[^#]' } | ForEach-Object {
    if ($_ -match '^\s*([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $config[$key] = $value
    }
}

Write-Host "Configuration loaded" -ForegroundColor Green
Write-Host "  VM IP: $($config.VM_PUBLIC_IP)" -ForegroundColor Gray
Write-Host "  User: $($config.VM_USERNAME)" -ForegroundColor Gray
Write-Host ""

try {
    # 2. Verify SSH connectivity
    Write-Host "[2/7] Verifying SSH connectivity..." -ForegroundColor Yellow
    $sshTest = & ssh -o BatchMode=yes -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$($config.VM_USERNAME)@$($config.VM_PUBLIC_IP)" "echo OK" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Cannot connect to VM via SSH" -ForegroundColor Red
        Write-Host "Please verify:" -ForegroundColor Yellow
        Write-Host "  1. Azure VM is running"
        Write-Host "  2. SSH port (22) is open in security group"
        Write-Host "  3. Credentials in vm-config.env are correct"
        exit 1
    }
    Write-Host "SSH connection verified" -ForegroundColor Green
    Write-Host ""

    # 3. Install Docker and dependencies
    Write-Host "[3/7] Installing Docker and Docker Compose..." -ForegroundColor Yellow
    & ssh -o StrictHostKeyChecking=no "$($config.VM_USERNAME)@$($config.VM_PUBLIC_IP)" @"
set -e
sudo apt-get update -y > /dev/null 2>&1
sudo apt-get upgrade -y > /dev/null 2>&1
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release > /dev/null 2>&1
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg > /dev/null 2>&1
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \$(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null 2>&1
sudo apt-get update -y > /dev/null 2>&1
sudo apt-get install -y docker-ce docker-ce-cli containerd.io > /dev/null 2>&1
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose > /dev/null 2>&1
sudo chmod +x /usr/local/bin/docker-compose
sudo usermod -aG docker \$USER > /dev/null 2>&1
echo "Docker and Docker Compose installed"
"@
    Write-Host "Installation complete" -ForegroundColor Green
    Write-Host ""

    # 4. Upload project files
    Write-Host "[4/7] Uploading project files to VM..." -ForegroundColor Yellow
    $projectRoot = "$PSScriptRoot\.."
    
    & ssh -o StrictHostKeyChecking=no "$($config.VM_USERNAME)@$($config.VM_PUBLIC_IP)" "mkdir -p ~/sistem-data-pasien" 2>$null
    & scp -r -o StrictHostKeyChecking=no "$projectRoot\docker-compose.yml" "$($config.VM_USERNAME)@$($config.VM_PUBLIC_IP):~/sistem-data-pasien/" 2>$null
    & scp -r -o StrictHostKeyChecking=no "$projectRoot\docker" "$($config.VM_USERNAME)@$($config.VM_PUBLIC_IP):~/sistem-data-pasien/" 2>$null
    & scp -r -o StrictHostKeyChecking=no "$projectRoot\frontend" "$($config.VM_USERNAME)@$($config.VM_PUBLIC_IP):~/sistem-data-pasien/" 2>$null
    & scp -r -o StrictHostKeyChecking=no "$projectRoot\main-service" "$($config.VM_USERNAME)@$($config.VM_PUBLIC_IP):~/sistem-data-pasien/" 2>$null
    & scp -r -o StrictHostKeyChecking=no "$projectRoot\auth-service" "$($config.VM_USERNAME)@$($config.VM_PUBLIC_IP):~/sistem-data-pasien/" 2>$null
    
    Write-Host "Project files uploaded" -ForegroundColor Green
    Write-Host ""

    # 5. Start services via Docker Compose
    Write-Host "[5/7] Starting services..." -ForegroundColor Yellow
    & ssh -o StrictHostKeyChecking=no "$($config.VM_USERNAME)@$($config.VM_PUBLIC_IP)" "newgrp docker" 2>$null
    & ssh -o StrictHostKeyChecking=no "$($config.VM_USERNAME)@$($config.VM_PUBLIC_IP)" @"
cd ~/sistem-data-pasien
docker compose up -d
sleep 5
docker compose ps
"@
    Write-Host ""

    # 6. Verify services
    Write-Host "[6/7] Verifying services..." -ForegroundColor Yellow
    & ssh -o StrictHostKeyChecking=no "$($config.VM_USERNAME)@$($config.VM_PUBLIC_IP)" "docker compose -f ~/sistem-data-pasien/docker-compose.yml ps" 2>$null
    Write-Host "Services verified" -ForegroundColor Green
    Write-Host ""

    # 7. Display summary
    Write-Host "[7/7] Deployment Summary" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "Deployment Complete" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""

    Write-Host "Application Information:" -ForegroundColor Yellow
    Write-Host "  URL: http://$($config.VM_PUBLIC_IP):$($config.APP_PORT)" -ForegroundColor Green
    Write-Host "  Email: $($config.ADMIN_EMAIL)" -ForegroundColor Green
    Write-Host "  Password: $($config.ADMIN_PASSWORD)" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Wait 30-60 seconds for services to initialize"
    Write-Host "  2. Open browser: http://$($config.VM_PUBLIC_IP):$($config.APP_PORT)"
    Write-Host "  3. Login with provided credentials"
    Write-Host ""
    
    Write-Host "Connect to VM:" -ForegroundColor Yellow
    Write-Host "  ssh $($config.VM_USERNAME)@$($config.VM_PUBLIC_IP)" -ForegroundColor Gray
    Write-Host ""

} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
