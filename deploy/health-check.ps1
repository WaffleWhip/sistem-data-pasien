#!/usr/bin/env pwsh
# Health check script untuk HealthCure services

param(
    [string]$ResourceGroup = "healthcure-rg"
)

Write-Host "================================================" -ForegroundColor Cyan
Write-Host " HealthCure - Health Check" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$services = @("healthcure-mongodb", "healthcure-auth", "healthcure-main", "healthcure-frontend")
$allHealthy = $true

foreach ($service in $services) {
    Write-Host "Checking $service..." -ForegroundColor Yellow
    
    try {
        $status = az containerapp show --name $service --resource-group $ResourceGroup --query 'properties.provisioningState' -o tsv 2>$null
        $replicas = az containerapp show --name $service --resource-group $ResourceGroup --query 'properties.template.scale.maxReplicas' -o tsv 2>$null
        
        if ($status -eq "Succeeded") {
            Write-Host "  ✅ Status: OK" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Status: $status" -ForegroundColor Yellow
            $allHealthy = $false
        }
    } catch {
        Write-Host "  ❌ Error checking status" -ForegroundColor Red
        $allHealthy = $false
    }
}

Write-Host ""
if ($allHealthy) {
    Write-Host "All services appear healthy!" -ForegroundColor Green
} else {
    Write-Host "Some services may have issues. Check logs:" -ForegroundColor Yellow
    Write-Host "  az containerapp logs show --name <service> --resource-group $ResourceGroup --tail 50" -ForegroundColor Gray
}

Write-Host ""
Write-Host "For login issues, check auth-service logs:" -ForegroundColor Cyan
Write-Host "  az containerapp logs show --name healthcure-auth --resource-group $ResourceGroup --tail 100" -ForegroundColor Gray
