import pytest
import sys
import os
from unittest.mock import MagicMock, patch

# Mock all heavy dependencies before importing anything
sys.modules['pyzbar'] = MagicMock()
sys.modules['pyzbar.pyzbar'] = MagicMock()
sys.modules['pyzbar.pyzbar'].decode = MagicMock(return_value=[MagicMock(data=b'test-data')])
sys.modules['cv2'] = MagicMock()
sys.modules['numpy'] = MagicMock()

@pytest.fixture(scope='session', autouse=True)
def setup_test_environment():
    """Setup test environment with mocked dependencies"""
    # Create test database directory
    os.makedirs('database', exist_ok=True)
    
    # Mock database connection
    with patch('sqlite3.connect') as mock_db:
        mock_conn = MagicMock()
        mock_db.return_value = mock_conn
        mock_conn.execute.return_value = None
        mock_conn.commit.return_value = None
        
        # Mock other dependencies
        with patch('utils.qr_processor.pyzbar', MagicMock()):
            with patch('utils.qr_processor.cv2', MagicMock()):
                with patch('utils.qr_processor.numpy', MagicMock()):
                    # Import app after all mocks are in place
                    from app import app
                    app.config['TESTING'] = True
                    app.config['WTF_CSRF_ENABLED'] = False
                    yield app

@pytest.fixture
def client(setup_test_environment):
    """Create test client"""
    with setup_test_environment.test_client() as client:
        yield client

@pytest.fixture
def auth_client(client):
    """Create authenticated test client"""
    with client.session_transaction() as session:
        session['user_id'] = 1
        session['username'] = 'testuser'
    return client