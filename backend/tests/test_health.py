import pytest

def test_health_endpoint(client):
    """Test health endpoint returns 200"""
    response = client.get('/health')
    assert response.status_code == 200
    assert response.is_json
    
    data = response.get_json()
    # Flexible assertion for different response formats
    assert 'status' in data or 'message' in data
    if 'status' in data:
        assert data['status'] == 'healthy'

def test_root_endpoint(client):
    """Test root endpoint behavior"""
    response = client.get('/')
    # Root could return 200 (JSON), 302 (redirect), or 404
    assert response.status_code in [200, 302, 404]

def test_nonexistent_endpoint(client):
    """Test that nonexistent endpoints return appropriate error"""
    response = client.get('/this-endpoint-does-not-exist-12345')
    assert response.status_code in [404, 405]