#!/bin/bash

# List of regions to test (most likely to least likely for students)
regions=("eastus" "eastus2" "westus" "westus2" "centralus" "northcentralus" "southcentralus" "northeurope" "westeurope" "southeastasia" "australiaeast")

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔍 Starting Azure Region Probe...${NC}"
echo "This script will try to create a small resource in different regions to see which one is allowed."

for region in "${regions[@]}"; do
    echo "----------------------------------------"
    echo "Testing Region: $region"
    
    # Random names to avoid conflicts
    rg_name="probe-rg-$region-$RANDOM"
    acr_name="probearc$RANDOM"
    
    # 1. Create a temporary Resource Group
    echo "  > Creating temp Resource Group..."
    if az group create --name "$rg_name" --location "$region" --output none 2>/dev/null; then
        
        # 2. Try to create a dummy Container Registry (The real test)
        echo "  > Attempting to create Container Registry (ACR)..."
        if az acr create --resource-group "$rg_name" --name "$acr_name" --sku Basic --output none 2>/dev/null; then
            echo -e "${GREEN}✅ SUCCESS: Region '$region' WORKS!${NC}"
            
            echo "Cleaning up..."
            az group delete --name "$rg_name" --yes --no-wait --output none 2>/dev/null
            
            echo -e "\n👉 ${GREEN}Please tell me to use: $region${NC}"
            exit 0
        else
            echo -e "${RED}❌ FAILED: ACR creation is restricted in '$region'.${NC}"
        fi
        
        # Cleanup failed group
        echo "  > Cleaning up..."
        az group delete --name "$rg_name" --yes --no-wait --output none 2>/dev/null
    else
        echo -e "${RED}❌ FAILED: Could not even create Resource Group in '$region'.${NC}"
    fi
done

echo "----------------------------------------"
echo "Probe complete. No suitable region found in the list."
