#!/bin/bash

# HealthCure - Full Azure Deployment
# Deploy everything to Azure: App Services + MongoDB Cosmos DB

set -e

RESOURCE_GROUP="healthcure-rg"
PLAN_NAME="healthcure-plan"
COSMOS_ACCOUNT="healthcure$(date +%s | tail -c 6)"
REGION="eastasia"

echo "================================================"
echo "HealthCure - Full Azure Deployment"
echo "================================================"
echo "Resource Group: $RESOURCE_GROUP"
echo "Region: $REGION"
echo ""

# Step 1: Create Cosmos DB Account (MongoDB API)
echo "[1/5] Creating Cosmos DB Account..."
az cosmosdb create \
  --name $COSMOS_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --kind MongoDB \
  --locations regionName=$REGION failoverPriority=0

echo "Cosmos DB Account: $COSMOS_ACCOUNT"

# Step 2: Get Cosmos DB connection string
echo "[2/5] Getting connection string..."
MONGO_URI=$(az cosmosdb keys list --name $COSMOS_ACCOUNT --resource-group $RESOURCE_GROUP --type connection-strings --query 'connectionStrings[0].connectionString' -o tsv)

# Step 3: Create App Service Plan
echo "[3/5] Creating App Service Plan..."
az appservice plan create \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux \
  --location $REGION

# Step 4: Deploy Frontend Web App
echo "[4/5] Deploying Frontend..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $PLAN_NAME \
  --name healthcure-frontend \
  --runtime "NODE:22-lts"

# Step 5: Deploy Services
echo "[5/5] Deploying Services..."

# Deploy Auth Service
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $PLAN_NAME \
  --name healthcure-auth \
  --runtime "NODE:22-lts"

# Set environment variables for Auth Service
az webapp config appsettings set \
  --name healthcure-auth \
  --resource-group $RESOURCE_GROUP \
  --settings MONGODB_URI="$MONGO_URI" NODE_ENV="production"

# Deploy Main Service
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $PLAN_NAME \
  --name healthcure-main \
  --runtime "NODE:22-lts"

# Set environment variables for Main Service
az webapp config appsettings set \
  --name healthcure-main \
  --resource-group $RESOURCE_GROUP \
  --settings MONGODB_URI="$MONGO_URI" NODE_ENV="production"

# Deploy Frontend with service URLs
az webapp config appsettings set \
  --name healthcure-frontend \
  --resource-group $RESOURCE_GROUP \
  --settings AUTH_SERVICE_URL="https://healthcure-auth.azurewebsites.net" MAIN_SERVICE_URL="https://healthcure-main.azurewebsites.net" NODE_ENV="production"

echo ""
echo "================================================"
echo "Full Azure Deployment Complete!"
echo "================================================"
echo ""
echo "Resources Created:"
echo "- Cosmos DB Account: $COSMOS_ACCOUNT"
echo "- App Service Plan: $PLAN_NAME"
echo ""
echo "Web Applications:"
echo "- Frontend: https://healthcure-frontend.azurewebsites.net"
echo "- Auth Service: https://healthcure-auth.azurewebsites.net"
echo "- Main Service: https://healthcure-main.azurewebsites.net"
echo ""
echo "Admin Credentials:"
echo "Email: admin@healthcure.com"
echo "Password: admin123"
echo ""
echo "Cosmos DB Connection String:"
echo "$MONGO_URI"
echo ""
echo "IMPORTANT: Deploy source code from GitHub to each webapp"
echo "az webapp deployment source config-zip -g $RESOURCE_GROUP -n healthcure-frontend --src /path/to/frontend.zip"
echo ""
