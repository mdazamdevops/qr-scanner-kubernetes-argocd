import cv2
import qrcode
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from pyzbar import pyzbar
import io
import base64

class QRProcessor:
    @staticmethod
    def decode_qr_from_image(image_path):
        """Decode QR codes from an image file"""
        try:
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                return None, "Could not read image file"
            
            # Decode QR codes
            qr_codes = pyzbar.decode(image)
            
            if not qr_codes:
                return None, "No QR codes found in image"
            
            results = []
            for qr in qr_codes:
                result = {
                    'data': qr.data.decode('utf-8'),
                    'type': qr.type,
                    'position': {
                        'x': qr.rect.left,
                        'y': qr.rect.top,
                        'width': qr.rect.width,
                        'height': qr.rect.height
                    }
                }
                results.append(result)
            
            return results, None
            
        except Exception as e:
            return None, f"Error processing image: {str(e)}"
    
    @staticmethod
    def decode_qr_from_base64(base64_data):
        """Decode QR codes from base64 image data"""
        try:
            # Remove header if present
            if ',' in base64_data:
                base64_data = base64_data.split(',')[1]
            
            # Decode base64 to image
            image_bytes = base64.b64decode(base64_data)
            image_array = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
            
            if image is None:
                return None, "Could not decode image data"
            
            # Decode QR codes
            qr_codes = pyzbar.decode(image)
            
            if not qr_codes:
                return None, "No QR codes found in image"
            
            results = []
            for qr in qr_codes:
                result = {
                    'data': qr.data.decode('utf-8'),
                    'type': qr.type,
                    'position': {
                        'x': qr.rect.left,
                        'y': qr.rect.top,
                        'width': qr.rect.width,
                        'height': qr.rect.height
                    }
                }
                results.append(result)
            
            return results, None
            
        except Exception as e:
            return None, f"Error processing image data: {str(e)}"
    
    @staticmethod
    def generate_qr_code(data, size=(300, 300), border=4, error_correction='M'):
        """Generate QR code from text data"""
        try:
            # Set error correction level
            error_levels = {
                'L': qrcode.constants.ERROR_CORRECT_L,
                'M': qrcode.constants.ERROR_CORRECT_M,
                'Q': qrcode.constants.ERROR_CORRECT_Q,
                'H': qrcode.constants.ERROR_CORRECT_H
            }
            
            qr = qrcode.QRCode(
                version=1,
                error_correction=error_levels.get(error_correction, qrcode.constants.ERROR_CORRECT_M),
                box_size=10,
                border=border,
            )
            
            qr.add_data(data)
            qr.make(fit=True)
            
            # Create QR code image
            img = qr.make_image(fill_color="black", back_color="white")
            img = img.resize(size, Image.Resampling.LANCZOS)
            
            # Convert to base64 for web display
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)
            
            img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            return {
                'image': f"data:image/png;base64,{img_base64}",
                'size': size,
                'data': data
            }, None
            
        except Exception as e:
            return None, f"Error generating QR code: {str(e)}"
    
    @staticmethod
    def get_qr_info(data):
        """Get information about QR code content"""
        info = {
            'type': 'text',
            'description': 'Plain text',
            'data': data
        }
        
        data_lower = data.lower()
        
        if data_lower.startswith(('http://', 'https://')):
            info['type'] = 'url'
            info['description'] = 'Website URL'
        elif data_lower.startswith('mailto:'):
            info['type'] = 'email'
            info['description'] = 'Email address'
        elif data_lower.startswith('tel:'):
            info['type'] = 'phone'
            info['description'] = 'Phone number'
        elif data_lower.startswith('sms:'):
            info['type'] = 'sms'
            info['description'] = 'SMS message'
        elif data_lower.startswith('wifi:'):
            info['type'] = 'wifi'
            info['description'] = 'WiFi credentials'
        elif 'BEGIN:VCARD' in data.upper():
            info['type'] = 'vcard'
            info['description'] = 'Contact card'
        elif 'BEGIN:VEVENT' in data.upper():
            info['type'] = 'event'
            info['description'] = 'Calendar event'
        
        return info