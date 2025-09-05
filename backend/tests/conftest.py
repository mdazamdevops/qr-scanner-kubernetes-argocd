import pytest
import os
import tempfile
import sqlite3
from app import app as flask_app

@pytest.fixture
def app():
    """Create app with test configuration"""
    # Create temporary database for tests
    db_fd, db_path = tempfile.mkstemp()
    
    flask_app.config['TESTING'] = True
    flask_app.config['DATABASE_URL'] = f'sqlite:///{db_path}'
    
    # Create test database
    with flask_app.app_context():
        # Initialize test database
        conn = sqlite3.connect(db_path)
        # Create necessary tables
        conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS qr_scans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                qr_data TEXT,
                scan_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
        conn.close()
    
    yield flask_app
    
    # Clean up
    os.close(db_fd)
    os.unlink(db_path)

@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()

@pytest.fixture
def runner(app):
    """Create CLI runner"""
    return app.test_cli_runner()