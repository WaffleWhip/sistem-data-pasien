# Azure Container Apps Deployment Guide

Panduan lengkap deploy HealthCure ke Azure Container Apps dengan **build lokal + push ke Azure**.

## Prerequisites

| Tool | Deskripsi | Install |
|------|-----------|---------|
| Docker Desktop | Build container images | [docker.com/products/docker-desktop](https://docker.com/products/docker-desktop) |
| Azure CLI | Manage Azure resources | [docs.microsoft.com/cli/azure/install-azure-cli](https://docs.microsoft.com/cli/azure/install-azure-cli) |
| Azure Account | Azure for Students OK | [azure.microsoft.com/free/students](https://azure.microsoft.com/free/students) |

---

## Quick Deploy (Otomatis)

### Windows (PowerShell)

```powershell
cd sistem-data-pasien
.\deploy\deploy-azure.ps1
```

### Linux/Mac/Cloud Shell (Bash)

```bash
cd sistem-data-pasien
chmod +x deploy/deploy-azure.sh
./deploy/deploy-azure.sh
```

Script akan otomatis: login Azure → buat resources → build images → push ke ACR → deploy Container Apps.

---

## Manual Deployment (Step-by-Step)

### Step 1: Login ke Azure

```bash
az login
```

Browser akan terbuka untuk login. Setelah sukses, pilih subscription:

```bash
az account set --subscription "<SUBSCRIPTION_ID>"
```

### Step 2: Register Azure Providers

```bash
az provider register --namespace Microsoft.ContainerRegistry --wait
az provider register --namespace Microsoft.App --wait
```

> ⏳ Proses ini memakan waktu 1-5 menit untuk akun baru.

### Step 3: Buat Resource Group

```bash
az group create --name healthcure-rg --location eastasia
```

Region yang tersedia untuk Azure for Students: `eastasia`, `koreacentral`, `japanwest`, `malaysiawest`, `indonesiacentral`.

### Step 4: Buat Azure Container Registry (ACR)

```bash
ACR_NAME="healthcureacr$(date +%s | tail -c 5)"
az acr create \
    --resource-group healthcure-rg \
    --name $ACR_NAME \
    --sku Basic \
    --admin-enabled true

ACR_SERVER="${ACR_NAME}.azurecr.io"
echo "ACR Server: $ACR_SERVER"
```

### Step 5: Login ke ACR

```bash
az acr login --name $ACR_NAME
```

### Step 6: Build & Push Docker Images

```bash
cd sistem-data-pasien

# Build dan push auth-service
docker build -t ${ACR_SERVER}/healthcure-auth-service:latest ./auth-service
docker push ${ACR_SERVER}/healthcure-auth-service:latest

# Build dan push main-service
docker build -t ${ACR_SERVER}/healthcure-main-service:latest ./main-service
docker push ${ACR_SERVER}/healthcure-main-service:latest

# Build dan push frontend
docker build -t ${ACR_SERVER}/healthcure-frontend:latest ./frontend
docker push ${ACR_SERVER}/healthcure-frontend:latest
```

### Step 7: Buat Container Apps Environment

```bash
az containerapp env create \
    --name healthcure-env \
    --resource-group healthcure-rg \
    --location eastasia
```

### Step 8: Get ACR Credentials

```bash
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query 'passwords[0].value' -o tsv)
```

### Step 9: Deploy MongoDB

```bash
az containerapp create \
    --name healthcure-mongodb \
    --resource-group healthcure-rg \
    --environment healthcure-env \
    --image mongo:4.4 \
    --target-port 27017 \
    --ingress internal \
    --cpu 0.5 --memory 1.0Gi

# Tunggu MongoDB ready
sleep 15
```

### Step 10: Deploy Auth Service

```bash
az containerapp create \
    --name healthcure-auth \
    --resource-group healthcure-rg \
    --environment healthcure-env \
    --image ${ACR_SERVER}/healthcure-auth-service:latest \
    --target-port 3001 \
    --ingress internal \
    --registry-server $ACR_SERVER \
    --registry-username $ACR_USERNAME \
    --registry-password $ACR_PASSWORD \
    --env-vars "MONGODB_URI=mongodb://healthcure-mongodb:27017/auth_db" "NODE_ENV=production" "JWT_SECRET=your-secret-key-here" \
    --cpu 0.25 --memory 0.5Gi
```

### Step 11: Deploy Main Service

```bash
az containerapp create \
    --name healthcure-main \
    --resource-group healthcure-rg \
    --environment healthcure-env \
    --image ${ACR_SERVER}/healthcure-main-service:latest \
    --target-port 3002 \
    --ingress internal \
    --registry-server $ACR_SERVER \
    --registry-username $ACR_USERNAME \
    --registry-password $ACR_PASSWORD \
    --env-vars "MONGODB_URI=mongodb://healthcure-mongodb:27017/main_db" "NODE_ENV=production" "JWT_SECRET=your-secret-key-here" \
    --cpu 0.25 --memory 0.5Gi
```

### Step 12: Deploy Frontend

```bash
az containerapp create \
    --name healthcure-frontend \
    --resource-group healthcure-rg \
    --environment healthcure-env \
    --image ${ACR_SERVER}/healthcure-frontend:latest \
    --target-port 3000 \
    --ingress external \
    --registry-server $ACR_SERVER \
    --registry-username $ACR_USERNAME \
    --registry-password $ACR_PASSWORD \
    --env-vars "AUTH_SERVICE_URL=http://healthcure-auth:3001" "MAIN_SERVICE_URL=http://healthcure-main:3002" "NODE_ENV=production" \
    --cpu 0.25 --memory 0.5Gi
```

### Step 13: Get Frontend URL

```bash
az containerapp show \
    --name healthcure-frontend \
    --resource-group healthcure-rg \
    --query 'properties.configuration.ingress.fqdn' -o tsv
```

---

## Hasil Deployment

```
Frontend URL: https://healthcure-frontend.<random>.eastasia.azurecontainerapps.io
```

**Admin Credentials:**
- Email: `admin@healthcure.com`
- Password: `admin123`

---

## Arsitektur di Azure

```
┌─────────────────────────────────────────────────────────────┐
│                 Azure Container Apps Environment             │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   Frontend   │───▶│ Auth Service │───▶│   MongoDB    │   │
│  │   (External) │    │  (Internal)  │    │  (Internal)  │   │
│  │   Port 3000  │    │   Port 3001  │    │  Port 27017  │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│         │                                        ▲          │
│         │            ┌──────────────┐            │          │
│         └───────────▶│ Main Service │────────────┘          │
│                      │  (Internal)  │                       │
│                      │   Port 3002  │                       │
│                      └──────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Useful Commands

```bash
# Lihat logs
az containerapp logs show --name healthcure-frontend --resource-group healthcure-rg --tail 50

# Lihat status semua apps
az containerapp list --resource-group healthcure-rg -o table

# Update image (setelah rebuild)
az containerapp update \
    --name healthcure-frontend \
    --resource-group healthcure-rg \
    --image ${ACR_SERVER}/healthcure-frontend:latest

# Restart container
az containerapp revision restart \
    --name healthcure-frontend \
    --resource-group healthcure-rg \
    --revision <revision-name>
```

---

## Cleanup (Hapus Semua Resources)

```bash
az group delete --name healthcure-rg --yes --no-wait
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Provider not registered` | Jalankan `az provider register --namespace Microsoft.App --wait` |
| `Image pull failed` | Cek ACR credentials dan pastikan image sudah di-push |
| `Container crashed` | Cek logs dengan `az containerapp logs show --name <app> --resource-group healthcure-rg` |
| `MongoDB connection failed` | Tunggu 15-30 detik setelah deploy MongoDB sebelum deploy services |
| `Quota exceeded` | Gunakan region lain atau upgrade subscription |

---

## Estimasi Biaya

| Resource | Spec | Est. Cost/Month |
|----------|------|-----------------|
| Container Apps | 4 containers @ 0.25 vCPU, 0.5GB | ~$15-30 |
| Container Registry | Basic tier | ~$5 |
| **Total** | | **~$20-35** |

> 💡 Azure for Students mendapat $100 credit gratis!
