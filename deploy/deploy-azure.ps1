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
az containerapp env create `
    --name healthcure-env `
    --resource-group $ResourceGroup `
    --location $Location

# Get ACR credentials
$AcrUsername = az acr credential show --name $AcrName --query username -o tsv
$AcrPassword = az acr credential show --name $AcrName --query 'passwords[0].value' -o tsv

# Step 8: Deploy Container Apps
Write-Host "[8/8] Deploying Container Apps..." -ForegroundColor Yellow

# Deploy MongoDB
Write-Host "Deploying MongoDB..." -ForegroundColor Cyan
az containerapp create `
    --name healthcure-mongodb `
    --resource-group $ResourceGroup `
    --environment healthcure-env `
    --image mongo:4.4 `
    --target-port 27017 `
    --ingress internal `
    --cpu 0.5 --memory 1.0Gi

Start-Sleep -Seconds 15

# Deploy Auth Service
Write-Host "Deploying Auth Service..." -ForegroundColor Cyan
az containerapp create `
    --name healthcure-auth `
    --resource-group $ResourceGroup `
    --environment healthcure-env `
    --image "${AcrServer}/healthcure-auth-service:latest" `
    --target-port 3001 `
    --ingress internal `
    --registry-server $AcrServer `
    --registry-username $AcrUsername `
    --registry-password $AcrPassword `
    --env-vars "MONGODB_URI=mongodb://healthcure-mongodb:27017/auth_db" "NODE_ENV=production" "JWT_SECRET=healthcure-jwt-secret-$(Get-Random)" `
    --cpu 0.25 --memory 0.5Gi

# Deploy Main Service
Write-Host "Deploying Main Service..." -ForegroundColor Cyan
az containerapp create `
    --name healthcure-main `
    --resource-group $ResourceGroup `
    --environment healthcure-env `
    --image "${AcrServer}/healthcure-main-service:latest" `
    --target-port 3002 `
    --ingress internal `
    --registry-server $AcrServer `
    --registry-username $AcrUsername `
    --registry-password $AcrPassword `
    --env-vars "MONGODB_URI=mongodb://healthcure-mongodb:27017/main_db" "NODE_ENV=production" "JWT_SECRET=healthcure-jwt-secret-$(Get-Random)" `
    --cpu 0.25 --memory 0.5Gi

# Deploy Frontend
Write-Host "Deploying Frontend..." -ForegroundColor Cyan
az containerapp create `
    --name healthcure-frontend `
    --resource-group $ResourceGroup `
    --environment healthcure-env `
    --image "${AcrServer}/healthcure-frontend:latest" `
    --target-port 3000 `
    --ingress external `
    --registry-server $AcrServer `
    --registry-username $AcrUsername `
    --registry-password $AcrPassword `
    --env-vars "AUTH_SERVICE_URL=http://healthcure-auth:3001" "MAIN_SERVICE_URL=http://healthcure-main:3002" "NODE_ENV=production" `
    --cpu 0.25 --memory 0.5Gi

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
