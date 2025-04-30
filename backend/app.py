import os
from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from dotenv import load_dotenv

from backend.database import db
from backend.database import models  # noqa
from backend.routes.auth import auth_bp
from backend.routes.study_sessions import sessions_bp
from backend.routes.chat import chat_bp
from backend.routes.kanban import kanban_bp
from backend.routes.study_groups import groups_bp
from backend.routes.onboarding import onboarding_bp
from backend.routes.gamification import gamification_bp, initialize_achievements
from backend.config import DevelopmentConfig, ProductionConfig
from backend.utils.scheduler import start_scheduler

# Load environment variables
load_dotenv()

# Verify OpenAI API Key
if not os.getenv('OPENAI_API_KEY'):
    raise ValueError("OpenAI API Key is missing. Please check your .env file.")

def create_app():
    app = Flask(__name__)

    # Load configuration
    if os.getenv('FLASK_ENV') == 'production':
        app.config.from_object(ProductionConfig)
    else:
        app.config.from_object(DevelopmentConfig)

    # Initialize database
    db.init_app(app)
    Migrate(app, db)

    # Enable CORS for both local and Vercel frontend
    CORS(
        app,
        supports_credentials=True,
        origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://ai-study-coach.vercel.app"
        ],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"]
    )

    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(sessions_bp, url_prefix='/study_sessions')
    app.register_blueprint(chat_bp, url_prefix='/chat')
    app.register_blueprint(kanban_bp, url_prefix='/kanban')
    app.register_blueprint(groups_bp, url_prefix='/groups')
    app.register_blueprint(onboarding_bp, url_prefix='/onboarding')
    app.register_blueprint(gamification_bp, url_prefix='/gamification')

    # Start background tasks
    start_scheduler(app)

    return app


# Create app instance
app = create_app()

# Production WSGI (e.g. gunicorn, Render, etc.)
if __name__ != '__main__':
    with app.app_context():
        try:
            db.create_all()
            print("✅ Database tables created successfully")
        except Exception as e:
            print(f"❌ Error creating database tables: {e}")

# Local development run
if __name__ == '__main__':
    with app.app_context():
        initialize_achievements()
    app.run(host='0.0.0.0', port=5000, debug=app.config['DEBUG'], use_reloader=False)
