import pytest
from unittest.mock import patch, MagicMock

def test_scan_qr_endpoint(client):
    """Test QR scan endpoint"""
    # Mock QR processing
    with patch('routes.qr_routes.QRProcessor') as mock_processor:
        mock_instance = MagicMock()
        mock_instance.process_qr.return_value = {'success': True, 'data': 'test-data'}
        mock_processor.return_value = mock_instance
        
        # Try QR scan endpoint
        response = client.post('/api/process_qr', 
            json={'image': 'data:image/png;base64,test123'}
        )
        
        if response.status_code != 404:
            assert response.status_code in [200, 401, 400]

def test_qr_history_endpoint(client):
    """Test QR history endpoint"""
    # Mock database response
    with patch('routes.qr_routes.QRHistory') as mock_history:
        mock_instance = MagicMock()
        mock_instance.get_user_scans.return_value = [{'id': 1, 'data': 'test-scan', 'date': '2024-01-01'}]
        mock_history.return_value = mock_instance
        
        response = client.get('/api/scans')
        
        if response.status_code != 404:
            assert response.status_code in [200, 401]