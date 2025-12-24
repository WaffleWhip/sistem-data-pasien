#!/bin/bash

# HealthCure Azure Deployment - Local Build + Push
# All-in-one script to build locally and push to ACR

set -e

# Configuration
RESOURCE_GROUP="healthcure-rg"
REGION="eastasia"
ACR_NAME="healthcure6546788"
CONTAINER_ENV="healthcure-env"
ACR_SERVER="${ACR_NAME}.azurecr.io"

echo "================================================"
echo "HealthCure - Azure Deployment (Local Build)"
echo "================================================"
echo "ACR Name: $ACR_NAME"
echo "ACR Server: $ACR_SERVER"
echo "Resource Group: $RESOURCE_GROUP"
echo ""

# Step 1: Login to Azure
echo "[1/8] Logging in to Azure..."
az login

# Step 2: Login to ACR
echo "[2/8] Logging in to ACR..."
az acr login --name $ACR_NAME

# Step 3: Build images locally
echo "[3/8] Building Docker images locally..."
docker compose build

# Step 4: Tag Frontend image
echo "[4/8] Tagging Frontend image..."
docker tag sistem-data-pasien-frontend:latest ${ACR_SERVER}/healthcure-frontend:latest

# Step 5: Tag Auth Service image
echo "[5/8] Tagging Auth Service image..."
docker tag sistem-data-pasien-auth-service:latest ${ACR_SERVER}/healthcure-auth-service:latest

# Step 6: Tag Main Service image
echo "[6/8] Tagging Main Service image..."
docker tag sistem-data-pasien-main-service:latest ${ACR_SERVER}/healthcure-main-service:latest

# Step 7: Push images to ACR
echo "[7/8] Pushing images to ACR..."

echo "Pushing Frontend..."
docker push ${ACR_SERVER}/healthcure-frontend:latest

echo "Pushing Auth Service..."
docker push ${ACR_SERVER}/healthcure-auth-service:latest

echo "Pushing Main Service..."
docker push ${ACR_SERVER}/healthcure-main-service:latest

# Step 8: Deploy to Container Apps
echo "[8/8] Creating Container Apps..."

# Create Container Apps Environment if not exists
echo "Creating Container Apps Environment..."
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

# Deploy Frontend
echo "Deploying Frontend..."
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

# Deploy Auth Service
echo "Deploying Auth Service..."
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

# Deploy Main Service
echo "Deploying Main Service..."
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

# Get Frontend URL
FRONTEND_URL=$(az containerapp show --name healthcure-frontend --resource-group $RESOURCE_GROUP --query 'properties.configuration.ingress.fqdn' -o tsv 2>/dev/null || echo "Generating...")

echo ""
echo "================================================"
echo "Deployment Complete!"
echo "================================================"
echo ""
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
echo "IMPORTANT NOTES:"
echo "- MongoDB is running locally in Proxmox (192.168.1.167)"
echo "- Services in Azure connect to local MongoDB"
echo "- Make sure Proxmox MongoDB is accessible from Azure"
echo ""
