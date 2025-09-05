#!/bin/bash

set -e

echo "🚀 Installing ArgoCD on Kubernetes cluster..."

# Create argocd namespace
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
echo "⏳ Waiting for ArgoCD to be ready..."
kubectl wait --for=condition=available deployment/argocd-server -n argocd --timeout=300s

# Expose ArgoCD server
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'

# Get ArgoCD admin password
echo "🔐 Getting ArgoCD admin password..."
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)
echo "ArgoCD admin password: $ARGOCD_PASSWORD"

# Create QR Scanner namespace
kubectl create namespace qr-scanner-app --dry-run=client -o yaml | kubectl apply -f -

# Install ArgoCD application and project
kubectl apply -f argocd/project.yaml -n argocd
kubectl apply -f argocd/application.yaml -n argocd

echo "✅ ArgoCD installed successfully!"
echo "📊 ArgoCD UI will be available at:"
echo "   https://localhost:8080 (after port-forwarding)"
echo ""
echo "To access ArgoCD UI, run:"
echo "kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo ""
echo "Username: admin"
echo "Password: $ARGOCD_PASSWORD"