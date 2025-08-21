from flask import Flask
from flask_cors import CORS
from config import Config
from routes.qr_routes import qr_bp
from routes.history_routes import history_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize CORS
    CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)
    
    # Initialize config
    Config.init_app(app)
    
    # Register blueprints
    app.register_blueprint(qr_bp, url_prefix='/api')
    app.register_blueprint(history_bp, url_prefix='/api')
    
    @app.route('/')
    def index():
        return {
            'message': 'QR Scanner API is running',
            'version': '1.0.0',
            'endpoints': {
                'scan_file': '/api/scan/file',
                'scan_data': '/api/scan/data',
                'generate': '/api/generate',
                'info': '/api/info',
                'history': '/api/history',
                'history_stats': '/api/history/stats'
            }
        }
    
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'message': 'API is running'}
    
    @app.errorhandler(400)
    def bad_request(error):
        return {'error': 'Bad request'}, 400
    
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Not found'}, 404
    
    @app.errorhandler(413)
    def request_entity_too_large(error):
        return {'error': 'File too large'}, 413
    
    @app.errorhandler(500)
    def internal_server_error(error):
        return {'error': 'Internal server error'}, 500
    
    return app

# This line creates the 'app' instance that your WSGI server (Gunicorn) looks for.
app = create_app()

if __name__ == '__main__':
    # This block is used for local development and is not run by Gunicorn.
    app.run(host='0.0.0.0', port=5000, debug=True)