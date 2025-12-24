# HealthCure - Deployment Launcher (Windows)
#
# Automatically handles everything - just run this!
# 
# Usage: .\deploy.ps1

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "HealthCure - Automated Deployment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check config
$ConfigFile = "$PSScriptRoot\vm-config.env"
if (-not (Test-Path $ConfigFile)) {
    Write-Host "Error: vm-config.env not found" -ForegroundColor Red
    exit 1
}

Write-Host "Configuration loaded" -ForegroundColor Green
Write-Host ""

# Check if bash is available (WSL, Git Bash, etc)
Write-Host "Checking deployment environment..." -ForegroundColor Yellow

$bashPath = $null
$bashPath = & where.exe bash.exe 2>$null
if (-not $bashPath) {
    $bashPath = & where.exe bash 2>$null
}

if (-not $bashPath) {
    Write-Host ""
    Write-Host "Bash not found. Installing WSL Ubuntu..." -ForegroundColor Yellow
    Write-Host "This will download and install Windows Subsystem for Linux" -ForegroundColor Gray
    Write-Host ""
    
    try {
        # Enable WSL feature
        Write-Host "Enabling WSL feature..." -ForegroundColor Gray
        wsl --install -d Ubuntu --no-launch 2>&1 | Out-Null
        
        # Wait for installation
        Start-Sleep -Seconds 10
        
        Write-Host "WSL installed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Please restart your computer, then run this script again." -ForegroundColor Cyan
        exit 0
    } catch {
        Write-Host "Error: Could not install WSL" -ForegroundColor Red
        Write-Host "Please install manually: https://docs.microsoft.com/en-us/windows/wsl/install" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "Bash found: $bashPath" -ForegroundColor Green
Write-Host ""

Write-Host "Launching deployment script..." -ForegroundColor Cyan
Write-Host ""

# Use Git Bash or WSL - they handle paths better
$scriptPath = Join-Path $PSScriptRoot "deploy.sh"

# Try to run with Git Bash first (most reliable)
$gitBash = "C:\Program Files\Git\bin\bash.exe"
if (Test-Path $gitBash) {
    & $gitBash -c "cd '$PSScriptRoot' && bash deploy.sh"
} else {
    # Fallback to system bash
    & bash -c "cd '$PSScriptRoot' && bash deploy.sh"
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "Deployment completed successfully!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Deployment completed with errors" -ForegroundColor Yellow
    exit 1
}
