#!/bin/bash

# HealthCure - Azure App Service Deployment
# Simple deployment to Azure App Service (Node.js)

set -e

RESOURCE_GROUP="healthcure-rg"
PLAN_NAME="healthcure-plan"
REGION="eastasia"

echo "================================================"
echo "HealthCure - Azure App Service Deployment"
echo "================================================"
echo "Resource Group: $RESOURCE_GROUP"
echo "Plan: $PLAN_NAME"
echo "Region: $REGION"
echo ""

# Step 1: Create App Service Plan
echo "[1/4] Creating App Service Plan..."
az appservice plan create \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux \
  --location $REGION

# Step 2: Deploy Frontend
echo "[2/4] Deploying Frontend..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $PLAN_NAME \
  --name healthcure-frontend \
  --runtime "NODE|18-lts"

# Step 3: Deploy Auth Service
echo "[3/4] Deploying Auth Service..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $PLAN_NAME \
  --name healthcure-auth \
  --runtime "NODE|18-lts"

# Step 4: Deploy Main Service
echo "[4/4] Deploying Main Service..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $PLAN_NAME \
  --name healthcure-main \
  --runtime "NODE|18-lts"

echo ""
echo "================================================"
echo "Deployment Complete!"
echo "================================================"
echo ""
echo "Applications:"
echo "- Frontend: https://healthcure-frontend.azurewebsites.net"
echo "- Auth Service: https://healthcure-auth.azurewebsites.net"
echo "- Main Service: https://healthcure-main.azurewebsites.net"
echo ""
echo "Admin Credentials:"
echo "Email: admin@healthcure.com"
echo "Password: admin123"
echo ""
echo "Note: MongoDB database must be accessible from Azure."
echo "Currently using local MongoDB in Proxmox or Docker."
echo ""
