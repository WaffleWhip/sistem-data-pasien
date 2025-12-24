# HealthCure - VM Setup Script (Final Version - PowerShell)
# Run on Windows VM after uploading files

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "HealthCure - VM Setup Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

try {
    # 1. Check if Docker is installed
    Write-Host "[1/4] Checking Docker installation..." -ForegroundColor Yellow
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if (-not $docker) {
        Write-Host "Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Docker found" -ForegroundColor Green

    # 2. Check if Docker Compose is available
    Write-Host "[2/4] Checking Docker Compose..." -ForegroundColor Yellow
    $dockerCompose = & docker compose version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Docker Compose is not available. Please ensure Docker Desktop is properly installed." -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Docker Compose found" -ForegroundColor Green

    # 3. Navigate to project directory
    Write-Host "[3/4] Setting up project directory..." -ForegroundColor Yellow
    $projectPath = $PSScriptRoot
    if (-not (Test-Path "$projectPath\..\docker-compose.yml")) {
        Write-Host "docker-compose.yml not found. Please run this script from the deploy folder." -ForegroundColor Red
        exit 1
    }
    Set-Location "$projectPath\.."
    Write-Host "✓ Project directory ready" -ForegroundColor Green

    # 4. Start services
    Write-Host "[4/4] Starting services with docker-compose..." -ForegroundColor Yellow
    & docker compose up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to start services." -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Services started" -ForegroundColor Green

    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""

    Write-Host "Application is running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Wait 30-60 seconds for services to initialize"
    Write-Host "2. Open browser: http://YOUR_VM_IP:3000"
    Write-Host "3. Login: admin@healthcure.com / admin123"
    Write-Host ""
    Write-Host "Useful commands:" -ForegroundColor Yellow
    Write-Host "  docker compose ps          # Check status"
    Write-Host "  docker compose logs -f     # View logs"
    Write-Host "  docker compose stop        # Stop services"
    Write-Host "  docker compose down        # Stop and remove"
    Write-Host ""

} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
