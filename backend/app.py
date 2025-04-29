import os
from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from backend.database import db
from backend.database import models
from backend.routes.auth import auth_bp
from backend.routes.study_sessions import sessions_bp
from backend.routes.chat import chat_bp
from backend.routes.kanban import kanban_bp
from backend.routes.onboarding import onboarding_bp
from backend.routes.gamification import gamification_bp  # Import gamification routes
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
    # if os.getenv('FLASK_ENV') == 'production':
    #     with app.app_context():
    #         db.create_all()  # Create database tables if they don't exist
    #         upgrade()
    if os.getenv('FLASK_ENV') == 'production':
        app.config.from_object(ProductionConfig)
    else:
        app.config.from_object(DevelopmentConfig)

    # Initialize database connection
    db.init_app(app)
    Migrate(app, db)

    # Enable CORS (Frontend React app can connect)
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    allowed_origins = [
        frontend_url, 
        'http://localhost:3000', 
        'http://ai-study-coach.vercel.app'
    ]
    allowed_origins = list(set([origin for origin in allowed_origins if origin]))
    CORS(app, supports_credentials=True, resources={r"/*": {"origins": allowed_origins}}, methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

    # Register blueprints (Routes for different functionalities)
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(sessions_bp, url_prefix='/study_sessions')
    app.register_blueprint(chat_bp, url_prefix='/chat')
    app.register_blueprint(kanban_bp, url_prefix='/tasks')  # Register Kanban routes
    app.register_blueprint(gamification_bp, url_prefix='/gamification')  # Register gamification routes
    app.register_blueprint(onboarding_bp, url_prefix='/onboarding')

    # Start background tasks (like reminders)
    start_scheduler(app)

    return app

# Create and run the Flask app
app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=app.config['DEBUG'], use_reloader=False)
    with app.app_context():
        db.create_all()
        upgrade()

