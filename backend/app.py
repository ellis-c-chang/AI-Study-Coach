import os
from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from dotenv import load_dotenv

from backend.database import db
from backend.database import models
from backend.routes.auth import auth_bp
from backend.routes.study_sessions import sessions_bp
from backend.routes.chat import chat_bp
from backend.routes.kanban import kanban_bp
from backend.routes.onboarding import onboarding_bp
from backend.routes.gamification import gamification_bp
from backend.routes.gamification import initialize_achievements
from backend.config import DevelopmentConfig, ProductionConfig
from backend.utils.scheduler import start_scheduler

# Load environment variables
load_dotenv()

# Ensure OpenAI API key is set
if not os.getenv('OPENAI_API_KEY'):
    raise ValueError("OpenAI API Key is missing. Please check your .env file.")

def create_app():
    app = Flask(__name__)

    # Load appropriate config
    if os.getenv('FLASK_ENV') == 'production':
        app.config.from_object(ProductionConfig)
    else:
        app.config.from_object(DevelopmentConfig)

    # Initialize DB
    db.init_app(app)
    Migrate(app, db)

    # ✅ Proper CORS (let frontend call backend)
    CORS(app, origins=["https://ai-study-coach.vercel.app", "https://ai-study-coach.onrender.com"], supports_credentials=True)

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(sessions_bp, url_prefix='/study_sessions')
    app.register_blueprint(chat_bp, url_prefix='/chat')
    app.register_blueprint(kanban_bp, url_prefix='/kanban')
    app.register_blueprint(gamification_bp, url_prefix='/gamification')
    app.register_blueprint(onboarding_bp, url_prefix='/onboarding')

    # Background scheduler
    start_scheduler(app)

    return app

# Create app instance
app = create_app()

# For Render / WSGI
if __name__ != '__main__':
    with app.app_context():
        try:
            db.create_all()
            print("✅ Database tables created successfully")
        except Exception as e:
            print(f"❌ Error creating database tables: {e}")

# Local dev (manual run)
if __name__ == '__main__':
    with app.app_context():
        initialize_achievements()
    app.run(host='0.0.0.0', port=5000, debug=app.config['DEBUG'], use_reloader=False)
