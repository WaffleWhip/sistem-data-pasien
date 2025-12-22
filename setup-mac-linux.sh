#!/bin/bash

echo "==================================================="
echo "     HEALTH CURE SYSTEM - AUTOMATIC SETUP"
echo "==================================================="
echo ""

# 1. Cek Docker
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker tidak ditemukan!"
    echo "Membuka halaman download..."
    sleep 2
    
    # Buka browser sesuai OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open https://www.docker.com/products/docker-desktop/
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open https://www.docker.com/products/docker-desktop/
    fi
    
    echo "Silakan install Docker, lalu jalankan script ini lagi."
    exit 1
fi

# 2. Cek apakah Docker Daemon jalan
if ! docker info > /dev/null 2>&1; then
    echo "[ERROR] Docker terinstall tapi tidak berjalan."
    echo "Silakan buka aplikasi Docker Desktop terlebih dahulu."
    exit 1
fi

echo "[OK] Docker siap. Menjalankan aplikasi..."

# 3. Jalankan
docker-compose up -d --build

echo ""
echo "[SUCCESS] Aplikasi berjalan!"
echo "Membuka browser..."
sleep 2

if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost
fi