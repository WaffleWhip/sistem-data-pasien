# HealthCure - Deploy to Azure VM (PowerShell)
# 
# DESCRIPTION:
#   Automated deployment script untuk deploy aplikasi HealthCure ke Azure VM
#   dengan Docker Compose dari file konfigurasi vm-config.env
#
# USAGE:
#   .\deploy-to-azure.ps1
#   .\deploy-to-azure.ps1 -ConfigFile "custom-config.env"
#
# PREREQUISITES:
#   1. Docker Desktop installed pada host
#   2. VM-config.env file sudah disiapkan dengan credentials yang benar
#   3. Azure VM sudah running dan bisa diakses via SSH
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

# 1. Read config file
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

Write-Host "✓ Config loaded" -ForegroundColor Green
Write-Host "  VM: $($config.VM_PUBLIC_IP)" -ForegroundColor Gray
Write-Host "  User: $($config.VM_USERNAME)" -ForegroundColor Gray
Write-Host ""

try {
    # 2. Prepare deployment package
    Write-Host "[2/5] Preparing deployment package..." -ForegroundColor Yellow
    $projectRoot = "$PSScriptRoot\.."
    $zipFile = "$PSScriptRoot\healthcure-deploy.zip"
    
    if (Test-Path $zipFile) {
        Remove-Item $zipFile -Force
    }
    
    Compress-Archive -Path @(
        "$projectRoot\docker-compose.yml",
        "$projectRoot\docker",
        "$projectRoot\frontend",
        "$projectRoot\main-service",
        "$projectRoot\auth-service"
    ) -DestinationPath $zipFile -ErrorAction SilentlyContinue
    
    Write-Host "✓ Package created: $zipFile" -ForegroundColor Green
    Write-Host ""

    # 3. Upload to Azure VM
    Write-Host "[3/5] Uploading to Azure VM..." -ForegroundColor Yellow
    Write-Host "  Target: $($config.VM_USERNAME)@$($config.VM_PUBLIC_IP)" -ForegroundColor Gray
    
    # Using PSSession for remote execution
    $secPassword = ConvertTo-SecureString $config.VM_PASSWORD -AsPlainText -Force
    $cred = New-Object System.Management.Automation.PSCredential($config.VM_USERNAME, $secPassword)
    
    $session = New-PSSession -ComputerName $config.VM_PUBLIC_IP -Credential $cred -ErrorAction Stop
    Write-Host "✓ Connected to VM" -ForegroundColor Green
    Write-Host ""

    # 4. Copy files and extract
    Write-Host "[4/5] Extracting files on VM..." -ForegroundColor Yellow
    Copy-Item $zipFile -Destination "C:\temp\" -ToSession $session -Force
    
    Invoke-Command -Session $session -ScriptBlock {
        $zipPath = "C:\temp\healthcure-deploy.zip"
        $extractPath = "C:\healthcure"
        
        if (Test-Path $extractPath) {
            Remove-Item $extractPath -Recurse -Force
        }
        
        New-Item -ItemType Directory -Path $extractPath -Force | Out-Null
        Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force
        
        Write-Host "✓ Files extracted to $extractPath" -ForegroundColor Green
    }
    Write-Host ""

    # 5. Start services
    Write-Host "[5/5] Starting Docker Compose services..." -ForegroundColor Yellow
    Invoke-Command -Session $session -ScriptBlock {
        Set-Location C:\healthcure
        & docker compose up -d
        Start-Sleep -Seconds 5
        & docker compose ps
    }
    
    Remove-PSSession -Session $session
    Write-Host ""

    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""

    Write-Host "Application Info:" -ForegroundColor Yellow
    Write-Host "  URL: http://$($config.VM_PUBLIC_IP):$($config.APP_PORT)" -ForegroundColor Green
    Write-Host "  Email: $($config.ADMIN_EMAIL)" -ForegroundColor Green
    Write-Host "  Password: $($config.ADMIN_PASSWORD)" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Wait 30-60 seconds for services to initialize"
    Write-Host "2. Open browser: http://$($config.VM_PUBLIC_IP):$($config.APP_PORT)"
    Write-Host "3. Login with credentials above"
    Write-Host ""
    
    Write-Host "SSH to VM for debugging:" -ForegroundColor Yellow
    Write-Host "  ssh $($config.VM_USERNAME)@$($config.VM_PUBLIC_IP)" -ForegroundColor Gray
    Write-Host ""

} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    if ($session) {
        Remove-PSSession -Session $session -ErrorAction SilentlyContinue
    }
    exit 1
} finally {
    if (Test-Path $zipFile) {
        Remove-Item $zipFile -Force
        Write-Host "Cleanup: Temporary zip file removed" -ForegroundColor Gray
    }
}
