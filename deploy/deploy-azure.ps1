# HealthCure - Azure Container Apps Deployment (Windows PowerShell)
# Build lokal lalu push ke Azure Container Registry
# With dependency checking and installation prompts

param(
    [string]$ResourceGroup = "healthcure-rg",
    [string]$Location = "eastasia",
    [string]$AcrName = "healthcureacr$(Get-Random -Minimum 10000 -Maximum 99999)"
)

$ErrorActionPreference = "Stop"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host " HealthCure - Azure Container Apps Deployment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if command exists
function Test-CommandExists {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Function to download file
function Download-File {
    param(
        [string]$Url,
        [string]$OutFile
    )
    
    Write-Host "  Downloading $([System.IO.Path]::GetFileName($OutFile))..." -ForegroundColor Cyan
    
    try {
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $Url -OutFile $OutFile -UseBasicParsing
        Write-Host "  ✓ Downloaded to: $OutFile" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "  ✗ Failed to download: $_" -ForegroundColor Red
        return $false
    }
}

# Function to get latest Docker Desktop URL
function Get-LatestDockerUrl {
    Write-Host "  Fetching latest Docker Desktop version..." -ForegroundColor Cyan
    try {
        # Get latest release info from Docker Hub
        $Response = Invoke-WebRequest -Uri "https://docs.docker.com/desktop/release-notes/" -UseBasicParsing -ErrorAction SilentlyContinue
        Write-Host "  ✓ Latest Docker: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe" -ForegroundColor Green
        return "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
    } catch {
        return "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
    }
}

# Function to get latest Azure CLI URL
function Get-LatestAzureCliUrl {
    Write-Host "  Fetching latest Azure CLI version..." -ForegroundColor Cyan
    try {
        $Releases = Invoke-RestMethod -Uri "https://api.github.com/repos/Azure/azure-cli/releases/latest" -UseBasicParsing -ErrorAction SilentlyContinue
        $LatestVersion = $Releases.tag_name
        $DownloadUrl = "https://aka.ms/installazurecliwindows"
        Write-Host "  ✓ Latest Azure CLI: $LatestVersion" -ForegroundColor Green
        return $DownloadUrl
    } catch {
        return "https://aka.ms/installazurecliwindows"
    }
}

# Function to check dependencies
function Check-Dependencies {
    Write-Host "[0/8] Checking dependencies..." -ForegroundColor Yellow
    Write-Host ""
    
    $MissingTools = @()
    
    # Check Docker
    if (Test-CommandExists docker) {
        Write-Host "✓ Docker found" -ForegroundColor Green
        $DockerVersion = docker --version
        Write-Host "  $DockerVersion" -ForegroundColor Gray
    } else {
        Write-Host "✗ Docker NOT found" -ForegroundColor Red
        $MissingTools += "Docker"
    }
    
    # Check Azure CLI
    if (Test-CommandExists az) {
        Write-Host "✓ Azure CLI found" -ForegroundColor Green
        $AzVersion = az --version | Select-Object -First 1
        Write-Host "  $AzVersion" -ForegroundColor Gray
    } else {
        Write-Host "✗ Azure CLI NOT found" -ForegroundColor Red
        $MissingTools += "Azure CLI"
    }
    
    Write-Host ""
    
    if ($MissingTools.Count -gt 0) {
        Write-Host "Missing tools: $($MissingTools -join ', ')" -ForegroundColor Yellow
        Write-Host ""
        
        $Download = Read-Host "Download missing tools now? (y/n)"
        
        if ($Download -eq 'y' -or $Download -eq 'Y') {
            Write-Host ""
            Write-Host "Downloading tools to Downloads folder..." -ForegroundColor Yellow
            Write-Host ""
            
            $DownloadPath = "$env:USERPROFILE\Downloads"
            
            if ("Docker" -in $MissingTools) {
                $DockerUrl = Get-LatestDockerUrl
                $DockerFile = "$DownloadPath\Docker-Desktop-Installer.exe"
                if (Download-File -Url $DockerUrl -OutFile $DockerFile) {
                    Write-Host "  👉 Double-click to install: $DockerFile" -ForegroundColor Cyan
                }
            }
            
            if ("Azure CLI" -in $MissingTools) {
                $AzUrl = Get-LatestAzureCliUrl
                $AzFile = "$DownloadPath\azure-cli-installer.msi"
                if (Download-File -Url $AzUrl -OutFile $AzFile) {
                    Write-Host "  👉 Double-click to install: $AzFile" -ForegroundColor Cyan
                }
            }
            
            Write-Host ""
            Write-Host "After installation, restart PowerShell and run this script again." -ForegroundColor Yellow
            exit 0
        } else {
            Write-Host "Cannot continue without required tools." -ForegroundColor Red
            Write-Host ""
            Write-Host "Download links:" -ForegroundColor Yellow
            Write-Host "  • Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Cyan
            Write-Host "  • Azure CLI:      https://aka.ms/installazurecliwindows" -ForegroundColor Cyan
            exit 1
        }
    }
    
    Write-Host "All dependencies OK! ✓" -ForegroundColor Green
    Write-Host ""
}

# Run dependency check
Check-Dependencies

Write-Host "Resource Group : $ResourceGroup"
Write-Host "Location       : $Location"
Write-Host "ACR Name       : $AcrName"
Write-Host ""

# Step 1: Login ke Azure
Write-Host "[1/8] Login ke Azure..." -ForegroundColor Yellow
az login

# Step 2: Register required providers
Write-Host "[2/8] Registering Azure providers..." -ForegroundColor Yellow
az provider register --namespace Microsoft.ContainerRegistry --wait
az provider register --namespace Microsoft.App --wait
az provider register --namespace Microsoft.OperationalInsights --wait
az provider register --namespace Microsoft.KubernetesConfiguration --wait

# Step 3: Create Resource Group
Write-Host "[3/8] Creating Resource Group..." -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location

# Step 4: Create Azure Container Registry
Write-Host "[4/8] Creating Azure Container Registry..." -ForegroundColor Yellow
az acr create --resource-group $ResourceGroup --name $AcrName --sku Basic --location $Location --admin-enabled true

$AcrServer = "$AcrName.azurecr.io"
Write-Host "ACR Server: $AcrServer" -ForegroundColor Green

# Step 5: Login ke ACR
Write-Host "[5/8] Login ke ACR..." -ForegroundColor Yellow
az acr login --name $AcrName

# Step 6: Build dan Push Docker Images
Write-Host "[6/8] Building dan pushing Docker images..." -ForegroundColor Yellow

Write-Host "Building auth-service..." -ForegroundColor Cyan
docker build -t "${AcrServer}/healthcure-auth-service:latest" ./auth-service
docker push "${AcrServer}/healthcure-auth-service:latest"

Write-Host "Building main-service..." -ForegroundColor Cyan
docker build -t "${AcrServer}/healthcure-main-service:latest" ./main-service
docker push "${AcrServer}/healthcure-main-service:latest"

Write-Host "Building frontend..." -ForegroundColor Cyan
docker build -t "${AcrServer}/healthcure-frontend:latest" ./frontend
docker push "${AcrServer}/healthcure-frontend:latest"

# Step 7: Create Container Apps Environment
Write-Host "[7/8] Creating Container Apps Environment..." -ForegroundColor Yellow

# Create a temp Log Analytics workspace for Container Apps
$LogWorkspaceName = "healthcure-logs-$(Get-Random -Minimum 1000 -Maximum 9999)"
Write-Host "Creating Log Analytics workspace: $LogWorkspaceName..." -ForegroundColor Cyan
az monitor log-analytics workspace create `
    --resource-group $ResourceGroup `
    --workspace-name $LogWorkspaceName `
    -o none

$WorkspaceId = az monitor log-analytics workspace show `
    --resource-group $ResourceGroup `
    --workspace-name $LogWorkspaceName `
    --query customerId -o tsv

$WorkspaceKey = az monitor log-analytics workspace get-shared-keys `
    --resource-group $ResourceGroup `
    --workspace-name $LogWorkspaceName `
    --query primarySharedKey -o tsv

az containerapp env create `
    --name healthcure-env `
    --resource-group $ResourceGroup `
    --location $Location `
    --logs-workspace-id $WorkspaceId `
    --logs-workspace-key $WorkspaceKey

# Get ACR credentials
$AcrUsername = az acr credential show --name $AcrName --query username -o tsv
$AcrPassword = az acr credential show --name $AcrName --query 'passwords[0].value' -o tsv

# Step 8: Deploy Container Apps
Write-Host "[8/8] Deploying Container Apps..." -ForegroundColor Yellow

# Helper function to create or update container app
function Deploy-ContainerApp {
    param(
        [string]$Name,
        [string]$Image,
        [string]$TargetPort,
        [string]$Ingress,
        [hashtable]$EnvVars,
        [int]$WaitSeconds = 0
    )
    
    Write-Host "Deploying $Name..." -ForegroundColor Cyan
    
    # Build env-vars parameter
    $EnvVarsArray = @()
    foreach ($key in $EnvVars.Keys) {
        $EnvVarsArray += "$key=$($EnvVars[$key])"
    }
    
    # Try to update first, if not exists then create
    $UpdateCmd = @(
        "az", "containerapp", "update",
        "--name", $Name,
        "--resource-group", $ResourceGroup,
        "--image", $Image
    )
    
    if ($EnvVarsArray.Count -gt 0) {
        $UpdateCmd += "--env-vars"
        $UpdateCmd += $EnvVarsArray
    }
    
    $UpdateResult = & $UpdateCmd 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        # Create new if update failed
        $CreateCmd = @(
            "az", "containerapp", "create",
            "--name", $Name,
            "--resource-group", $ResourceGroup,
            "--environment", "healthcure-env",
            "--image", $Image,
            "--target-port", $TargetPort,
            "--ingress", $Ingress,
            "--cpu", "0.25",
            "--memory", "0.5Gi"
        )
        
        if ($Name -eq "healthcure-mongodb") {
            $CreateCmd[-6] = "0.5"
            $CreateCmd[-4] = "1.0Gi"
        }
        
        if ($AcrServer -and $Image -notmatch "mongo") {
            $CreateCmd += "--registry-server"
            $CreateCmd += $AcrServer
            $CreateCmd += "--registry-username"
            $CreateCmd += $AcrUsername
            $CreateCmd += "--registry-password"
            $CreateCmd += $AcrPassword
        }
        
        if ($EnvVarsArray.Count -gt 0) {
            $CreateCmd += "--env-vars"
            $CreateCmd += $EnvVarsArray
        }
        
        & $CreateCmd | Out-Null
    }
    
    if ($WaitSeconds -gt 0) {
        Write-Host "  Waiting ${WaitSeconds}s for $Name to be ready..." -ForegroundColor Gray
        Start-Sleep -Seconds $WaitSeconds
    }
}

