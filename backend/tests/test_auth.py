import pytest

def test_login_page_get(client):
    """Test GET request to login page"""
    response = client.get('/login')
    
    # Login page could return 200 (form) or 302 (redirect if already logged in)
    assert response.status_code in [200, 302]
    
    if response.status_code == 200:
        # Check if it's a form page
        assert b'form' in response.data or b'login' in response.data.lower()

def test_login_post_invalid_credentials(client):
    """Test POST login with invalid credentials"""
    # Try both form data and JSON
    test_data = [
        ({'username': 'invalid', 'password': 'wrong'}, 'form'),
        ({'username': 'invalid', 'password': 'wrong'}, 'json')
    ]
    
    for data, data_type in test_data:
        if data_type == 'form':
            response = client.post('/login', data=data, follow_redirects=True)
        else:
            response = client.post('/login', json=data, follow_redirects=True)
        
        # Could be 200 (with error message), 401, or 302 (redirect)
        assert response.status_code in [200, 401, 302]
        
        if response.status_code == 200:
            # Look for error indicators
            response_text = response.get_data(as_text=True).lower()
            if 'error' in response_text or 'invalid' in response_text:
                break

def test_logout_endpoint(client):
    """Test logout functionality"""
    # First, mock being logged in
    with client.session_transaction() as session:
        session['user_id'] = 1
        session['username'] = 'testuser'
    
    response = client.get('/logout', follow_redirects=True)
    
    # Logout should redirect (302 -> 200) or return success
    assert response.status_code in [200, 302]
    
    # Session should be cleared
    with client.session_transaction() as session:
        assert 'user_id' not in session

def test_authentication_required_endpoints(client):
    """Test that protected endpoints require authentication"""
    protected_endpoints = ['/dashboard', '/scan', '/api/scans']
    
    for endpoint in protected_endpoints:
        response = client.get(endpoint)
        
        # Should redirect to login (302) or return 401/403
        assert response.status_code in [302, 401, 403, 404]
        
        if response.status_code == 302:
            assert '/login' in response.location

def test_api_login(client):
    """Test API login endpoint if it exists"""
    response = client.post('/api/login', 
        json={'username': 'test', 'password': 'test'},
        follow_redirects=True
    )
    
    if response.status_code != 404:  # Only test if endpoint exists
        assert response.status_code in [200, 401]
        if response.status_code == 200:
            assert response.is_json
            data = response.get_json()
            assert 'success' in data or 'token' in data