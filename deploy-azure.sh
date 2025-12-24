#!/bin/bash

# HealthCure - Full Azure Deployment (Student Account)
# Deploy: App Services + Azure Database for MySQL

set -e

RESOURCE_GROUP="healthcure-rg"
PLAN_NAME="healthcure-plan"
MYSQL_SERVER="healthcure$(date +%s | tail -c 6)"
MYSQL_USER="healthcure"
MYSQL_PASS="Pass@123456789"
REGION="eastasia"

echo "================================================"
echo "HealthCure - Full Azure Deployment"
echo "================================================"
echo "Resource Group: $RESOURCE_GROUP"
echo "Region: $REGION"
echo ""

# Step 1: Create MySQL Database Server
echo "[1/5] Creating Azure Database for MySQL..."
az mysql flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $MYSQL_SERVER \
  --location $REGION \
  --admin-user $MYSQL_USER \
  --admin-password $MYSQL_PASS \
  --sku-name Standard_B1s \
  --tier Burstable

echo "MySQL Server: $MYSQL_SERVER"

# Step 2: Create databases
echo "[2/5] Creating databases..."
az mysql flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $MYSQL_SERVER \
  --database-name auth_db

az mysql flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $MYSQL_SERVER \
  --database-name main_db

# Step 3: Create App Service Plan
echo "[3/5] Creating App Service Plan..."
az appservice plan create \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux \
  --location $REGION

# Step 4: Deploy Web Apps
echo "[4/5] Deploying Web Applications..."

# Frontend
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $PLAN_NAME \
  --name healthcure-frontend \
  --runtime "NODE:22-lts"

az webapp config appsettings set \
  --name healthcure-frontend \
  --resource-group $RESOURCE_GROUP \
  --settings AUTH_SERVICE_URL="https://healthcure-auth.azurewebsites.net" MAIN_SERVICE_URL="https://healthcure-main.azurewebsites.net" NODE_ENV="production"

# Auth Service
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $PLAN_NAME \
  --name healthcure-auth \
  --runtime "NODE:22-lts"

az webapp config appsettings set \
  --name healthcure-auth \
  --resource-group $RESOURCE_GROUP \
  --settings DATABASE_URL="mysql://${MYSQL_USER}:${MYSQL_PASS}@${MYSQL_SERVER}.mysql.database.azure.com:3306/auth_db" NODE_ENV="production" JWT_SECRET="your-secret-key-change-this"

# Main Service
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $PLAN_NAME \
  --name healthcure-main \
  --runtime "NODE:22-lts"

az webapp config appsettings set \
  --name healthcure-main \
  --resource-group $RESOURCE_GROUP \
  --settings DATABASE_URL="mysql://${MYSQL_USER}:${MYSQL_PASS}@${MYSQL_SERVER}.mysql.database.azure.com:3306/main_db" NODE_ENV="production" JWT_SECRET="your-secret-key-change-this"

echo ""
echo "================================================"
echo "Full Azure Deployment Complete!"
echo "================================================"
echo ""
echo "Resources:"
echo "- MySQL Server: ${MYSQL_SERVER}.mysql.database.azure.com"
echo "- Auth Database: auth_db"
echo "- Main Database: main_db"
echo ""
echo "Web Applications:"
echo "- Frontend: https://healthcure-frontend.azurewebsites.net"
echo "- Auth Service: https://healthcure-auth.azurewebsites.net"
echo "- Main Service: https://healthcure-main.azurewebsites.net"
echo ""
echo "Database Credentials:"
echo "- Username: ${MYSQL_USER}"
echo "- Password: ${MYSQL_PASS}"
echo "- Host: ${MYSQL_SERVER}.mysql.database.azure.com"
echo ""
echo "Admin Credentials (Application):"
echo "- Email: admin@healthcure.com"
echo "- Password: admin123"
echo ""
