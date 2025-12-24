#!/usr/bin/env pwsh
# Deploy HealthCure ke Azure VM menggunakan Docker Compose
# Usage: .\deploy\deploy-vm.ps1

param(
    [string]$ConfigFile = ".\deploy\vm-config.env"
)

Write-Host ""
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  HealthCure - Azure VM Deployment (Docker Compose)" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# 1. Load configuration
Write-Host "[1/4] Loading configuration..." -ForegroundColor Yellow
if (-not (Test-Path $ConfigFile)) {
    Write-Host "❌ ERROR: Config file not found: $ConfigFile" -ForegroundColor Red
    Write-Host "Buat file terlebih dahulu dan isi dengan credentials VM Anda" -ForegroundColor Yellow
    exit 1
}

$config = @{}
Get-Content $ConfigFile | Where-Object { $_ -notmatch "^#" -and $_ -notmatch "^$" } | ForEach-Object {
    $key, $value = $_ -split "=", 2
    $config[$key.Trim()] = $value.Trim()
}

Write-Host "✅ Configuration loaded" -ForegroundColor Green
Write-Host "   VM IP: $($config['VM_PUBLIC_IP'])" -ForegroundColor Cyan
Write-Host "   Username: $($config['VM_USERNAME'])" -ForegroundColor Cyan
Write-Host ""

# 2. Connect ke VM
Write-Host "[2/4] Connecting to VM via SSH..." -ForegroundColor Yellow
$vmIp = $config['VM_PUBLIC_IP']
$vmUser = $config['VM_USERNAME']
$gitRepo = $config['GITHUB_REPO']

Write-Host "   ssh $vmUser@$vmIp" -ForegroundColor Gray
Write-Host ""

# 3. Setup script
Write-Host "[3/4] Preparing setup commands..." -ForegroundColor Yellow

$setupScript = @"
#!/bin/bash
set -e

echo '=========================================='
echo 'HealthCure VM Setup - Docker Compose'
echo '=========================================='
echo ''

# 1. Update system
echo '[1/5] Updating system...'
sudo apt-get update -y > /dev/null

# 2. Install Docker
echo '[2/5] Installing Docker & Docker Compose...'
sudo apt-get install -y docker.io docker-compose git > /dev/null

# 3. Setup user permissions
echo '[3/5] Setting up permissions...'
sudo usermod -aG docker `$(whoami)
newgrp docker

# 4. Clone repository
echo '[4/5] Cloning repository...'
rm -rf ~/sistem-data-pasien 2>/dev/null || true
git clone $gitRepo ~/sistem-data-pasien
cd ~/sistem-data-pasien

# 5. Start services
echo '[5/5] Starting services with docker-compose...'
docker-compose up -d

echo ''
echo '=========================================='
echo '✅ DEPLOYMENT COMPLETE!'
echo '=========================================='
echo ''
echo 'Application URL: http://$vmIp:3000'
echo 'Login: admin@healthcure.com / admin123'
echo ''
echo 'Check status: docker-compose ps'
echo 'View logs: docker-compose logs -f'
echo ''
"@

Write-Host "Setup script ready" -ForegroundColor Green
Write-Host ""

# 4. Instructions
Write-Host "[4/4] Deployment Instructions..." -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Next steps:" -ForegroundColor Green
Write-Host ""
Write-Host "1. SSH ke VM:" -ForegroundColor Cyan
Write-Host "   ssh $vmUser@$vmIp" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Copy & paste commands ini di VM terminal:" -ForegroundColor Cyan
Write-Host ""
Write-Host "---BEGIN---" -ForegroundColor Gray
Write-Host $setupScript -ForegroundColor Gray
Write-Host "---END---" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Tunggu ~2 menit untuk services starting" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Access aplikasi:" -ForegroundColor Cyan
Write-Host "   http://$vmIp:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Login dengan:" -ForegroundColor Cyan
Write-Host "   Email: admin@healthcure.com" -ForegroundColor Gray
Write-Host "   Password: admin123" -ForegroundColor Gray
Write-Host ""

# Save script ke file
$setupScript | Out-File -FilePath ".\deploy\vm-setup.sh" -Encoding UTF8
Write-Host "Setup script disimpan ke: .\deploy\vm-setup.sh" -ForegroundColor Cyan
Write-Host ""
