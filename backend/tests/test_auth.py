import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_login_page(client):
    """Test login page loads"""
    response = client.get('/login')
    assert response.status_code == 200

def test_login_page(client):
    """Test login page loads"""
    response = client.get('/login')
    assert response.status_code == 200
    # Should contain login form elements
    assert b'form' in response.data
    assert b'username' in response.data or b'login' in response.data

def test_invalid_login(client):
    """Test invalid login returns error"""
    response = client.post('/login', data={
        'username': 'invalid',
        'password': 'wrongpassword'
    }, follow_redirects=True)
    # Should either return error or redirect with flash message
    assert response.status_code == 200