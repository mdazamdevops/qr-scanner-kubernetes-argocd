from flask import Blueprint, request, jsonify
from utils.qr_processor import QRProcessor
from utils.file_handler import FileHandler
from models.qr_history import QRHistory

qr_bp = Blueprint('qr', __name__)

# Don't initialize here - initialize when needed
qr_history = QRHistory()

@qr_bp.route('/scan', methods=['POST'])
def scan_qr():
    # Initialize database only when actually used
    conn = qr_history.get_connection()

qr_bp = Blueprint('qr', __name__)
qr_history = QRHistory()

@qr_bp.route('/scan/file', methods=['POST'])
def scan_qr_from_file():
    """Scan QR code from uploaded file"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not FileHandler.allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Save uploaded file
        file_path, filename = FileHandler.save_uploaded_file(file)
        if not file_path:
            return jsonify({'error': 'Failed to save file'}), 500
        
        try:
            # Process QR code
            results, error = QRProcessor.decode_qr_from_image(file_path)
            
            if error:
                return jsonify({'error': error}), 400
            
            # Save to history
            for result in results:
                qr_info = QRProcessor.get_qr_info(result['data'])
                qr_history.add_record(
                    'scan',
                    result['data'],
                    {
                        'method': 'file_upload',
                        'filename': filename,
                        'qr_info': qr_info,
                        'position': result['position']
                    }
                )
            
            return jsonify({
                'success': True,
                'results': results,
                'count': len(results)
            })
        
        finally:
            # Clean up uploaded file
            FileHandler.delete_file(file_path)
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@qr_bp.route('/scan/data', methods=['POST'])
def scan_qr_from_data():
    """Scan QR code from base64 image data"""
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        image_data = data['image']
        
        # Process QR code
        results, error = QRProcessor.decode_qr_from_base64(image_data)
        
        if error:
            return jsonify({'error': error}), 400
        
        # Save to history
        for result in results:
            qr_info = QRProcessor.get_qr_info(result['data'])
            qr_history.add_record(
                'scan',
                result['data'],
                {
                    'method': 'camera_capture',
                    'qr_info': qr_info,
                    'position': result['position']
                }
            )
        
        return jsonify({
            'success': True,
            'results': results,
            'count': len(results)
        })
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@qr_bp.route('/generate', methods=['POST'])
def generate_qr_code():
    """Generate QR code from text data"""
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'No text data provided'}), 400
        
        text = data['text'].strip()
        if not text:
            return jsonify({'error': 'Text cannot be empty'}), 400
        
        # Get optional parameters
        size = data.get('size', [300, 300])
        if isinstance(size, list) and len(size) == 2:
            size = tuple(size)
        else:
            size = (300, 300)
        
        border = data.get('border', 4)
        error_correction = data.get('errorCorrection', 'M')
        
        # Generate QR code
        result, error = QRProcessor.generate_qr_code(
            text, size, border, error_correction
        )
        
        if error:
            return jsonify({'error': error}), 400
        
        # Save to history
        qr_info = QRProcessor.get_qr_info(text)
        qr_history.add_record(
            'generate',
            text,
            {
                'method': 'text_input',
                'qr_info': qr_info,
                'size': size,
                'border': border,
                'error_correction': error_correction
            }
        )
        
        return jsonify({
            'success': True,
            'qr_code': result
        })
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@qr_bp.route('/info', methods=['POST'])
def get_qr_info():
    """Get information about QR code content"""
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'No text data provided'}), 400
        
        text = data['text']
        info = QRProcessor.get_qr_info(text)
        
        return jsonify({
            'success': True,
            'info': info
        })
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500