# Deploy MongoDB (wait longest - needs time to initialize)
Write-Host ""
Write-Host "Phase 1: Deploy MongoDB (with init wait)..." -ForegroundColor Magenta
Deploy-ContainerApp `
    -Name "healthcure-mongodb" `
    -Image "mongo:4.4" `
    -TargetPort "27017" `
    -Ingress "internal" `
    -EnvVars @{} `
    -WaitSeconds 60

# Deploy Auth Service (depends on MongoDB)
Write-Host ""
Write-Host "Phase 2: Deploy Auth Service..." -ForegroundColor Magenta
Deploy-ContainerApp `
    -Name "healthcure-auth" `
    -Image "${AcrServer}/healthcure-auth-service:latest" `
    -TargetPort "3001" `
    -Ingress "internal" `
    -EnvVars @{
        "MONGODB_URI" = "mongodb://healthcure-mongodb:27017/auth_db"
        "NODE_ENV" = "production"
        "JWT_SECRET" = "healthcure-jwt-$(Get-Random -Minimum 10000 -Maximum 99999)"
    } `
    -WaitSeconds 20

# Deploy Main Service (depends on MongoDB)
Write-Host ""
Write-Host "Phase 3: Deploy Main Service..." -ForegroundColor Magenta
Deploy-ContainerApp `
    -Name "healthcure-main" `
    -Image "${AcrServer}/healthcure-main-service:latest" `
    -TargetPort "3002" `
    -Ingress "internal" `
    -EnvVars @{
        "MONGODB_URI" = "mongodb://healthcure-mongodb:27017/main_db"
        "NODE_ENV" = "production"
        "JWT_SECRET" = "healthcure-jwt-$(Get-Random -Minimum 10000 -Maximum 99999)"
    } `
    -WaitSeconds 20

# Deploy Frontend (depends on Auth & Main)
Write-Host ""
Write-Host "Phase 4: Deploy Frontend..." -ForegroundColor Magenta
Deploy-ContainerApp `
    -Name "healthcure-frontend" `
    -Image "${AcrServer}/healthcure-frontend:latest" `
    -TargetPort "3000" `
    -Ingress "external" `
    -EnvVars @{
        "AUTH_SERVICE_URL" = "http://healthcure-auth:3001"
        "MAIN_SERVICE_URL" = "http://healthcure-main:3002"
        "NODE_ENV" = "production"
    } `
    -WaitSeconds 15

# Get Frontend URL
Start-Sleep -Seconds 10
$FrontendUrl = az containerapp show --name healthcure-frontend --resource-group $ResourceGroup --query 'properties.configuration.ingress.fqdn' -o tsv

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host " DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend URL: https://$FrontendUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Admin Credentials:"
Write-Host "  Email    : admin@healthcure.com"
Write-Host "  Password : admin123"
Write-Host ""
Write-Host "Useful Commands:"
Write-Host "  View logs    : az containerapp logs show --name healthcure-frontend --resource-group $ResourceGroup"
Write-Host "  Delete all   : az group delete --name $ResourceGroup --yes"
Write-Host ""
