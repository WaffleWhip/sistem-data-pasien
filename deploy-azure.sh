#!/bin/bash

# HealthCure - Azure Container Apps Deployment
# Deploy Docker containers + MongoDB to Azure Container Apps

set -e

RESOURCE_GROUP="healthcure-rg"
REGION="eastasia"
ACR_NAME="healthcure6546788"
CONTAINER_ENV="healthcure-env"
ACR_SERVER="${ACR_NAME}.azurecr.io"

echo "================================================"
echo "HealthCure - Azure Container Apps Deployment"
echo "================================================"
echo "Region: $REGION"
echo "Resource Group: $RESOURCE_GROUP"
echo "ACR: $ACR_NAME"
echo ""

# Step 1: Create Container Apps Environment
echo "[1/4] Creating Container Apps Environment..."
az containerapp env create \
  --name $CONTAINER_ENV \
  --resource-group $RESOURCE_GROUP \
  --location $REGION \
  2>/dev/null || echo "Environment already exists"

sleep 10

# Get ACR credentials
echo "[2/4] Getting ACR credentials..."
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query 'passwords[0].value' -o tsv)

# Step 2: Deploy MongoDB Container
echo "[3/4] Deploying MongoDB..."
az containerapp create \
  --name healthcure-mongodb \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINER_ENV \
  --image mongo:4.4 \
  --target-port 27017 \
  --ingress internal \
  2>/dev/null || echo "MongoDB already exists"

sleep 10

# Step 3: Deploy Frontend Container
echo "[4/4] Deploying Services..."

# Frontend
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
  --env-vars AUTH_SERVICE_URL="http://healthcure-auth:3001" MAIN_SERVICE_URL="http://healthcure-main:3002" \
  2>/dev/null || az containerapp update \
  --name healthcure-frontend \
  --resource-group $RESOURCE_GROUP \
  --image ${ACR_SERVER}/healthcure-frontend:latest

# Auth Service
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
  --env-vars MONGODB_URI="mongodb://healthcure-mongodb:27017/auth_db" NODE_ENV="production" JWT_SECRET="your-secret-key-change-this" \
  2>/dev/null || az containerapp update \
  --name healthcure-auth \
  --resource-group $RESOURCE_GROUP \
  --image ${ACR_SERVER}/healthcure-auth-service:latest

# Main Service
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
  --env-vars MONGODB_URI="mongodb://healthcure-mongodb:27017/main_db" NODE_ENV="production" JWT_SECRET="your-secret-key-change-this" \
  2>/dev/null || az containerapp update \
  --name healthcure-main \
  --resource-group $RESOURCE_GROUP \
  --image ${ACR_SERVER}/healthcure-main-service:latest

sleep 5

# Get Frontend URL
FRONTEND_URL=$(az containerapp show --name healthcure-frontend --resource-group $RESOURCE_GROUP --query 'properties.configuration.ingress.fqdn' -o tsv 2>/dev/null || echo "Generating...")

echo ""
echo "================================================"
echo "Azure Deployment Complete!"
echo "================================================"
echo ""
echo "Container Apps:"
echo "- Frontend: https://${FRONTEND_URL}"
echo "- Auth Service: (internal)"
echo "- Main Service: (internal)"
echo "- MongoDB: (internal)"
echo ""
echo "Admin Credentials:"
echo "Email: admin@healthcure.com"
echo "Password: admin123"
echo ""
echo "Important: Push Docker images to ACR first!"
echo "cd ~/sistem-data-pasien && docker compose build"
echo "docker tag sistem-data-pasien-frontend:latest ${ACR_SERVER}/healthcure-frontend:latest"
echo "docker push ${ACR_SERVER}/healthcure-frontend:latest"
echo "(Repeat for auth-service and main-service)"
echo ""
