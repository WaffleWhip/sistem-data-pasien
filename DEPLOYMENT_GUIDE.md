# Azure Container Apps Deployment Guide

Simple guide untuk deploy ke Azure Container Apps.

## Prerequisites

- Docker installed (lokal laptop)
- Azure CLI installed
- GitHub repo cloned

## Step 1: Build Docker Images (Local Laptop)

```bash
cd ~/sistem-data-pasien
docker compose build
```

## Step 2: Push to ACR (Local Laptop)

```bash
# Login to ACR
az acr login --name healthcure6546788

# Tag images
docker tag sistem-data-pasien-frontend:latest healthcure6546788.azurecr.io/healthcure-frontend:latest
docker tag sistem-data-pasien-auth-service:latest healthcure6546788.azurecr.io/healthcure-auth-service:latest
docker tag sistem-data-pasien-main-service:latest healthcure6546788.azurecr.io/healthcure-main-service:latest

# Push to ACR
docker push healthcure6546788.azurecr.io/healthcure-frontend:latest
docker push healthcure6546788.azurecr.io/healthcure-auth-service:latest
docker push healthcure6546788.azurecr.io/healthcure-main-service:latest
```

## Step 3: Deploy to Container Apps (Azure Cloud Shell)

```bash
cd ~/sistem-data-pasien

# Create resource group
az group create --name healthcure-rg --location eastasia

# Create Container Apps environment
az containerapp env create \
  --name healthcure-env \
  --resource-group healthcure-rg \
  --location eastasia

# Get ACR credentials
ACR_USER=$(az acr credential show --name healthcure6546788 --query username -o tsv)
ACR_PASS=$(az acr credential show --name healthcure6546788 --query 'passwords[0].value' -o tsv)

# Deploy MongoDB
az containerapp create \
  --name healthcure-mongodb \
  --resource-group healthcure-rg \
  --environment healthcure-env \
  --image mongo:4.4 \
  --target-port 27017 \
  --ingress internal

sleep 15

# Deploy Frontend
az containerapp create \
  --name healthcure-frontend \
  --resource-group healthcure-rg \
  --environment healthcure-env \
  --image healthcure6546788.azurecr.io/healthcure-frontend:latest \
  --target-port 3000 \
  --ingress external \
  --registry-server healthcure6546788.azurecr.io \
  --registry-username $ACR_USER \
  --registry-password $ACR_PASS \
  --env-vars AUTH_SERVICE_URL="http://healthcure-auth:3001" MAIN_SERVICE_URL="http://healthcure-main:3002"

# Deploy Auth Service
az containerapp create \
  --name healthcure-auth \
  --resource-group healthcure-rg \
  --environment healthcure-env \
  --image healthcure6546788.azurecr.io/healthcure-auth-service:latest \
  --target-port 3001 \
  --ingress internal \
  --registry-server healthcure6546788.azurecr.io \
  --registry-username $ACR_USER \
  --registry-password $ACR_PASS \
  --env-vars MONGODB_URI="mongodb://healthcure-mongodb:27017/auth_db" NODE_ENV="production" JWT_SECRET="healthcure-secret"

# Deploy Main Service
az containerapp create \
  --name healthcure-main \
  --resource-group healthcure-rg \
  --environment healthcure-env \
  --image healthcure6546788.azurecr.io/healthcure-main-service:latest \
  --target-port 3002 \
  --ingress internal \
  --registry-server healthcure6546788.azurecr.io \
  --registry-username $ACR_USER \
  --registry-password $ACR_PASS \
  --env-vars MONGODB_URI="mongodb://healthcure-mongodb:27017/main_db" NODE_ENV="production" JWT_SECRET="healthcure-secret"

# Get Frontend URL
az containerapp show \
  --name healthcure-frontend \
  --resource-group healthcure-rg \
  --query 'properties.configuration.ingress.fqdn' -o tsv
```

## Result

Frontend URL: https://healthcure-frontend.azurewebsites.net

Admin Credentials:
- Email: admin@healthcure.com
- Password: admin123

## Cleanup

```bash
az group delete --name healthcure-rg --yes
```

Done!
