#!/bin/bash

# HealthCure Azure Deployment Script for Cloud Shell
# Automatically generates all resource names and deploys

set -e

# Configuration
RESOURCE_GROUP="healthcure-rg"
REGION="eastasia"
TIMESTAMP=$(date +%s | tail -c 8)
ACR_NAME="healthcure${TIMESTAMP}"
CONTAINER_ENV="healthcure-env"
ACR_SERVER="${ACR_NAME}.azurecr.io"

echo "================================================"
echo "HealthCure - Azure Deployment (Cloud Shell)"
echo "================================================"
echo "Region: $REGION"
echo "Resource Group: $RESOURCE_GROUP"
echo "ACR Name: $ACR_NAME"
echo "ACR Server: $ACR_SERVER"
echo ""

# Step 0: Clean up old resource group if exists
echo "[0/5] Checking existing resources..."
if az group exists --name $RESOURCE_GROUP | grep -q true; then
  echo "Resource group exists, proceeding..."
else
  echo "Creating new resource group..."
  az group create --name $RESOURCE_GROUP --location $REGION
fi

# Step 1: Create ACR
echo "[1/5] Creating Azure Container Registry..."
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --location $REGION

echo "ACR created: $ACR_SERVER"
echo "Waiting for ACR to be fully ready..."
sleep 30

# Step 2: Build Frontend in ACR
echo "[2/5] Building Frontend image in ACR..."
az acr build \
  --registry $ACR_NAME \
  --image healthcure-frontend:latest \
  ./frontend

# Step 3: Build Auth Service in ACR
echo "[3/5] Building Auth Service image in ACR..."
az acr build \
  --registry $ACR_NAME \
  --image healthcure-auth-service:latest \
  ./auth-service

# Step 4: Build Main Service in ACR
echo "[4/5] Building Main Service image in ACR..."
az acr build \
  --registry $ACR_NAME \
  --image healthcure-main-service:latest \
  ./main-service

# Step 5: Create Container Apps Environment
echo "[5/5] Creating Container Apps Environment..."
az containerapp env create \
  --name $CONTAINER_ENV \
  --resource-group $RESOURCE_GROUP \
  --location $REGION \
  2>/dev/null || echo "Environment already exists"

sleep 10

# Get ACR credentials
echo "Getting ACR credentials..."
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query 'passwords[0].value' -o tsv)

# Deploy Frontend App
echo "Deploying Frontend Container App..."
az containerapp create \
  --name healthcure-frontend \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINER_ENV \
  --image ${ACR_SERVER}/healthcure-frontend:latest \
  --target-port 3000 \
  --ingress external \
  --registry-server $ACR_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  2>/dev/null || az containerapp update \
  --name healthcure-frontend \
  --resource-group $RESOURCE_GROUP \
  --image ${ACR_SERVER}/healthcure-frontend:latest

# Deploy Auth Service App
echo "Deploying Auth Service Container App..."
az containerapp create \
  --name healthcure-auth \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINER_ENV \
  --image ${ACR_SERVER}/healthcure-auth-service:latest \
  --target-port 3001 \
  --ingress internal \
  --registry-server $ACR_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  2>/dev/null || az containerapp update \
  --name healthcure-auth \
  --resource-group $RESOURCE_GROUP \
  --image ${ACR_SERVER}/healthcure-auth-service:latest

# Deploy Main Service App
echo "Deploying Main Service Container App..."
az containerapp create \
  --name healthcure-main \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINER_ENV \
  --image ${ACR_SERVER}/healthcure-main-service:latest \
  --target-port 3002 \
  --ingress internal \
  --registry-server $ACR_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  2>/dev/null || az containerapp update \
  --name healthcure-main \
  --resource-group $RESOURCE_GROUP \
  --image ${ACR_SERVER}/healthcure-main-service:latest

sleep 5

# Display results
FRONTEND_URL=$(az containerapp show --name healthcure-frontend --resource-group $RESOURCE_GROUP --query 'properties.configuration.ingress.fqdn' -o tsv 2>/dev/null || echo "Generating...")

echo ""
echo "================================================"
echo "Deployment Complete!"
echo "================================================"
echo ""
echo "Resource Group: $RESOURCE_GROUP"
echo "Region: $REGION"
echo "Container Registry: $ACR_SERVER"
echo ""
echo "Container Apps Deployed:"
echo "- Frontend: healthcure-frontend"
echo "- Auth Service: healthcure-auth"
echo "- Main Service: healthcure-main"
echo ""
echo "Frontend URL:"
echo "https://${FRONTEND_URL}"
echo ""
echo "Admin Credentials:"
echo "Email: admin@healthcure.com"
echo "Password: admin123"
echo ""
echo "Useful Commands:"
echo "az containerapp show --name healthcure-frontend --resource-group $RESOURCE_GROUP --query 'properties.configuration.ingress.fqdn' -o tsv"
echo "az containerapp logs show --name healthcure-frontend --resource-group $RESOURCE_GROUP --tail 50"
echo ""
echo "IMPORTANT: MongoDB is running locally in Proxmox (192.168.1.167)"
echo "Services in Azure connect to local MongoDB via internal networking."
echo ""
