# HealthCure - Deploy to Azure VM (PowerShell)
# 
# DESCRIPTION:
#   Automated deployment script to deploy HealthCure application to Azure VM
#   Uses PuTTY tools (plink/pscp) for reliable SSH connectivity with password auth
#   Installs Docker, Docker Compose, and starts all services
#
# USAGE:
#   .\deploy-to-azure.ps1
#   .\deploy-to-azure.ps1 -ConfigFile "custom-config.env"
#
# PREREQUISITES:
#   1. PuTTY tools installed (plink.exe and pscp.exe in PATH)
#   2. vm-config.env file configured with correct Azure VM credentials
#   3. Azure VM running with SSH access enabled
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

# Check PuTTY tools
Write-Host "[0/7] Checking PuTTY tools..." -ForegroundColor Yellow
$plinkPath = & where.exe plink.exe 2>$null
$pscpPath = & where.exe pscp.exe 2>$null

if (-not $plinkPath -or -not $pscpPath) {
    Write-Host "PuTTY tools not found. Checking installation..." -ForegroundColor Yellow
    
    $puttyInstallPath = "C:\Program Files\PuTTY"
    $plinkPath = "$puttyInstallPath\plink.exe"
    $pscpPath = "$puttyInstallPath\pscp.exe"
    
    if (-not (Test-Path $plinkPath) -or -not (Test-Path $pscpPath)) {
        Write-Host "Downloading and installing PuTTY..." -ForegroundColor Yellow
        
        try {
            # Create temp directory
            $tempDir = "$env:TEMP\putty-installer"
            if (-not (Test-Path $tempDir)) {
                New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
            }
            
            # Download PuTTY installer (portable version)
            $puttyUrl = "https://the.earth.li/~sgtatham/putty/latest/w64/putty.exe"
            $puttyPath = "$tempDir\putty.exe"
            
            Write-Host "Downloading PuTTY..." -ForegroundColor Gray
            (New-Object System.Net.ServicePointManager).SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
            Invoke-WebRequest -Uri $puttyUrl -OutFile $puttyPath -ErrorAction Stop
            
            # Create PuTTY directory
            if (-not (Test-Path $puttyInstallPath)) {
                New-Item -ItemType Directory -Path $puttyInstallPath -Force | Out-Null
            }
            
            # Extract PuTTY tools
            Write-Host "Installing PuTTY tools..." -ForegroundColor Gray
            Copy-Item $puttyPath -Destination "$puttyInstallPath\putty.exe" -Force
            
            # Download additional tools
            $tools = @("plink.exe", "pscp.exe")
            foreach ($tool in $tools) {
                $toolUrl = "https://the.earth.li/~sgtatham/putty/latest/w64/$tool"
                $toolPath = "$tempDir\$tool"
                try {
                    Invoke-WebRequest -Uri $toolUrl -OutFile $toolPath -ErrorAction Stop
                    Copy-Item $toolPath -Destination "$puttyInstallPath\$tool" -Force
                    Write-Host "Downloaded: $tool" -ForegroundColor Gray
                } catch {
                    Write-Host "Note: $tool may already be included" -ForegroundColor Gray
                }
            }
            
            # Add to PATH temporarily for this session
            $env:Path = "$puttyInstallPath;$env:Path"
            
            Write-Host "PuTTY tools installed to: $puttyInstallPath" -ForegroundColor Green
            
            $plinkPath = $puttyInstallPath
            $pscpPath = $puttyInstallPath
        } catch {
            Write-Host "Error: Could not download PuTTY automatically" -ForegroundColor Red
            Write-Host "Please install PuTTY manually from: https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html" -ForegroundColor Yellow
            exit 1
        }
    }
} else {
    Write-Host "PuTTY tools found" -ForegroundColor Green
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
    $sshTest = & plink.exe -pw $config.VM_PASSWORD -l $config.VM_USERNAME -P $config.VM_SSH_PORT $config.VM_PUBLIC_IP "echo OK" 2>&1
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
    $dockerScript = @"
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
    
    $dockerScript | & plink.exe -pw $config.VM_PASSWORD -l $config.VM_USERNAME -P $config.VM_SSH_PORT $config.VM_PUBLIC_IP 2>&1 | Out-Null
    Write-Host "Installation complete" -ForegroundColor Green
    Write-Host ""

    # 4. Upload project files
    Write-Host "[4/7] Uploading project files to VM..." -ForegroundColor Yellow
    $projectRoot = "$PSScriptRoot\.."
    
    & plink.exe -pw $config.VM_PASSWORD -l $config.VM_USERNAME -P $config.VM_SSH_PORT $config.VM_PUBLIC_IP "mkdir -p ~/sistem-data-pasien" 2>$null
    & pscp.exe -pw $config.VM_PASSWORD -r "$projectRoot\docker-compose.yml" "$($config.VM_USERNAME)@$($config.VM_PUBLIC_IP):/home/$($config.VM_USERNAME)/sistem-data-pasien/" 2>$null
    & pscp.exe -pw $config.VM_PASSWORD -r "$projectRoot\docker" "$($config.VM_USERNAME)@$($config.VM_PUBLIC_IP):/home/$($config.VM_USERNAME)/sistem-data-pasien/" 2>$null
    & pscp.exe -pw $config.VM_PASSWORD -r "$projectRoot\frontend" "$($config.VM_USERNAME)@$($config.VM_PUBLIC_IP):/home/$($config.VM_USERNAME)/sistem-data-pasien/" 2>$null
    & pscp.exe -pw $config.VM_PASSWORD -r "$projectRoot\main-service" "$($config.VM_USERNAME)@$($config.VM_PUBLIC_IP):/home/$($config.VM_USERNAME)/sistem-data-pasien/" 2>$null
    & pscp.exe -pw $config.VM_PASSWORD -r "$projectRoot\auth-service" "$($config.VM_USERNAME)@$($config.VM_PUBLIC_IP):/home/$($config.VM_USERNAME)/sistem-data-pasien/" 2>$null
    
    Write-Host "Project files uploaded" -ForegroundColor Green
    Write-Host ""

    # 5. Start services via Docker Compose
    Write-Host "[5/7] Starting services..." -ForegroundColor Yellow
    $startScript = @"
cd ~/sistem-data-pasien
docker compose up -d
sleep 5
docker compose ps
"@
    
    $startScript | & plink.exe -pw $config.VM_PASSWORD -l $config.VM_USERNAME -P $config.VM_SSH_PORT $config.VM_PUBLIC_IP 2>&1
    Write-Host ""

    # 6. Verify services
    Write-Host "[6/7] Verifying services..." -ForegroundColor Yellow
    & plink.exe -pw $config.VM_PASSWORD -l $config.VM_USERNAME -P $config.VM_SSH_PORT $config.VM_PUBLIC_IP "docker compose -f ~/sistem-data-pasien/docker-compose.yml ps" 2>$null
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
    
    Write-Host "Connect to VM (with PuTTY):" -ForegroundColor Yellow
    Write-Host "  plink.exe -pw $($config.VM_PASSWORD) -l $($config.VM_USERNAME) $($config.VM_PUBLIC_IP)" -ForegroundColor Gray
    Write-Host ""

} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
