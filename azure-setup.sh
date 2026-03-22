#!/bin/bash
# =============================================================================
# Azure Container Apps Infrastructure Setup
# Train Booking System — run this ONCE to provision all Azure resources
# Requires: Azure CLI (az) installed and logged in via `az login`
# =============================================================================

set -e  # exit on any error

# ─── Configuration ────────────────────────────────────────────────────────────
RESOURCE_GROUP="train-booking-rg"
LOCATION="eastus"
ACR_NAME="trainbookingregistry"           # must be globally unique, lowercase
ENVIRONMENT_NAME="train-booking-env"
LOG_WORKSPACE="train-booking-logs"

# Container App names
APPS=("train-management-app" "seat-availability-app" "ticket-booking-app" "notification-app")
IMAGES=("train-management-service" "seat-availability-service" "ticket-booking-service" "notification-service")
PORTS=(3001 3002 3003 3004)

echo "============================================"
echo " Train Booking System — Azure Provisioning"
echo "============================================"

# ─── 1. Resource Group ───────────────────────────────────────────────────────
echo "[1/7] Creating resource group: $RESOURCE_GROUP..."
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output table

# ─── 2. Azure Container Registry ─────────────────────────────────────────────
echo "[2/7] Creating Azure Container Registry: $ACR_NAME..."
az acr create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$ACR_NAME" \
  --sku Basic \
  --admin-enabled true \
  --output table

# Retrieve ACR credentials
ACR_USERNAME=$(az acr credential show --name "$ACR_NAME" --query "username" -o tsv)
ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" -o tsv)
ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --query "loginServer" -o tsv)

echo "ACR Login Server: $ACR_LOGIN_SERVER"

# ─── 3. Log Analytics Workspace ──────────────────────────────────────────────
echo "[3/7] Creating Log Analytics workspace..."
az monitor log-analytics workspace create \
  --resource-group "$RESOURCE_GROUP" \
  --workspace-name "$LOG_WORKSPACE" \
  --output table

LOG_WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --resource-group "$RESOURCE_GROUP" \
  --workspace-name "$LOG_WORKSPACE" \
  --query customerId -o tsv)

LOG_WORKSPACE_KEY=$(az monitor log-analytics workspace get-shared-keys \
  --resource-group "$RESOURCE_GROUP" \
  --workspace-name "$LOG_WORKSPACE" \
  --query primarySharedKey -o tsv)

# ─── 4. Container Apps Environment ───────────────────────────────────────────
echo "[4/7] Creating Container Apps managed environment..."
az containerapp env create \
  --name "$ENVIRONMENT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --logs-workspace-id "$LOG_WORKSPACE_ID" \
  --logs-workspace-key "$LOG_WORKSPACE_KEY" \
  --output table

# ─── 5. Secrets (stored in environment) ──────────────────────────────────────
# NOTE: Replace placeholder values below before running
echo "[5/7] Secrets note: set these in GitHub Actions Secrets and Azure Container App secrets:"
echo "  - MONGODB_URI  : Your MongoDB Atlas connection string"
echo "  - KAFKA_BROKER : Your Kafka broker address (e.g. from Confluent Cloud free tier)"
echo "  - EMAIL_USER   : Gmail address for notifications"
echo "  - EMAIL_PASS   : Gmail App Password"
echo ""
echo "  GitHub Actions Secrets needed:"
echo "  - AZURE_CREDENTIALS  (az ad sp create-for-rbac output)"
echo "  - ACR_USERNAME       = $ACR_USERNAME"
echo "  - ACR_PASSWORD       (retrieve from Azure portal)"
echo "  - SONAR_TOKEN        (from sonarcloud.io)"

# ─── 6. Deploy placeholder Container Apps ────────────────────────────────────
echo "[6/7] Creating Container Apps (with placeholder image, pipelines will update)..."

for i in "${!APPS[@]}"; do
  APP="${APPS[$i]}"
  PORT="${PORTS[$i]}"
  IMAGE="${IMAGES[$i]}"

  echo "  Creating $APP on port $PORT..."
  az containerapp create \
    --name "$APP" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$ENVIRONMENT_NAME" \
    --image "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest" \
    --target-port "$PORT" \
    --ingress external \
    --min-replicas 0 \
    --max-replicas 3 \
    --cpu 0.25 \
    --memory 0.5Gi \
    --registry-server "$ACR_LOGIN_SERVER" \
    --registry-username "$ACR_USERNAME" \
    --registry-password "$ACR_PASSWORD" \
    --output table
done

# ─── 7. Output FQDNs ─────────────────────────────────────────────────────────
echo "[7/7] Container App URLs:"
for APP in "${APPS[@]}"; do
  FQDN=$(az containerapp show \
    --name "$APP" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.configuration.ingress.fqdn" -o tsv)
  echo "  $APP → https://$FQDN"
done

echo ""
echo "============================================"
echo " Provisioning complete!"
echo " Next steps:"
echo "   1. Add GitHub Actions secrets listed above"
echo "   2. Push to main branch to trigger deployments"
echo "   3. Set MongoDB Atlas URI and Kafka broker"
echo "      in each Container App's environment vars"
echo "============================================"
