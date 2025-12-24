#!/bin/bash

# HealthCure - Azure Container Apps Deployment (Bash/Linux/Mac/Cloud Shell)
# Build lokal lalu push ke Azure Container Registry

set -e

# Configuration
RESOURCE_GROUP="${1:-healthcure-rg}"
LOCATION="${2:-eastasia}"
ACR_NAME="${3:-healthcureacr$RANDOM}"

echo "================================================"
echo " HealthCure - Azure Container Apps Deployment"
echo "================================================"
echo ""
echo "Resource Group : $RESOURCE_GROUP"
echo "Location       : $LOCATION"
echo "ACR Name       : $ACR_NAME"
echo ""

# Step 1: Login ke Azure (skip jika di Cloud Shell)
echo "[1/8] Login ke Azure..."
if [ -z "$AZURE_HTTP_USER_AGENT" ]; then
    az login
fi

# Step 2: Register required providers
echo "[2/8] Registering Azure providers..."
az provider register --namespace Microsoft.ContainerRegistry --wait
az provider register --namespace Microsoft.App --wait

# Step 3: Create Resource Group
echo "[3/8] Creating Resource Group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Step 4: Create Azure Container Registry
echo "[4/8] Creating Azure Container Registry..."
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --location $LOCATION --admin-enabled true

ACR_SERVER="${ACR_NAME}.azurecr.io"
echo "ACR Server: $ACR_SERVER"

# Step 5: Login ke ACR
echo "[5/8] Login ke ACR..."
az acr login --name $ACR_NAME

# Step 6: Build dan Push Docker Images
echo "[6/8] Building dan pushing Docker images..."

echo "Building auth-service..."
docker build -t ${ACR_SERVER}/healthcure-auth-service:latest ./auth-service
docker push ${ACR_SERVER}/healthcure-auth-service:latest

echo "Building main-service..."
docker build -t ${ACR_SERVER}/healthcure-main-service:latest ./main-service
docker push ${ACR_SERVER}/healthcure-main-service:latest

echo "Building frontend..."
docker build -t ${ACR_SERVER}/healthcure-frontend:latest ./frontend
docker push ${ACR_SERVER}/healthcure-frontend:latest

# Step 7: Create Container Apps Environment
echo "[7/8] Creating Container Apps Environment..."
az containerapp env create \
    --name healthcure-env \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query 'passwords[0].value' -o tsv)

# Step 8: Deploy Container Apps
echo "[8/8] Deploying Container Apps..."

# Deploy MongoDB
echo "Deploying MongoDB..."
az containerapp create \
    --name healthcure-mongodb \
    --resource-group $RESOURCE_GROUP \
    --environment healthcure-env \
    --image mongo:4.4 \
    --target-port 27017 \
    --ingress internal \
    --cpu 0.5 --memory 1.0Gi

sleep 15

# Deploy Auth Service
echo "Deploying Auth Service..."
az containerapp create \
    --name healthcure-auth \
    --resource-group $RESOURCE_GROUP \
    --environment healthcure-env \
    --image ${ACR_SERVER}/healthcure-auth-service:latest \
    --target-port 3001 \
    --ingress internal \
    --registry-server $ACR_SERVER \
    --registry-username $ACR_USERNAME \
    --registry-password $ACR_PASSWORD \
    --env-vars "MONGODB_URI=mongodb://healthcure-mongodb:27017/auth_db" "NODE_ENV=production" "JWT_SECRET=healthcure-jwt-secret-$RANDOM" \
    --cpu 0.25 --memory 0.5Gi

# Deploy Main Service
echo "Deploying Main Service..."
az containerapp create \
    --name healthcure-main \
    --resource-group $RESOURCE_GROUP \
    --environment healthcure-env \
    --image ${ACR_SERVER}/healthcure-main-service:latest \
    --target-port 3002 \
    --ingress internal \
    --registry-server $ACR_SERVER \
    --registry-username $ACR_USERNAME \
    --registry-password $ACR_PASSWORD \
    --env-vars "MONGODB_URI=mongodb://healthcure-mongodb:27017/main_db" "NODE_ENV=production" "JWT_SECRET=healthcure-jwt-secret-$RANDOM" \
    --cpu 0.25 --memory 0.5Gi

# Deploy Frontend
echo "Deploying Frontend..."
az containerapp create \
    --name healthcure-frontend \
    --resource-group $RESOURCE_GROUP \
    --environment healthcure-env \
    --image ${ACR_SERVER}/healthcure-frontend:latest \
    --target-port 3000 \
    --ingress external \
    --registry-server $ACR_SERVER \
    --registry-username $ACR_USERNAME \
    --registry-password $ACR_PASSWORD \
    --env-vars "AUTH_SERVICE_URL=http://healthcure-auth:3001" "MAIN_SERVICE_URL=http://healthcure-main:3002" "NODE_ENV=production" \
    --cpu 0.25 --memory 0.5Gi

# Get Frontend URL
sleep 10
FRONTEND_URL=$(az containerapp show --name healthcure-frontend --resource-group $RESOURCE_GROUP --query 'properties.configuration.ingress.fqdn' -o tsv)

echo ""
echo "================================================"
echo " DEPLOYMENT COMPLETE!"
echo "================================================"
echo ""
echo "Frontend URL: https://$FRONTEND_URL"
echo ""
echo "Admin Credentials:"
echo "  Email    : admin@healthcure.com"
echo "  Password : admin123"
echo ""
echo "Useful Commands:"
echo "  View logs    : az containerapp logs show --name healthcure-frontend --resource-group $RESOURCE_GROUP"
echo "  Delete all   : az group delete --name $RESOURCE_GROUP --yes"
echo ""
