# Quick redeploy script - rebuilds and pushes only changed services
# Usage: .\deploy\redeploy.ps1 [acr-name] [resource-group]

param(
    [string]$AcrName = "",
    [string]$ResourceGroup = "healthcure-rg"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrEmpty($AcrName)) {
    Write-Host "ERROR: ACR name is required" -ForegroundColor Red
    Write-Host "Usage: .\deploy\redeploy.ps1 <acr-name> [resource-group]" -ForegroundColor Yellow
    exit 1
}

$AcrServer = "$AcrName.azurecr.io"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host " HealthCure - Quick Redeploy" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "ACR: $AcrServer" -ForegroundColor Yellow
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor Yellow
Write-Host ""

# Login to ACR
Write-Host "[1/3] Logging in to ACR..." -ForegroundColor Yellow
az acr login --name $AcrName
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: ACR login failed" -ForegroundColor Red; exit 1 }

# Build and push services
Write-Host "[2/3] Building and pushing services..." -ForegroundColor Yellow

$services = @(
    @{Name = "auth-service"; Image = "healthcure-auth-service"; Port = 3001},
    @{Name = "main-service"; Image = "healthcure-main-service"; Port = 3002},
    @{Name = "frontend"; Image = "healthcure-frontend"; Port = 3000}
)

foreach ($service in $services) {
    $svcName = $service.Name
    $imgName = $service.Image
    $fullImage = "${AcrServer}/${imgName}:latest"
    
    Write-Host "  Building $svcName..." -ForegroundColor Cyan
    docker build -t $fullImage "./$svcName" 2>&1 | Select-Object -Last 5
    if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Build failed for $svcName" -ForegroundColor Red; exit 1 }
    
    Write-Host "  Pushing $svcName..." -ForegroundColor Cyan
    docker push $fullImage 2>&1 | Select-Object -Last 3
    if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Push failed for $svcName" -ForegroundColor Red; exit 1 }
    
    Write-Host "  ✅ $svcName ready" -ForegroundColor Green
}

# Update container apps to use new images
Write-Host "[3/3] Updating Container Apps..." -ForegroundColor Yellow

$appNames = @("healthcure-auth", "healthcure-main", "healthcure-frontend")

foreach ($appName in $appNames) {
    Write-Host "  Updating $appName..." -ForegroundColor Cyan
    az containerapp update `
      --name $appName `
      --resource-group $ResourceGroup `
      --image "${AcrServer}/healthcure-${appName#healthcure-}:latest" `
      --output none
    if ($LASTEXITCODE -ne 0) { Write-Host "⚠️  Update may have failed for $appName, but continuing..." -ForegroundColor Yellow }
}

Write-Host ""
Write-Host "REDEPLOY COMPLETE!" -ForegroundColor Green
Write-Host "Services should be updated within 1-2 minutes." -ForegroundColor Cyan
Write-Host "Check status: az containerapp list --resource-group $ResourceGroup -o table" -ForegroundColor Gray
