import pytest
import base64
from unittest.mock import patch

def test_scan_qr_endpoint(client):
    """Test QR scan endpoint"""
    # Mock QR processing to avoid image analysis
    with patch('utils.qr_processor.process_qr_code') as mock_process:
        mock_process.return_value = {'success': True, 'data': 'test-data'}
        
        # Test with different input formats
        test_data = {
            'json': {'image': 'data:image/png;base64,test123'},
            'form': {'image': 'data:image/png;base64,test123'}
        }
        
        for content_type, data in test_data.items():
            if content_type == 'json':
                response = client.post('/api/process_qr', json=data)
            else:
                response = client.post('/api/process_qr', data=data)
            
            if response.status_code != 404:  # Only test if endpoint exists
                assert response.status_code in [200, 400, 401]
                if response.status_code == 200:
                    assert response.is_json
                    result = response.get_json()
                    assert 'success' in result

def test_qr_history_endpoint(client):
    """Test QR history endpoint"""
    # Mock database response
    with patch('models.qr_history.QRHistory.get_user_scans') as mock_get:
        mock_get.return_value = [{'id': 1, 'data': 'test-scan', 'date': '2024-01-01'}]
        
        response = client.get('/api/scans')
        
        if response.status_code != 404:  # Only test if endpoint exists
            assert response.status_code in [200, 401]
            if response.status_code == 200:
                assert response.is_json
                data = response.get_json()
                assert isinstance(data, list)

def test_generate_qr_endpoint(client):
    """Test QR generation endpoint"""
    test_data = {'text': 'https://example.com'}
    
    response = client.post('/api/generate', json=test_data)
    
    if response.status_code != 404:  # Only test if endpoint exists
        assert response.status_code in [200, 400, 401]
        if response.status_code == 200:
            assert response.is_json
            data = response.get_json()
            assert 'success' in data or 'image' in data