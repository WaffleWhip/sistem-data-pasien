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

# Function to download file
download_file() {
    local url=$1
    local output=$2
    local filename=$(basename "$output")
    
    echo "  Downloading $filename..."
    
    if command_exists curl; then
        curl -L -o "$output" "$url" 2>/dev/null && echo "  ✓ Downloaded to: $output" && return 0
    elif command_exists wget; then
        wget -q -O "$output" "$url" && echo "  ✓ Downloaded to: $output" && return 0
    else
        echo "  ✗ curl or wget required for download"
        return 1
    fi
}

# Function to get latest Docker URL
get_latest_docker_url() {
    echo "  Fetching latest Docker version..."
    
    # Docker Desktop links
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        ARCH=$(uname -m)
        if [[ "$ARCH" == "arm64" ]]; then
            echo "https://desktop.docker.com/mac/main/arm64/Docker.dmg"
        else
            echo "https://desktop.docker.com/mac/main/amd64/Docker.dmg"
        fi
    else
        # Linux - use Docker from repo
        echo "docker"
    fi
}

# Function to get latest Azure CLI URL
get_latest_azure_cli_url() {
    echo "  Fetching latest Azure CLI version..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "https://aka.ms/installazureclimacos"
    else
        echo "azure-cli"
    fi
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
        
        read -p "Download missing tools now? (y/n) " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo ""
            echo "Downloading tools..."
            echo ""
            
            DOWNLOAD_PATH="$HOME/Downloads"
            mkdir -p "$DOWNLOAD_PATH"
            
            if [[ " ${MISSING[@]} " =~ " Docker " ]]; then
                DOCKER_URL=$(get_latest_docker_url)
                DOCKER_FILE="$DOWNLOAD_PATH/Docker-installer"
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    DOCKER_FILE="$DOWNLOAD_PATH/Docker.dmg"
                fi
                if download_file "$DOCKER_URL" "$DOCKER_FILE"; then
                    echo "  👉 Open to install: $DOCKER_FILE"
                fi
            fi
            
            if [[ " ${MISSING[@]} " =~ " Azure CLI " ]]; then
                AZ_URL=$(get_latest_azure_cli_url)
                AZ_FILE="$DOWNLOAD_PATH/azure-cli-installer"
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    AZ_FILE="$DOWNLOAD_PATH/azure-cli.pkg"
                fi
                if download_file "$AZ_URL" "$AZ_FILE"; then
                    echo "  👉 Open to install: $AZ_FILE"
                fi
            fi
            
            echo ""
            echo "After installation, restart your terminal and run this script again."
            exit 0
        else
            echo "Cannot continue without required tools."
            echo ""
            echo "Installation:"
            if [[ "$OSTYPE" == "darwin"* ]]; then
                echo "  Using Homebrew:"
                echo "  brew install docker azure-cli"
                echo ""
                echo "  Or download from:"
                echo "  • Docker:    https://www.docker.com/products/docker-desktop"
                echo "  • Azure CLI: https://learn.microsoft.com/cli/azure/install-azure-cli-macos"
            else
                echo "  Using package manager:"
                echo "  sudo apt install docker.io azure-cli  # Debian/Ubuntu"
                echo "  sudo yum install docker azure-cli     # RHEL/CentOS"
                echo ""
                echo "  Or download from:"
                echo "  • Docker:    https://www.docker.com/products/docker-desktop"
                echo "  • Azure CLI: https://learn.microsoft.com/cli/azure/install-azure-cli-linux"
            fi
            exit 1
        fi
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
az provider register --namespace Microsoft.KubernetesConfiguration --wait

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

# Create a temp Log Analytics workspace for Container Apps
LOG_WORKSPACE_NAME="healthcure-logs-$RANDOM"
echo "Creating Log Analytics workspace: $LOG_WORKSPACE_NAME..."
az monitor log-analytics workspace create \
    --resource-group $RESOURCE_GROUP \
    --workspace-name $LOG_WORKSPACE_NAME

WORKSPACE_ID=$(az monitor log-analytics workspace show \
    --resource-group $RESOURCE_GROUP \
    --workspace-name $LOG_WORKSPACE_NAME \
    --query customerId -o tsv)

WORKSPACE_KEY=$(az monitor log-analytics workspace get-shared-keys \
    --resource-group $RESOURCE_GROUP \
    --workspace-name $LOG_WORKSPACE_NAME \
    --query primarySharedKey -o tsv)

az containerapp env create \
    --name healthcure-env \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --logs-workspace-id $WORKSPACE_ID \
    --logs-workspace-key $WORKSPACE_KEY

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query 'passwords[0].value' -o tsv)

