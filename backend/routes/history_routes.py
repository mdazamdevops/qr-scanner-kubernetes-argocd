from flask import Blueprint, request, jsonify
from models.qr_history import QRHistory

history_bp = Blueprint('history', __name__)
qr_history = QRHistory()

@history_bp.route('/history', methods=['GET'])
def get_history():
    """Get QR code history"""
    try:
        limit = request.args.get('limit', 50, type=int)
        limit = min(max(limit, 1), 200)  # Limit between 1 and 200
        
        history = qr_history.get_history(limit)
        
        return jsonify({
            'success': True,
            'history': history,
            'count': len(history)
        })
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@history_bp.route('/history/<int:record_id>', methods=['DELETE'])
def delete_history_record(record_id):
    """Delete a specific history record"""
    try:
        success = qr_history.delete_record(record_id)
        
        if success:
            return jsonify({'success': True, 'message': 'Record deleted'})
        else:
            return jsonify({'error': 'Record not found'}), 404
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@history_bp.route('/history/clear', methods=['DELETE'])
def clear_history():
    """Clear all history records"""
    try:
        count = qr_history.clear_history()
        
        return jsonify({
            'success': True,
            'message': f'Cleared {count} records'
        })
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@history_bp.route('/history/stats', methods=['GET'])
def get_history_stats():
    """Get history statistics"""
    try:
        history = qr_history.get_history(1000)  # Get more records for stats
        
        stats = {
            'total_records': len(history),
            'scans': len([h for h in history if h['type'] == 'scan']),
            'generations': len([h for h in history if h['type'] == 'generate']),
            'methods': {},
            'content_types': {}
        }
        
        for record in history:
            # Count methods
            if record['data'] and 'method' in record['data']:
                method = record['data']['method']
                stats['methods'][method] = stats['methods'].get(method, 0) + 1
            
            # Count content types
            if record['data'] and 'qr_info' in record['data']:
                content_type = record['data']['qr_info'].get('type', 'unknown')
                stats['content_types'][content_type] = stats['content_types'].get(content_type, 0) + 1
        
        return jsonify({
            'success': True,
            'stats': stats
        })
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500