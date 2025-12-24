# HealthCure - Deployment Launcher (Windows)
# Auto-installs Python, netmiko, and runs deployment

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "HealthCure - Automated Deployment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
Write-Host "[1/4] Checking Python..." -ForegroundColor Yellow

\ = \
\ = & where.exe python.exe 2>
if (-not \) {
    \ = & where.exe python 2>
}
if (-not \) {
    \ = & where.exe python3.exe 2>
}

if (-not \) {
    Write-Host "Installing Python..." -ForegroundColor Yellow
    
    \ = "https://www.python.org/ftp/python/3.12.0/python-3.12.0-amd64.exe"
    \ = "\C:\Users\wahyu\AppData\Local\Temp\python-installer.exe"
    
    Write-Host "Downloading Python..." -ForegroundColor Gray
    (New-Object System.Net.ServicePointManager).SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri \ -OutFile \ -ErrorAction Stop
    
    Write-Host "Installing..." -ForegroundColor Gray
    & \ /quiet InstallAllUsers=1 PrependPath=1
    
    Start-Sleep -Seconds 10
    \C:\Program Files\PowerShell\7;C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\wbin;C:\WINDOWS\system32;C:\WINDOWS;C:\WINDOWS\System32\Wbem;C:\WINDOWS\System32\WindowsPowerShell\v1.0\;C:\Program Files\NVIDIA Corporation\NVIDIA App\NvDLISR;C:\Program Files\dotnet\;C:\Program Files (x86)\NVIDIA Corporation\PhysX\Common;C:\Program Files\Tailscale\;C:\Program Files\Go\bin;C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI\;C:\Strawberry\c\bin;C:\Strawberry\perl\site\bin;C:\Strawberry\perl\bin;C:\Program Files\nodejs\;C:\Program Files\RedHat\Podman\;C:\ProgramData\chocolatey\bin;C:\Program Files\Docker\Docker\resources\bin;C:\Program Files\PowerShell\7\;C:\Users\wahyu\AppData\Local\Programs\Python\Python312\Scripts\;C:\Users\wahyu\AppData\Local\Programs\Python\Python312\;C:\Users\wahyu\AppData\Local\Programs\Python\Launcher\;C:\Users\wahyu\tools\openssh\OpenSSH-Win64;C:\Users\wahyu\.cargo\bin;C:\Users\wahyu\AppData\Local\Microsoft\WindowsApps;C:\Users\wahyu\AppData\Local\Programs\Microsoft VS Code\bin;C:\Users\wahyu\go\bin;C:\Users\wahyu\AppData\Local\Programs\MiKTeX\miktex\bin\x64\;C:\Users\wahyu\AppData\Roaming\npm;C:\Users\wahyu\AppData\Local\Pandoc\;C:\Program Files\Git\usr\bin;C:\Users\wahyu\AppData\Local\Programs\Ollama;C:\Users\wahyu\AppData\Local\Microsoft\WinGet\Links;C:\Program Files\PowerShell\7\;C:\Users\wahyu\AppData\Local\Programs\Python\Python312\Scripts\;C:\Users\wahyu\AppData\Local\Programs\Python\Python312\;C:\Users\wahyu\AppData\Local\Programs\Python\Launcher\;C:\Users\wahyu\tools\openssh\OpenSSH-Win64;C:\Users\wahyu\.cargo\bin;C:\Users\wahyu\AppData\Local\Microsoft\WindowsApps;C:\Users\wahyu\AppData\Local\Programs\Microsoft VS Code\bin;C:\Users\wahyu\go\bin;C:\Users\wahyu\AppData\Local\Programs\MiKTeX\miktex\bin\x64\;C:\Users\wahyu\AppData\Roaming\npm;C:\Users\wahyu\AppData\Local\Pandoc\;C:\Program Files\Git\usr\bin;C:\Users\wahyu\AppData\Local\Programs\Ollama;C:\Users\wahyu\AppData\Local\Microsoft\WinGet\Links; = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    \ = & where.exe python.exe 2>
    if (-not \) {
        Write-Host "Error: Python install failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✓ Python: \" -ForegroundColor Green
Write-Host ""

# Install netmiko
Write-Host "[2/4] Installing dependencies..." -ForegroundColor Yellow
& \ -m pip install -q netmiko paramiko --upgrade 2>&1 | Out-Null
Write-Host "✓ Dependencies ready" -ForegroundColor Green
Write-Host ""

# Run deployment
Write-Host "[3/4] Starting deployment..." -ForegroundColor Yellow
Write-Host ""
& \ "\\deploy.py"
Write-Host ""
Write-Host "[4/4] Complete!" -ForegroundColor Green