# Step 8: Deploy Container Apps with proper dependency order
echo "[8/8] Deploying Container Apps (with proper startup order)..."
echo ""

# Function to deploy container app with create or update
deploy_container_app() {
    local name=$1
    local image=$2
    local target_port=$3
    local ingress=$4
    local wait_seconds=$5
    local -n env_vars=$6
    
    echo "Deploying $name..."
    
    # Try to update first
    local env_args=""
    for key in "${!env_vars[@]}"; do
        env_args="$env_args \"${key}=${env_vars[$key]}\""
    done
    
    if az containerapp show --name "$name" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
        # Update existing
        if [ -n "$env_args" ]; then
            eval "az containerapp update \
                --name $name \
                --resource-group $RESOURCE_GROUP \
                --image $image \
                --env-vars $env_args"
        else
            az containerapp update \
                --name $name \
                --resource-group $RESOURCE_GROUP \
                --image $image
        fi
    else
        # Create new
        local create_cmd="az containerapp create \
            --name $name \
            --resource-group $RESOURCE_GROUP \
            --environment healthcure-env \
            --image $image \
            --target-port $target_port \
            --ingress $ingress \
            --cpu 0.25 --memory 0.5Gi"
        
        if [[ "$name" == "healthcure-mongodb" ]]; then
            create_cmd="${create_cmd/--cpu 0.25 --memory 0.5Gi/--cpu 0.5 --memory 1.0Gi}"
        fi
        
        if [[ "$image" != "mongo:4.4" ]]; then
            create_cmd="$create_cmd \
                --registry-server $ACR_SERVER \
                --registry-username $ACR_USERNAME \
                --registry-password $ACR_PASSWORD"
        fi
        
        if [ -n "$env_args" ]; then
            create_cmd="$create_cmd --env-vars $env_args"
        fi
        
        eval "$create_cmd"
    fi
    
    if [ "$wait_seconds" -gt 0 ]; then
        echo "  Waiting ${wait_seconds}s for $name to be ready..."
        sleep "$wait_seconds"
    fi
}

# Phase 1: Deploy MongoDB (wait longest)
echo ""
echo "Phase 1: Deploy MongoDB (with init wait)..."
declare -A mongodb_vars
deploy_container_app "healthcure-mongodb" "mongo:4.4" "27017" "internal" "60" mongodb_vars

# Phase 2: Deploy Auth Service
echo ""
echo "Phase 2: Deploy Auth Service..."
declare -A auth_vars=(
    ["MONGODB_URI"]="mongodb://healthcure-mongodb:27017/auth_db"
    ["NODE_ENV"]="production"
    ["JWT_SECRET"]="healthcure-jwt-secret-$RANDOM"
)
deploy_container_app "healthcure-auth" "${ACR_SERVER}/healthcure-auth-service:latest" "3001" "internal" "20" auth_vars

# Phase 3: Deploy Main Service
echo ""
echo "Phase 3: Deploy Main Service..."
declare -A main_vars=(
    ["MONGODB_URI"]="mongodb://healthcure-mongodb:27017/main_db"
    ["NODE_ENV"]="production"
    ["JWT_SECRET"]="healthcure-jwt-secret-$RANDOM"
)
deploy_container_app "healthcure-main" "${ACR_SERVER}/healthcure-main-service:latest" "3002" "internal" "20" main_vars

# Phase 4: Deploy Frontend
echo ""
echo "Phase 4: Deploy Frontend..."
declare -A frontend_vars=(
    ["AUTH_SERVICE_URL"]="http://healthcure-auth:3001"
    ["MAIN_SERVICE_URL"]="http://healthcure-main:3002"
    ["NODE_ENV"]="production"
)
deploy_container_app "healthcure-frontend" "${ACR_SERVER}/healthcure-frontend:latest" "3000" "external" "15" frontend_vars

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
