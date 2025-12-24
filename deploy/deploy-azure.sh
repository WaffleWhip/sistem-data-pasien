#!/bin/bash

# HealthCure - Azure Container Apps Deployment (Bash/Linux/Mac/Cloud Shell)
# Build lokal lalu push ke Azure Container Registry
# With dependency checking and auto-download functionality

set -e

# Configuration
RESOURCE_GROUP="${1:-healthcure-rg}"
LOCATION="${2:-eastasia}"
ACR_NAME="${3:-healthcureacr$RANDOM}"

echo "================================================"
echo " HealthCure - Azure Container Apps Deployment"
echo "================================================"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check dependencies
check_dependencies() {
    echo "[0/8] Checking dependencies..."
    echo ""
    
    MISSING=()
    
    # Check Docker
    if command_exists docker; then
        echo "✓ Docker found"
        docker --version | sed 's/^/  /'
    else
        echo "✗ Docker NOT found"
        MISSING+=("Docker")
    fi
    
    # Check Azure CLI
    if command_exists az; then
        echo "✓ Azure CLI found"
        az --version 2>/dev/null | head -1 | sed 's/^/  /'
    else
        echo "✗ Azure CLI NOT found"
        MISSING+=("Azure CLI")
    fi
    
    echo ""
    
    if [ ${#MISSING[@]} -gt 0 ]; then
        echo "Missing tools: ${MISSING[*]}"
        echo ""
        echo "Installation:"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "  Using Homebrew:"
            echo "  brew install docker azure-cli"
        else
            echo "  Using package manager:"
            echo "  sudo apt install docker.io azure-cli  # Debian/Ubuntu"
            echo "  sudo yum install docker azure-cli     # RHEL/CentOS"
        fi
        exit 1
    fi
    
    echo "✓ All required tools OK!"
    echo ""
}

# Run dependency check
check_dependencies

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
az provider register --namespace Microsoft.OperationalInsights --wait

# Step 3: Create Resource Group
echo "[3/8] Creating Resource Group..."
az group create --name $RESOURCE_GROUP --location $LOCATION --output none

# Step 4: Create Azure Container Registry
echo "[4/8] Creating Azure Container Registry..."
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --location $LOCATION --admin-enabled true --output none

ACR_SERVER="${ACR_NAME}.azurecr.io"
echo "ACR Server: $ACR_SERVER"

# Step 5: Login ke ACR
echo "[5/8] Login ke ACR..."
az acr login --name $ACR_NAME

# Step 6: Build dan Push Docker Images
echo "[6/8] Building dan pushing Docker images..."

echo "  Building auth-service..."
docker build -t ${ACR_SERVER}/healthcure-auth-service:latest ./auth-service --quiet
docker push ${ACR_SERVER}/healthcure-auth-service:latest --quiet

echo "  Building main-service..."
docker build -t ${ACR_SERVER}/healthcure-main-service:latest ./main-service --quiet
docker push ${ACR_SERVER}/healthcure-main-service:latest --quiet

echo "  Building frontend..."
docker build -t ${ACR_SERVER}/healthcure-frontend:latest ./frontend --quiet
docker push ${ACR_SERVER}/healthcure-frontend:latest --quiet

echo "  All images pushed successfully!"

# Step 7: Create Container Apps Environment
echo "[7/8] Creating Container Apps Environment..."
az containerapp env create \
    --name healthcure-env \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --output none

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query 'passwords[0].value' -o tsv)

# Generate secure JWT secret
JWT_SECRET="healthcure-jwt-${RANDOM}-$(date +%Y%m%d)"

# Step 8: Deploy Container Apps with proper dependency order
echo "[8/8] Deploying Container Apps..."
echo ""

# 1. MongoDB
echo "  Deploying MongoDB..."
az containerapp create \
    --name healthcure-mongodb \
    --resource-group $RESOURCE_GROUP \
    --environment healthcure-env \
    --image mongo:5.0 \
    --target-port 27017 \
    --ingress internal \
    --transport tcp \
    --cpu 0.5 --memory 1.0Gi \
    --min-replicas 1 --max-replicas 1 \
    --output none

echo "  Waiting for MongoDB to be ready (30s)..."
sleep 30

# 2. Auth Service
echo "  Deploying Auth Service..."
az containerapp create \
    --name healthcure-auth \
    --resource-group $RESOURCE_GROUP \
    --environment healthcure-env \
    --image ${ACR_SERVER}/healthcure-auth-service:latest \
    --target-port 3001 \
    --ingress internal \
    --registry-server $ACR_SERVER \
    --registry-username $ACR_USERNAME \
    --registry-password "$ACR_PASSWORD" \
    --cpu 0.25 --memory 0.5Gi \
    --min-replicas 1 --max-replicas 3 \
    --env-vars "MONGODB_URI=mongodb://healthcure-mongodb:27017/auth_db?directConnection=true" "NODE_ENV=production" "JWT_SECRET=$JWT_SECRET" \
    --output none

echo "  Waiting for Auth Service to be ready (20s)..."
sleep 20

# 3. Main Service
echo "  Deploying Main Service..."
az containerapp create \
    --name healthcure-main \
    --resource-group $RESOURCE_GROUP \
    --environment healthcure-env \
    --image ${ACR_SERVER}/healthcure-main-service:latest \
    --target-port 3002 \
    --ingress internal \
    --registry-server $ACR_SERVER \
    --registry-username $ACR_USERNAME \
    --registry-password "$ACR_PASSWORD" \
    --cpu 0.25 --memory 0.5Gi \
    --min-replicas 1 --max-replicas 3 \
    --env-vars "MONGODB_URI=mongodb://healthcure-mongodb:27017/main_db?directConnection=true" "NODE_ENV=production" "JWT_SECRET=$JWT_SECRET" \
    --output none

echo "  Waiting for Main Service to be ready (20s)..."
sleep 20

# 4. Frontend - using internal URLs for service-to-service communication
echo "  Deploying Frontend..."
az containerapp create \
    --name healthcure-frontend \
    --resource-group $RESOURCE_GROUP \
    --environment healthcure-env \
    --image ${ACR_SERVER}/healthcure-frontend:latest \
    --target-port 3000 \
    --ingress external \
    --registry-server $ACR_SERVER \
    --registry-username $ACR_USERNAME \
    --registry-password "$ACR_PASSWORD" \
    --cpu 0.25 --memory 0.5Gi \
    --min-replicas 1 --max-replicas 3 \
    --env-vars "AUTH_SERVICE_URL=http://healthcure-auth:3001" "MAIN_SERVICE_URL=http://healthcure-main:3002" "NODE_ENV=production" \
    --output none

# Get Frontend URL
echo "  Verifying deployment (15s)..."
sleep 15

FRONTEND_URL=$(az containerapp show --name healthcure-frontend --resource-group $RESOURCE_GROUP --query 'properties.configuration.ingress.fqdn' -o tsv)

echo ""
echo "================================================"
echo "        DEPLOYMENT COMPLETE!"
echo "================================================"
echo ""
echo "Frontend URL: https://$FRONTEND_URL"
echo ""
echo "Admin Credentials:"
echo "  Email    : admin@healthcure.com"
echo "  Password : admin123"
echo ""
echo "Useful Commands:"
echo "  View logs    : az containerapp logs show --name healthcure-frontend --resource-group $RESOURCE_GROUP --tail 50"
echo "  List apps    : az containerapp list --resource-group $RESOURCE_GROUP -o table"
echo "  Delete all   : az group delete --name $RESOURCE_GROUP --yes --no-wait"
echo ""
echo "Resources created:"
echo "  Resource Group : $RESOURCE_GROUP"
echo "  ACR            : $ACR_SERVER"
echo "  Environment    : healthcure-env"
echo ""
