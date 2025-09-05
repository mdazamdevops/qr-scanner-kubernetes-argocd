def test_basic():
    """Simple test that doesn't require any dependencies"""
    assert 1 + 1 == 2

def test_health_endpoint(client):
    """Test health endpoint without heavy dependencies"""
    response = client.get('/health')
    assert response.status_code == 200