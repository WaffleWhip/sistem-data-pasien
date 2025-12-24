# HealthCure - Deploy to Azure VM (PowerShell)
# 
# DESCRIPTION:
#   Automated deployment script to deploy HealthCure application to Azure VM
#   using SSH and Docker Compose configured via vm-config.env
#
# USAGE:
#   .\deploy-to-azure.ps1
#   .\deploy-to-azure.ps1 -ConfigFile "custom-config.env"
#
# PREREQUISITES:
#   1. SSH client installed (Windows 10+, Git Bash, or WSL)
#   2. vm-config.env file configured with correct Azure VM credentials
#   3. Azure VM running with SSH access enabled
#   4. Docker and Docker Compose installed on Azure VM
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

# 1. Read configuration file
Write-Host "[1/5] Reading configuration..." -ForegroundColor Yellow
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
    Write-Host "[2/5] Verifying SSH connectivity..." -ForegroundColor Yellow
    $sshTest = & ssh -o BatchMode=yes -o ConnectTimeout=5 "$($config.VM_USERNAME)@$($config.VM_PUBLIC_IP)" "echo OK" 2>&1
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

    # 3. Upload project files
    Write-Host "[3/5] Uploading project files to VM..." -ForegroundColor Yellow
    $projectRoot = "$PSScriptRoot\.."
    
    & scp -r "$projectRoot\docker-compose.yml" "$($config.VM_USERNAME)@$($config.VM_PUBLIC_IP):~/sistem-data-pasien/"
    & scp -r "$projectRoot\docker" "$($config.VM_USERNAME)@$($config.VM_PUBLIC_IP):~/sistem-data-pasien/"
    & scp -r "$projectRoot\frontend" "$($config.VM_USERNAME)@$($config.VM_PUBLIC_IP):~/sistem-data-pasien/"
    & scp -r "$projectRoot\main-service" "$($config.VM_USERNAME)@$($config.VM_PUBLIC_IP):~/sistem-data-pasien/"
    & scp -r "$projectRoot\auth-service" "$($config.VM_USERNAME)@$($config.VM_PUBLIC_IP):~/sistem-data-pasien/"
    
    Write-Host "Project files uploaded" -ForegroundColor Green
    Write-Host ""

    # 4. Create required directories on VM
    Write-Host "[4/5] Initializing VM environment..." -ForegroundColor Yellow
    & ssh "$($config.VM_USERNAME)@$($config.VM_PUBLIC_IP)" "mkdir -p ~/sistem-data-pasien"
    Write-Host "VM environment initialized" -ForegroundColor Green
    Write-Host ""

    # 5. Start services via Docker Compose
    Write-Host "[5/5] Starting services..." -ForegroundColor Yellow
    & ssh "$($config.VM_USERNAME)@$($config.VM_PUBLIC_IP)" @"
cd ~/sistem-data-pasien
docker compose up -d
sleep 5
docker compose ps
"@

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
