name: QR Scanner CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test-backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend

    steps:
    - uses: actions/checkout@v4

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.12'

    - name: Install system dependencies
      run: sudo apt-get update && sudo apt-get install -y libzbar0

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install pytest pytest-cov

    - name: Run tests
      env:
        # Use a temporary file in a writable runner directory for the test database.
        # This is a more reliable method than an in-memory database URI.
        DATABASE_URL: ${{ runner.temp }}/test_database.db
      run: python -m pytest tests/ -v --cov=.

  test-frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend

    steps:
    - uses: actions/checkout@v4

    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: './frontend/package-lock.json'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm test

  build-and-push:
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'

    steps:
    - uses: actions/checkout@v4

    - name: Log in to GitHub Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata for Docker
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: |
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-backend
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-frontend
        tags: |
          type=sha,prefix=,suffix=-{{sha}}
          type=ref,event=branch
          type=ref,event=tag
          type=ref,event=pr
          type=semver,pattern={{version}}
          type=semver,pattern={{major}}.{{minor}}

    - name: Build and push Backend
      uses: docker/build-push-action@v4
      with:
        context: ./backend
        push: true
        tags: ${{ fromJSON(steps.meta.outputs.json).tags[0] }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

    - name: Build and push Frontend
      uses: docker/build-push-action@v4
      with:
        context: ./frontend
        push: true
        tags: ${{ fromJSON(steps.meta.outputs.json).tags[1] }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to Staging
      uses: steebchen/kubectl@v2.0.0
      with:
        config: ${{ secrets.KUBE_CONFIG_STAGING }}
        command: apply -k kubernetes/overlays/staging
      env:
        KUBECONFIG: ${{ secrets.KUBE_CONFIG_STAGING }}

  deploy-production:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to Production
      uses: steebchen/kubectl@v2.0.0
      with:
        config: ${{ secrets.KUBE_CONFIG_PRODUCTION }}
        command: apply -k kubernetes/overlays/production
      env:
        KUBECONFIG: ${{ secrets.KUBE_CONFIG_PRODUCTION }}

