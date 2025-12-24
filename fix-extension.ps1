# Safe Azure CLI Extension Fix
# Run as Administrator

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Azure CLI ContainerApp Extension Fix" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$extPath = "C:\Users\$env:USERNAME\.azure\cliextensions\containerapp"

Write-Host "Extension path: $extPath" -ForegroundColor Yellow
Write-Host ""

# Step 1: Check if folder exists
if (-not (Test-Path $extPath)) {
    Write-Host "✓ Extension folder tidak ada - sudah bersih!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Langsung install extension baru:" -ForegroundColor Cyan
    Write-Host "  az extension add --name containerapp --yes" -ForegroundColor Gray
    exit 0
}

Write-Host "Step 1: Menghentikan proses Azure CLI..." -ForegroundColor Yellow
# Hentikan semua proses az atau python yang mungkin lock folder
Get-Process | Where-Object { $_.ProcessName -like "az*" -or $_.ProcessName -like "python*" } | ForEach-Object {
    Write-Host "  Stopping: $($_.ProcessName)" -ForegroundColor Gray
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Step 2: Menghapus folder extension..." -ForegroundColor Yellow

try {
    # Attempt 1: Direct removal
    Remove-Item -Path $extPath -Recurse -Force -ErrorAction Stop
    Write-Host "✓ Berhasil dihapus!" -ForegroundColor Green
}
catch {
    Write-Host "✗ Gagal dihapus langsung" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Trying alternate method..." -ForegroundColor Gray
    
    try {
        # Attempt 2: Remove individual files first
        Get-ChildItem -Path $extPath -Recurse -Force | Remove-Item -Force -ErrorAction Stop
        Remove-Item -Path $extPath -Force -ErrorAction Stop
        Write-Host "✓ Berhasil dihapus dengan alternate method!" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Tetap gagal. Folder mungkin masih locked." -ForegroundColor Red
        Write-Host ""
        Write-Host "Solusi:" -ForegroundColor Yellow
        Write-Host "1. Tutup semua Command Prompt / PowerShell windows" -ForegroundColor Gray
        Write-Host "2. Tutup Azure CLI dan setiap aplikasi yang mungkin mengakses Azure" -ForegroundColor Gray
        Write-Host "3. Buka PowerShell baru sebagai Administrator" -ForegroundColor Gray
        Write-Host "4. Jalankan script ini lagi" -ForegroundColor Gray
        Write-Host ""
        exit 1
    }
}

Write-Host ""
Write-Host "Step 3: Install ulang extension..." -ForegroundColor Yellow
az extension add --name containerapp --yes

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Extension berhasil diinstall!" -ForegroundColor Green
} else {
    Write-Host "✗ Gagal install extension" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 4: Verifikasi..." -ForegroundColor Yellow
az extension list --query "[?name=='containerapp'].{name:name, version:version}" -o table

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "        FIX COMPLETE!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Sekarang jalankan deploy script:" -ForegroundColor Cyan
Write-Host "  .\deploy\deploy-azure.ps1" -ForegroundColor Gray
Write-Host ""
