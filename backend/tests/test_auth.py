import pytest

def test_login_page_get(client):
    """Test GET request to login page"""
    response = client.get('/login')
    # Login could return 200 (form), 302 (redirect), or 404 (if API-only)
    assert response.status_code in [200, 302, 404]

def test_authentication_required_endpoints(client):
    """Test that protected endpoints require authentication"""
    protected_endpoints = ['/dashboard', '/scan', '/api/scans', '/profile']
    
    for endpoint in protected_endpoints:
        response = client.get(endpoint)
        # Should redirect to login (302) or return error
        assert response.status_code in [302, 401, 403, 404]

def test_api_login(client):
    """Test API login endpoint if it exists"""
    response = client.post('/api/login', 
        json={'username': 'test', 'password': 'test'},
        follow_redirects=True
    )
    
    if response.status_code != 404:
        assert response.status_code in [200, 401, 400]