#!/bin/bash

echo "Setting up CI/CD environment..."

# Create necessary directories
mkdir -p .github/workflows argocd kubernetes/base scripts

# Create basic workflow file without heredoc issues
cat > .github/workflows/gitops-ci-cd.yaml << 'EOL'
name: GitOps CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  workflow_dispatch:

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.12'
    - name: Install dependencies
      run: pip install -r backend/requirements.txt
    - name: Run tests
      run: echo "Tests would run here"
EOL

echo "CI/CD setup completed!"