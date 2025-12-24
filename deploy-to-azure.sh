#!/bin/bash

# Configuration
APP_NAME="app-pasien-$RANDOM"
RG_NAME="rg-pasien-project"
LOCATION="eastasia" 
ACR_NAME="regpasien$RANDOM"
PLAN_NAME="plan-pasien"

# Colors
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}Starting Deployment to Azure...${NC}"
echo "Resource Group: $RG_NAME"
echo "App Name: $APP_NAME"
echo "ACR Name: $ACR_NAME"
echo "Location: $LOCATION"

# 0. Clean up existing Resource Group (if any) to avoid region conflicts
echo -e "${GREEN}Checking for existing Resource Group...${NC}"
if az group exists --name $RG_NAME; then
    echo -e "${GREEN}Deleting existing Resource Group '$RG_NAME' to ensure clean deployment in $LOCATION...${NC}"
    az group delete --name $RG_NAME --yes --no-wait
    echo -e "${GREEN}Deletion initiated. Proceeding immediately...${NC}"
fi

# 1. Create Resource Group
echo -e "${GREEN}Creating Resource Group...${NC}"
az group create --name $RG_NAME --location $LOCATION

# 2. Create Container Registry
echo -e "${GREEN}Creating Azure Container Registry (ACR)...${NC}"
az acr create --resource-group $RG_NAME --name $ACR_NAME --sku Basic --admin-enabled true

# Get ACR Login Server and Credentials
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --resource-group $RG_NAME --query "loginServer" --output tsv)
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --resource-group $RG_NAME --query "username" --output tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --resource-group $RG_NAME --query "passwords[0].value" --output tsv)

echo "ACR Server: $ACR_LOGIN_SERVER"

# 3. Build Images using ACR Build (Cloud Build)
echo -e "${GREEN}Building Images in ACR...${NC}"

echo "Building Auth Service..."
az acr build --registry $ACR_NAME --image pasien-auth-service:latest ./auth-service

echo "Building Main Service..."
az acr build --registry $ACR_NAME --image pasien-main-service:latest ./main-service

echo "Building Frontend..."
az acr build --registry $ACR_NAME --image pasien-frontend:latest ./frontend

# 4. Create App Service Plan
echo -e "${GREEN}Creating App Service Plan...${NC}"
az appservice plan create --name $PLAN_NAME --resource-group $RG_NAME --sku B1 --is-linux

echo "Waiting 10s for Plan to register..."
sleep 10

# 5. Create Web App for Containers
echo -e "${GREEN}Creating Web App...${NC}"
az webapp create --resource-group $RG_NAME --plan $PLAN_NAME --name $APP_NAME --multicontainer-config-type compose --multicontainer-config-file docker-compose.azure.yml

# 6. Configure Web App
echo -e "${GREEN}Configuring Web App Settings...${NC}"

# Set environment variables for the Web App
az webapp config appsettings set --resource-group $RG_NAME --name $APP_NAME --settings \
  ACR_NAME=$ACR_NAME \
  WEBSITES_ENABLE_APP_SERVICE_STORAGE=true \
  WEBSITES_PORT=3000 \
  DOCKER_REGISTRY_SERVER_URL="https://$ACR_LOGIN_SERVER" \
  DOCKER_REGISTRY_SERVER_USERNAME=$ACR_USERNAME \
  DOCKER_REGISTRY_SERVER_PASSWORD=$ACR_PASSWORD

echo -e "${GREEN}Deployment Configured!${NC}"
echo -e "Your app will be available at: http://$APP_NAME.azurewebsites.net"
echo -e "Note: It may take a few minutes for the containers to start up."
echo -e "You can view logs with: az webapp log tail --name $APP_NAME --resource-group $RG_NAME"
