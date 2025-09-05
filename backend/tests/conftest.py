import pytest
import sys
import os
from unittest.mock import MagicMock, patch

# --- Global Mocks ---
# Mock heavy dependencies at the system level before any application code is imported.
# This ensures that any module trying to import these will get our mock instead of the real library.
sys.modules['pyzbar'] = MagicMock()
sys.modules['pyzbar.pyzbar'] = MagicMock()
sys.modules['pyzbar.pyzbar'].decode = MagicMock(return_value=[MagicMock(data=b'test-data')])
sys.modules['cv2'] = MagicMock()
sys.modules['numpy'] = MagicMock()

@pytest.fixture(scope='session', autouse=True)
def setup_test_environment():
    """
    Sets up a comprehensive test environment for the entire session.
    - Mocks database connections and other external dependencies.
    - Initializes and yields the Flask app instance for testing.
    """
    # Create a dummy test database directory if it doesn't exist.
    os.makedirs('database', exist_ok=True)
    
    # Mock the database connection to avoid actual database operations.
    with patch('sqlite3.connect') as mock_db:
        mock_conn = MagicMock()
        mock_db.return_value = mock_conn
        mock_conn.execute.return_value = None
        mock_conn.commit.return_value = None
        
        # --- Context-Specific Mocks ---
        # Mock the specific modules as they are used within the 'utils.qr_processor' file.
        with patch('utils.qr_processor.pyzbar', MagicMock()), \
             patch('utils.qr_processor.cv2', MagicMock()), \
             patch('utils.qr_processor.np', MagicMock()): # FIXED: Patched 'np' instead of 'numpy'
            
            # Import the app *after* all the mocks are in place.
            # This is crucial because the app will be created using the mocked dependencies.
            from app import app
            app.config['TESTING'] = True
            app.config['WTF_CSRF_ENABLED'] = False
            yield app

@pytest.fixture
def client(setup_test_environment):
    """
    Creates a Flask test client from the app fixture.
    This client can be used to make requests to the application's endpoints.
    """
    # The 'setup_test_environment' fixture provides the initialized app.
    with setup_test_environment.test_client() as client:
        yield client

@pytest.fixture
def auth_client(client):
    """
    Creates an authenticated test client by setting a user in the session.
    This is useful for testing endpoints that require a logged-in user.
    """
    with client.session_transaction() as session:
        session['user_id'] = 1
        session['username'] = 'testuser'
    return client
