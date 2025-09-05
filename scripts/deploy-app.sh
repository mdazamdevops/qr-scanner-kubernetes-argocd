#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Deploying QR Scanner Application...${NC}"

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl could not be found. Please install kubectl.${NC}"
    exit 1
fi

# Check if current context is set
CURRENT_CONTEXT=$(kubectl config current-context 2>/dev/null || true)
if [ -z "$CURRENT_CONTEXT" ]; then
    echo -e "${RED}❌ No Kubernetes context found. Please configure kubectl.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Using Kubernetes context: $CURRENT_CONTEXT${NC}"

# Function to check if resource exists
check_resource() {
    kubectl get $1 $2 -n $3 >/dev/null 2>&1
}

# Create namespace if it doesn't exist
if ! check_resource namespace qr-scanner-app; then
    echo -e "${YELLOW}📁 Creating namespace...${NC}"
    kubectl create namespace qr-scanner-app
    echo -e "${GREEN}✓ Namespace created${NC}"
fi

# Apply base configurations
echo -e "${YELLOW}📦 Applying base configurations...${NC}"
kubectl apply -k kubernetes/base --namespace=qr-scanner-app

# Apply production overlay
echo -e "${YELLOW}🏭 Applying production configuration...${NC}"
kubectl apply -k kubernetes/overlays/production --namespace=qr-scanner-app

# Wait for deployments to be ready
echo -e "${YELLOW}⏳ Waiting for deployments to be ready...${NC}"

# Wait for backend
if kubectl rollout status deployment/backend -n qr-scanner-app --timeout=180s; then
    echo -e "${GREEN}✓ Backend deployment successful${NC}"
else
    echo -e "${RED}❌ Backend deployment failed${NC}"
    kubectl describe deployment/backend -n qr-scanner-app
    kubectl logs -l app=backend -n qr-scanner-app --tail=50
    exit 1
fi

# Wait for frontend
if kubectl rollout status deployment/frontend -n qr-scanner-app --timeout=180s; then
    echo -e "${GREEN}✓ Frontend deployment successful${NC}"
else
    echo -e "${RED}❌ Frontend deployment failed${NC}"
    kubectl describe deployment/frontend -n qr-scanner-app
    kubectl logs -l app=frontend -n qr-scanner-app --tail=50
    exit 1
fi

# Get application URLs
echo -e "${GREEN}✅ Application deployed successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Application Details:${NC}"
echo -e "Namespace: qr-scanner-app"
echo ""
echo -e "${YELLOW}🔗 Services:${NC}"
echo -e "Backend (Internal): backend-service.qr-scanner-app.svc.cluster.local"
echo -e "Frontend (Internal): frontend-service.qr-scanner-app.svc.cluster.local"
echo ""
echo -e "Backend (External):"
kubectl get svc backend-service-external -n qr-scanner-app -o jsonpath='{.status.loadBalancer.ingress[0].ip}{"\n"}' 2>/dev/null || echo "Not available"
echo ""
echo -e "Frontend (External):"
kubectl get svc frontend-service-external -n qr-scanner-app -o jsonpath='{.status.loadBalancer.ingress[0].ip}{"\n"}' 2>/dev/null || echo "Not available"
echo ""
echo -e "${YELLOW}📊 Pod Status:${NC}"
kubectl get pods -n qr-scanner-app -l 'app in (backend,frontend)' --field-selector=status.phase=Running
echo ""
echo -e "${YELLOW}🚀 To access via port-forward:${NC}"
echo -e "Backend: kubectl port-forward svc/backend-service -n qr-scanner-app 5000:80"
echo -e "Frontend: kubectl port-forward svc/frontend-service -n qr-scanner-app 3000:80"