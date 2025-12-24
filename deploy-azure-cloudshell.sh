#!/bin/bash

# HealthCure Azure Deployment Script for Cloud Shell
# Build images in ACR and deploy to Container Apps

set -e

# Configuration
RESOURCE_GROUP="healthcure-rg"
REGION="eastasia"
ACR_NAME="healthcureacr46519"
CONTAINER_ENV="healthcure-env"
ACR_SERVER="${ACR_NAME}.azurecr.io"

echo "================================================"
echo "HealthCure - Azure Deployment (Cloud Shell)"
echo "================================================"
echo "Region: $REGION"
echo "Resource Group: $RESOURCE_GROUP"
echo "ACR: $ACR_NAME"
echo "ACR Server: $ACR_SERVER"
echo ""

# Step 1: Build Frontend in ACR
echo "[1/4] Building Frontend image in ACR..."
az acr build \
  --registry $ACR_NAME \
  --image healthcure-frontend:latest \
  ./frontend

# Step 2: Build Auth Service in ACR
echo "[2/4] Building Auth Service image in ACR..."
az acr build \
  --registry $ACR_NAME \
  --image healthcure-auth-service:latest \
  ./auth-service

# Step 3: Build Main Service in ACR
echo "[3/4] Building Main Service image in ACR..."
az acr build \
  --registry $ACR_NAME \
  --image healthcure-main-service:latest \
  ./main-service

# Step 4: Create Container Apps Environment
echo "[4/4] Creating Container Apps Environment..."
az containerapp env create \
  --name $CONTAINER_ENV \
  --resource-group $RESOURCE_GROUP \
  --location $REGION \
  2>/dev/null || echo "Environment already exists"

# Get ACR credentials
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
echo "- Frontend: healthcure-frontend"
echo "- Auth Service: healthcure-auth"
echo "- Main Service: healthcure-main"
echo ""
echo "Get Frontend URL:"
echo "az containerapp show --name healthcure-frontend --resource-group $RESOURCE_GROUP --query 'properties.configuration.ingress.fqdn' -o tsv"
echo ""
echo "View Logs:"
echo "az containerapp logs show --name healthcure-frontend --resource-group $RESOURCE_GROUP --tail 50"
echo ""
echo "IMPORTANT: MongoDB is still running locally in Proxmox (192.168.1.167)"
echo "Services in Azure are configured to connect to local MongoDB."
echo ""
