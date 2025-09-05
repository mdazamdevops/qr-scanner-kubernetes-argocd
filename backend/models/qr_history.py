import sqlite3
import json
from datetime import datetime
from config import Config

class QRHistory:
    def __init__(self):
        self.db_path = Config.DATABASE_PATH
        self.init_db()
    
    def init_db(self):
        """Initialize the database with required tables"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS qr_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type TEXT NOT NULL,  -- 'scan' or 'generate'
                    content TEXT NOT NULL,
                    data TEXT,  -- JSON string for additional data
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            conn.commit()
    
    def add_record(self, record_type, content, data=None):
        """Add a new record to history"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO qr_history (type, content, data)
                VALUES (?, ?, ?)
            ''', (record_type, content, json.dumps(data) if data else None))
            conn.commit()
            return cursor.lastrowid
    
    def get_history(self, limit=50):
        """Get recent history records"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM qr_history 
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (limit,))
            records = cursor.fetchall()
            
            # Convert to list of dictionaries
            history = []
            for record in records:
                item = dict(record)
                if item['data']:
                    item['data'] = json.loads(item['data'])
                history.append(item)
            
            return history
    
    def delete_record(self, record_id):
        """Delete a specific record"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM qr_history WHERE id = ?', (record_id,))
            conn.commit()
            return cursor.rowcount > 0
    
    def clear_history(self):
        """Clear all history records"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM qr_history')
            conn.commit()
            return cursor.rowcount