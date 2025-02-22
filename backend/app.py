import os
from flask import Flask
from flask_cors import CORS
from backend.database import db
from backend.routes.auth import auth_bp
from backend.routes.study_sessions import sessions_bp
from backend.routes.chat import chat_bp
from backend.config import DevelopmentConfig, ProductionConfig  # Centralized config
from backend.utils.scheduler import start_scheduler  # Background task scheduler
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Verify OpenAI API Key is loaded
openai_api_key = os.getenv('OPENAI_API_KEY')
if not openai_api_key:
    raise ValueError("OpenAI API Key is missing. Please check your .env file.")

def create_app():
    app = Flask(__name__)

    # Load configuration based on environment (development or production)
    if os.getenv('FLASK_ENV') == 'production':
        app.config.from_object(ProductionConfig)
    else:
        app.config.from_object(DevelopmentConfig)

    # Initialize database connection
    db.init_app(app)

    # Enable CORS (Frontend React app can connect)
    CORS(app, supports_credentials=True, resources={r"/*": {"origins": "http://localhost:3000"}}, methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

    # Register blueprints (Routes for different functionalities)
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(sessions_bp, url_prefix='/study_sessions')
    app.register_blueprint(chat_bp, url_prefix='/chat')

    # Start background tasks (like reminders)
    start_scheduler()

    return app

# Create and run the Flask app
app = create_app()

if __name__ == '__main__':
    app.run(debug=app.config['DEBUG'])
