import os
from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from dotenv import load_dotenv

from backend.database import db
from backend.database import models  # noqa: F401
from backend.routes.auth import auth_bp
from backend.routes.study_sessions import sessions_bp
from backend.routes.chat import chat_bp
from backend.routes.kanban import kanban_bp
from backend.routes.onboarding import onboarding_bp
from backend.routes.gamification import gamification_bp, initialize_achievements
from backend.config import DevelopmentConfig, ProductionConfig
from backend.utils.scheduler import start_scheduler

# Load environment variables
load_dotenv()

# Ensure OpenAI API key is present
openai_api_key = os.getenv('OPENAI_API_KEY')
if not openai_api_key:
    raise ValueError("OpenAI API Key is missing. Please check your .env file.")

def create_app():
    app = Flask(__name__)

    # Config
    if os.getenv('FLASK_ENV') == 'production':
        app.config.from_object(ProductionConfig)
    else:
        app.config.from_object(DevelopmentConfig)

    # Database
    db.init_app(app)
    Migrate(app, db)

   CORS(app,
     supports_credentials=True,
     origins=[
         "http://localhost:3000",
         "http://127.0.0.1:3000",
         "https://ai-study-coach.vercel.app",
         "https://ai-study-coach-git-ltest-ellis-changs-projects.vercel.app",  # ✅ ltest branch
         "https://ai-study-coach-git-preview-deploy-ellis-changs-projects.vercel.app",  # ✅ preview deploy branch
     ],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"]
)


    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(sessions_bp, url_prefix='/study_sessions')
    app.register_blueprint(chat_bp, url_prefix='/chat')
    app.register_blueprint(kanban_bp, url_prefix='/kanban')
    app.register_blueprint(onboarding_bp, url_prefix='/onboarding')
    app.register_blueprint(gamification_bp, url_prefix='/gamification')

    # One-time setup
    with app.app_context():
        initialize_achievements()

    # Start background jobs
    start_scheduler(app)

    return app

# App instance
app = create_app()

if __name__ != '__main__':
    with app.app_context():
        try:
            db.create_all()
            print("Database tables created successfully")
        except Exception as e:
            print(f"Error creating database tables: {e}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=app.config['DEBUG'], use_reloader=False)
