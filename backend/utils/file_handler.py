import os
import uuid
from werkzeug.utils import secure_filename
from config import Config

class FileHandler:
    @staticmethod
    def allowed_file(filename):
        """Check if file extension is allowed"""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS
    
    @staticmethod
    def save_uploaded_file(file):
        """Save uploaded file and return the path"""
        if file and FileHandler.allowed_file(file.filename):
            # Generate unique filename
            filename = secure_filename(file.filename)
            name, ext = os.path.splitext(filename)
            unique_filename = f"{name}_{uuid.uuid4().hex[:8]}{ext}"
            
            file_path = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
            file.save(file_path)
            return file_path, unique_filename
        
        return None, None
    
    @staticmethod
    def delete_file(file_path):
        """Delete a file from the filesystem"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
        except Exception as e:
            print(f"Error deleting file {file_path}: {e}")
        return False
    
    @staticmethod
    def get_file_info(file_path):
        """Get information about a file"""
        try:
            stat = os.stat(file_path)
            return {
                'size': stat.st_size,
                'modified': stat.st_mtime,
                'exists': True
            }
        except Exception:
            return {'exists': False}