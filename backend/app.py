import os
from flask import Flask, request
from flask_cors import CORS
from flask_migrate import Migrate, upgrade
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
    migrations_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'migrations')
    Migrate(app, db, directory=migrations_dir)

    # Enable CORS (Frontend React app can connect)
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', 'https://ai-study-coach.vercel.app')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

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

if __name__ != '__main__':
    with app.app_context():
        db.create_all()
        upgrade()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=app.config['DEBUG'], use_reloader=False)
