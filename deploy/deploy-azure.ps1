# HealthCure - Azure Container Apps Deployment Script
# Build lokal, push ke ACR, deploy ke Container Apps

param(
    [string]$ResourceGroup = "healthcure-rg",
    [string]$Location = "eastasia",
    [string]$AcrName = ""
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  HealthCure - Azure Container Apps Deployment" -ForegroundColor Cyan
Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Auto-generate ACR name jika tidak disediakan
if ([string]::IsNullOrEmpty($AcrName)) {
    $AcrName = "healthcureacr$(Get-Random -Minimum 10000 -Maximum 99999)"
    Write-Host "ACR name: $AcrName (auto-generated)" -ForegroundColor Yellow
}

# ============================================================
# STEP 0: Check Prerequisites
# ============================================================
Write-Host "[0/6] Checking prerequisites..." -ForegroundColor Yellow

# Check Docker
$dockerVersion = docker --version 2>$null
if (-not $dockerVersion) {
    Write-Host "❌ ERROR: Docker is not installed or not running" -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ Docker: $dockerVersion" -ForegroundColor Green

# Check Azure CLI
$azVersion = az --version 2>$null | Select-Object -First 1
if (-not $azVersion) {
    Write-Host "❌ ERROR: Azure CLI is not installed" -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ Azure CLI: OK" -ForegroundColor Green

# Check containerapp command
try {
    $null = az containerapp --help 2>&1
    Write-Host "  ✅ ContainerApp Command: OK" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: 'az containerapp' command not found" -ForegroundColor Red
    Write-Host "   Tip: Update Azure CLI: az upgrade" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# ============================================================
# STEP 1: Azure Login & Provider Registration
# ============================================================
Write-Host "[1/6] Azure Login & Provider Registration..." -ForegroundColor Yellow

$account = az account show 2>$null
if (-not $account) {
    Write-Host "  Opening browser for Azure login..." -ForegroundColor Cyan
    az login --output none
}
Write-Host "  ✅ Logged in to Azure" -ForegroundColor Green

Write-Host "  Registering required providers..." -ForegroundColor Cyan
az provider register --namespace Microsoft.ContainerRegistry --wait --output none
az provider register --namespace Microsoft.App --wait --output none
az provider register --namespace Microsoft.OperationalInsights --wait --output none
Write-Host "  ✅ Providers registered" -ForegroundColor Green
Write-Host ""

# ============================================================
# STEP 2: Create Resources (Resource Group & ACR)
# ============================================================
Write-Host "[2/6] Creating Resources (Resource Group & ACR)..." -ForegroundColor Yellow

# Wait if RG is being deleted
$rgState = az group show --name $ResourceGroup --query "properties.provisioningState" -o tsv 2>$null
if ($rgState -eq "Deleting") {
    Write-Host "  Waiting for resource group to finish deletion..." -ForegroundColor Yellow
    while ($rgState -eq "Deleting") {
        Start-Sleep -Seconds 5
        Write-Host -NoNewline "."
        $rgState = az group show --name $ResourceGroup --query "properties.provisioningState" -o tsv 2>$null
    }
    Write-Host " ✅" -ForegroundColor Green
}

# Create resource group
Write-Host "  Creating Resource Group: $ResourceGroup" -ForegroundColor Cyan
az group create --name $ResourceGroup --location $Location --output none
Write-Host "  ✅ Resource Group created" -ForegroundColor Green

# Create ACR
Write-Host "  Creating Container Registry: $AcrName" -ForegroundColor Cyan
az acr create --resource-group $ResourceGroup --name $AcrName --sku Basic --location $Location --admin-enabled true --output none 2>$null
Write-Host "  ✅ ACR created" -ForegroundColor Green

$AcrServer = "$AcrName.azurecr.io"
Write-Host "  ACR Server: $AcrServer" -ForegroundColor Cyan

# Login to ACR
Write-Host "  Logging in to ACR..." -ForegroundColor Cyan
az acr login --name $AcrName --output none
Write-Host "  ✅ Logged in to ACR" -ForegroundColor Green
Write-Host ""

# ============================================================
# STEP 3: Build & Push Docker Images
# ============================================================
Write-Host "[3/6] Building & Pushing Docker Images..." -ForegroundColor Yellow

$services = @(
    @{Name = "auth-service"; Image = "healthcure-auth-service"},
    @{Name = "main-service"; Image = "healthcure-main-service"},
    @{Name = "frontend"; Image = "healthcure-frontend"}
)

foreach ($service in $services) {
    $svcName = $service.Name
    $imgName = $service.Image
    $fullImage = "${AcrServer}/${imgName}:latest"
    
    # Verify folder exists
    if (-not (Test-Path "./$svcName")) {
        Write-Host "❌ ERROR: Folder '$svcName' not found!" -ForegroundColor Red
        exit 1
    }

    Write-Host "  Building $svcName..." -ForegroundColor Cyan
    docker build -t $fullImage "./$svcName" --quiet
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERROR: Build failed for $svcName" -ForegroundColor Red
        exit 1
    }
    Write-Host "    ✅ Build successful" -ForegroundColor Green
    
    Write-Host "  Pushing $svcName to ACR..." -ForegroundColor Cyan
    docker push $fullImage --quiet
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERROR: Push failed for $svcName" -ForegroundColor Red
        exit 1
    }
    Write-Host "    ✅ Push successful" -ForegroundColor Green
}
Write-Host "  ✅ All images built and pushed!" -ForegroundColor Green
Write-Host ""

# ============================================================
# STEP 4: Create Container Apps Environment
# ============================================================
Write-Host "[4/6] Creating Container Apps Environment..." -ForegroundColor Yellow
Write-Host "  Creating environment: healthcure-env" -ForegroundColor Cyan
az containerapp env create --name healthcure-env --resource-group $ResourceGroup --location $Location --output none 2>$null
Write-Host "  ✅ Environment created" -ForegroundColor Green
Write-Host ""

# ============================================================
# STEP 5: Deploy Services
# ============================================================
Write-Host "[5/6] Deploying Services..." -ForegroundColor Yellow

# Get ACR credentials
$AcrUsername = az acr credential show --name $AcrName --query username -o tsv
$AcrPassword = az acr credential show --name $AcrName --query 'passwords[0].value' -o tsv
$JwtSecret = "healthcure-jwt-$(Get-Random -Minimum 100000 -Maximum 999999)"

# Deploy MongoDB
Write-Host "  Deploying MongoDB..." -ForegroundColor Cyan
az containerapp create `
  --name healthcure-mongodb `
  --resource-group $ResourceGroup `
  --environment healthcure-env `
  --image mongo:5.0 `
  --ingress internal `
  --target-port 27017 `
  --min-replicas 1 --max-replicas 1 `
  --output none 2>$null
Write-Host "    ✅ MongoDB deployed" -ForegroundColor Green
Write-Host "    ⏳ Waiting for MongoDB to start (15 seconds)..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# Deploy Auth Service
Write-Host "  Deploying Auth Service..." -ForegroundColor Cyan
az containerapp create `
  --name healthcure-auth `
  --resource-group $ResourceGroup `
  --environment healthcure-env `
  --image "${AcrServer}/healthcure-auth-service:latest" `
  --registry-server $AcrServer `
  --registry-username $AcrUsername `
  --registry-password $AcrPassword `
  --ingress internal `
  --target-port 3001 `
  --min-replicas 1 --max-replicas 3 `
  --env-vars "MONGODB_URI=mongodb://healthcure-mongodb.internal.healthcure-env:27017/auth_db" "NODE_ENV=production" "JWT_SECRET=$JwtSecret" `
  --output none 2>$null
Write-Host "    ✅ Auth Service deployed" -ForegroundColor Green

# Deploy Main Service
Write-Host "  Deploying Main Service..." -ForegroundColor Cyan
az containerapp create `
  --name healthcure-main `
  --resource-group $ResourceGroup `
  --environment healthcure-env `
  --image "${AcrServer}/healthcure-main-service:latest" `
  --registry-server $AcrServer `
  --registry-username $AcrUsername `
  --registry-password $AcrPassword `
  --ingress internal `
  --target-port 3002 `
  --min-replicas 1 --max-replicas 3 `
  --env-vars "MONGODB_URI=mongodb://healthcure-mongodb.internal.healthcure-env:27017/main_db" "NODE_ENV=production" "JWT_SECRET=$JwtSecret" `
  --output none 2>$null
Write-Host "    ✅ Main Service deployed" -ForegroundColor Green

# Deploy Frontend
Write-Host "  Deploying Frontend..." -ForegroundColor Cyan
az containerapp create `
  --name healthcure-frontend `
  --resource-group $ResourceGroup `
  --environment healthcure-env `
  --image "${AcrServer}/healthcure-frontend:latest" `
  --registry-server $AcrServer `
  --registry-username $AcrUsername `
  --registry-password $AcrPassword `
  --ingress external `
  --target-port 3000 `
  --min-replicas 1 --max-replicas 3 `
  --env-vars "AUTH_SERVICE_URL=http://healthcure-auth:3001" "MAIN_SERVICE_URL=http://healthcure-main:3002" "NODE_ENV=production" `
  --output none 2>$null
Write-Host "    ✅ Frontend deployed" -ForegroundColor Green
Write-Host ""

# ============================================================
# STEP 6: Verification & Information
# ============================================================
Write-Host "[6/6] Verifying Deployment..." -ForegroundColor Yellow
Write-Host "  Getting Frontend URL..." -ForegroundColor Cyan
$FrontendUrl = az containerapp show --name healthcure-frontend --resource-group $ResourceGroup --query properties.configuration.ingress.fqdn -o tsv 2>$null

if ($FrontendUrl) {
    Write-Host "  ✅ Frontend URL ready" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  URL not immediately available (still initializing)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

if ($FrontendUrl) {
    Write-Host "🌐 Access your app:" -ForegroundColor Cyan
    Write-Host "   https://$FrontendUrl" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "📝 Login Credentials:" -ForegroundColor Cyan
Write-Host "   Email: admin@healthcure.com" -ForegroundColor Cyan
Write-Host "   Password: admin123" -ForegroundColor Cyan
Write-Host ""

Write-Host "⏳ Important: Wait 2-3 MINUTES before first login!" -ForegroundColor Yellow
Write-Host "   Services need time to fully initialize and connect to database." -ForegroundColor Gray
Write-Host ""

Write-Host "🔍 Check Service Status:" -ForegroundColor Cyan
Write-Host "   az containerapp list --resource-group $ResourceGroup -o table" -ForegroundColor Gray
Write-Host ""

Write-Host "📊 View Logs:" -ForegroundColor Cyan
Write-Host "   Auth Service:" -ForegroundColor Gray
Write-Host "   az containerapp logs show --name healthcure-auth --resource-group $ResourceGroup --tail 50" -ForegroundColor Gray
Write-Host ""
Write-Host "   Main Service:" -ForegroundColor Gray
Write-Host "   az containerapp logs show --name healthcure-main --resource-group $ResourceGroup --tail 50" -ForegroundColor Gray
Write-Host ""
Write-Host "   Frontend:" -ForegroundColor Gray
Write-Host "   az containerapp logs show --name healthcure-frontend --resource-group $ResourceGroup --tail 50" -ForegroundColor Gray
Write-Host ""

Write-Host "💡 If login times out: Services are still initializing, wait longer or check logs above" -ForegroundColor Yellow
Write-Host ""
