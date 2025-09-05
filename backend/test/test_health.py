import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_endpoint(client):
    """Test health endpoint returns 200"""
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json['status'] == 'healthy'
    assert 'service' in response.json

def test_api_info_endpoint(client):
    """Test API info endpoint returns correct structure"""
    response = client.get('/api/info')
    assert response.status_code == 200
    assert response.json['message'] == 'QR Scanner API is running'
    assert 'endpoints' in response.json
    assert 'version' in response.json

def test_root_endpoint(client):
    """Test root endpoint redirects or returns valid response"""
    response = client.get('/')
    assert response.status_code in [200, 302]  # 200 for JSON, 302 for redirect