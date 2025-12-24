#!/bin/bash

# HealthCure Azure Deployment Script
# Deploy to Azure Container Apps in East Asia

set -e

# Configuration
RESOURCE_GROUP="healthcure-rg"
REGION="eastasia"
ACR_NAME="healthcureacr$(date +%s | tail -c 6)"
APP_NAME="healthcure-app"
CONTAINER_ENV="healthcure-env"

echo "================================================"
echo "HealthCure - Azure Deployment"
echo "================================================"
echo "Region: $REGION"
echo "Resource Group: $RESOURCE_GROUP"
echo "ACR: $ACR_NAME"
echo ""

# Step 1: Create Resource Group
echo "[1/7] Creating Resource Group..."
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$REGION" \
  || echo "Resource group already exists"

# Step 2: Create Container Registry
echo "[2/7] Creating Azure Container Registry..."
az acr create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$ACR_NAME" \
  --sku Basic \
  --location "$REGION"

ACR_SERVER="${ACR_NAME}.azurecr.io"
echo "ACR Server: $ACR_SERVER"

# Step 3: Login to ACR
echo "[3/7] Logging in to ACR..."
az acr login --name "$ACR_NAME"

# Step 4: Build and Push Images
echo "[4/7] Building and pushing Docker images..."

echo "Building Frontend..."
docker build -t healthcure-frontend:latest ./frontend
docker tag healthcure-frontend:latest "${ACR_SERVER}/healthcure-frontend:latest"
docker push "${ACR_SERVER}/healthcure-frontend:latest"

echo "Building Auth Service..."
docker build -t healthcure-auth-service:latest ./auth-service
docker tag healthcure-auth-service:latest "${ACR_SERVER}/healthcure-auth-service:latest"
docker push "${ACR_SERVER}/healthcure-auth-service:latest"

echo "Building Main Service..."
docker build -t healthcure-main-service:latest ./main-service
docker tag healthcure-main-service:latest "${ACR_SERVER}/healthcure-main-service:latest"
docker push "${ACR_SERVER}/healthcure-main-service:latest"

# Step 5: Create Container Apps Environment
echo "[5/7] Creating Container Apps Environment..."
az containerapp env create \
  --name "$CONTAINER_ENV" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$REGION" \
  || echo "Environment already exists"

# Step 6: Deploy Frontend
echo "[6/7] Deploying Frontend Container App..."
az containerapp create \
  --name "${APP_NAME}-frontend" \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$CONTAINER_ENV" \
  --image "${ACR_SERVER}/healthcure-frontend:latest" \
  --target-port 3000 \
  --ingress external \
  --registry-server "$ACR_SERVER" \
  --registry-username "$(az acr credential show --name $ACR_NAME --query username -o tsv)" \
  --registry-password "$(az acr credential show --name $ACR_NAME --query 'passwords[0].value' -o tsv)" \
  || echo "Frontend app already exists, updating..."

# Step 7: Deploy Auth Service
echo "[7/7] Deploying Auth Service Container App..."
az containerapp create \
  --name "${APP_NAME}-auth" \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$CONTAINER_ENV" \
  --image "${ACR_SERVER}/healthcure-auth-service:latest" \
  --target-port 3001 \
  --ingress internal \
  --registry-server "$ACR_SERVER" \
  --registry-username "$(az acr credential show --name $ACR_NAME --query username -o tsv)" \
  --registry-password "$(az acr credential show --name $ACR_NAME --query 'passwords[0].value' -o tsv)" \
  || echo "Auth service app already exists, updating..."

# Deploy Main Service
echo "Deploying Main Service Container App..."
az containerapp create \
  --name "${APP_NAME}-main" \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$CONTAINER_ENV" \
  --image "${ACR_SERVER}/healthcure-main-service:latest" \
  --target-port 3002 \
  --ingress internal \
  --registry-server "$ACR_SERVER" \
  --registry-username "$(az acr credential show --name $ACR_NAME --query username -o tsv)" \
  --registry-password "$(az acr credential show --name $ACR_NAME --query 'passwords[0].value' -o tsv)" \
  || echo "Main service app already exists, updating..."

# Display results
echo ""
echo "================================================"
echo "Deployment Complete!"
echo "================================================"
echo ""
echo "Resource Group: $RESOURCE_GROUP"
echo "Region: $REGION"
echo "Container Registry: $ACR_SERVER"
echo ""
echo "Container Apps:"
echo "- Frontend: ${APP_NAME}-frontend"
echo "- Auth Service: ${APP_NAME}-auth"
echo "- Main Service: ${APP_NAME}-main"
echo ""
echo "Get Frontend URL:"
echo "az containerapp show --name ${APP_NAME}-frontend --resource-group $RESOURCE_GROUP --query 'properties.configuration.ingress.fqdn' -o tsv"
echo ""
echo "View Logs:"
echo "az containerapp logs show --name ${APP_NAME}-frontend --resource-group $RESOURCE_GROUP --tail 50"
echo ""
echo "Note: MongoDB is still running locally in Proxmox."
echo "Update connection strings if deploying MongoDB to Azure."
echo ""
