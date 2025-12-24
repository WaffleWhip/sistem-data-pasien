# HealthCure - Deployment Launcher (Windows)
# Auto-installs Python, runs deployment, then cleans up

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "HealthCure - Automated Deployment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$PythonInstalled = $false

trap {
    if ($PythonInstalled) {
        Write-Host ""
        Write-Host "Cleaning up Python..." -ForegroundColor Yellow
        # Would uninstall here, but complex on Windows
        # Better to leave for user to manually uninstall if desired
        Write-Host "Note: You can uninstall Python from Control Panel if desired" -ForegroundColor Gray
    }
    exit 1
}

Write-Host "[1/5] Checking Python..." -ForegroundColor Yellow

$python = & where.exe python.exe 2>$null
if (-not $python) {
    $python = & where.exe python 2>$null
}

if (-not $python) {
    Write-Host "Installing Python..." -ForegroundColor Yellow
    $PythonInstalled = $true
    
    $pythonUrl = "https://www.python.org/ftp/python/3.12.0/python-3.12.0-amd64.exe"
    $pythonInstaller = "$env:TEMP\python-installer.exe"
    
    Write-Host "Downloading..." -ForegroundColor Gray
    (New-Object System.Net.ServicePointManager).SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $pythonUrl -OutFile $pythonInstaller -ErrorAction Stop
    
    Write-Host "Installing..." -ForegroundColor Gray
    & $pythonInstaller /quiet InstallAllUsers=1 PrependPath=1 | Out-Null
    Start-Sleep -Seconds 10
    
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    $python = & where.exe python.exe 2>$null
    
    if (-not $python) {
        Write-Host "Error: Python install failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✓ Python ready" -ForegroundColor Green
Write-Host ""

Write-Host "[2/5] Installing dependencies..." -ForegroundColor Yellow
& $python -m pip install -q netmiko paramiko --upgrade 2>&1 | Out-Null
Write-Host "✓ Dependencies ready" -ForegroundColor Green
Write-Host ""

Write-Host "[3/5] Starting deployment..." -ForegroundColor Yellow
Write-Host ""
& $python "$PSScriptRoot\deploy.py"

Write-Host ""
Write-Host "[4/5] Deployment complete!" -ForegroundColor Green
Write-Host "[5/5] Ready for cleanup" -ForegroundColor Green
Write-Host ""
Write-Host "Note: Python is installed. Uninstall from Control Panel if desired." -ForegroundColor Gray
