import sqlite3
import json
import os
from datetime import datetime

# It's better practice to handle configuration within the class or pass it in,
# but to make this file work with the assumption of a 'config.py',
# we'll handle its potential absence gracefully.
try:
    from config import Config
except ImportError:
    # If config.py doesn't exist (e.g., in a simple test environment),
    # provide a fallback default path.
    class Config:
        DATABASE_PATH = 'instance/qr_history.db'

class QRHistory:
    def __init__(self):
        # Allow overriding the database path with an environment variable for testing,
        # otherwise, use the path from the Config object.
        self.db_path = os.environ.get('DATABASE_URL', Config.DATABASE_PATH)
        self.init_db()

    def init_db(self):
        """Initialize the database and ensure its parent directory exists."""
        # Ensure the directory for the database file exists before trying to connect.
        db_dir = os.path.dirname(self.db_path)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS qr_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type TEXT NOT NULL,
                    content TEXT NOT NULL,
                    data TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            conn.commit()

    def add_record(self, record_type, content, data=None):
        """Add a new record to history."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO qr_history (type, content, data)
                VALUES (?, ?, ?)
            ''', (record_type, content, json.dumps(data) if data else None))
            conn.commit()
            return cursor.lastrowid

    def get_history(self, limit=50):
        """Get recent history records."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM qr_history
                ORDER BY timestamp DESC
                LIMIT ?
            ''', (limit,))
            records = cursor.fetchall()

            history = []
            for record in records:
                item = dict(record)
                if item.get('data'):
                    item['data'] = json.loads(item['data'])
                history.append(item)

            return history

    def delete_record(self, record_id):
        """Delete a specific record."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM qr_history WHERE id = ?', (record_id,))
            conn.commit()
            return cursor.rowcount > 0

    def clear_history(self):
        """Clear all history records."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM qr_history')
            conn.commit()
            return cursor.rowcount

