import pytest
import os
import tempfile
import sqlite3
from unittest.mock import patch, MagicMock

# Mock database before importing app to prevent circular imports
with patch('sqlite3.connect') as mock_connect:
    mock_conn = MagicMock()
    mock_connect.return_value = mock_conn
    
    from app import app

@pytest.fixture(scope='function')
def client():
    """Create test client with mocked database"""
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False  # Disable CSRF for testing
    
    # Mock the database connection for all tests
    with patch('models.qr_history.sqlite3.connect') as mock_connect:
        mock_conn = MagicMock()
        mock_connect.return_value = mock_conn
        
        # Mock database initialization
        mock_conn.execute.return_value = None
        mock_conn.commit.return_value = None
        
        with app.test_client() as client:
            yield client

@pytest.fixture(scope='function')
def auth_client(client):
    """Create authenticated test client"""
    # Mock session authentication
    with client.session_transaction() as session:
        session['user_id'] = 1
        session['username'] = 'testuser'
    return client