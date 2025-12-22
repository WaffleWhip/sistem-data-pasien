@echo off
title Health Cure - Auto Setup
cls

echo ===================================================
echo      HEALTH CURE SYSTEM - AUTOMATIC SETUP
echo ===================================================
echo.

:: 1. Cek apakah Docker terinstall
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Desktop tidak ditemukan!
    echo.
    echo Aplikasi ini membutuhkan Docker untuk berjalan.
    echo Saya akan membuka halaman download Docker untuk Anda...
    echo.
    echo 1. Download dan Install Docker Desktop.
    echo 2. Restart komputer Anda.
    echo 3. Jalankan file ini lagi.
    echo.
    timeout /t 5
    start https://www.docker.com/products/docker-desktop/
    pause
    exit
)

echo [OK] Docker ditemukan. Memulai aplikasi...
echo.

:: 2. Jalankan Aplikasi
docker-compose up -d --build

:: 3. Cek Status
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Gagal menjalankan aplikasi. Pastikan Docker Desktop sedang RUNNING (ikon paus di taskbar).
    pause
    exit
)

echo.
echo [SUCCESS] Aplikasi berhasil dijalankan!
echo Membuka browser...
timeout /t 3
start http://localhost

pause