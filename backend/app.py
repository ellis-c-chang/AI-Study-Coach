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
from backend.routes.study_groups import groups_bp
from backend.config import DevelopmentConfig, ProductionConfig
from backend.utils.scheduler import start_scheduler
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Verify OpenAI API Key is loaded
openai_api_key = os.getenv('OPENAI_API_KEY')
if not openai_api_key:
    raise ValueError("OpenAI API Key is missing. Please check your .env file.")

def create_app():
    app = Flask(__name__)

    # Load configuration based on environment
    if os.getenv('FLASK_ENV') == 'production':
        app.config.from_object(ProductionConfig)
    else:
        app.config.from_object(DevelopmentConfig)

    # Initialize database connection
    db.init_app(app)
    Migrate(app, db)

    # Enable CORS immediately after app is created
    CORS(
    app,
    supports_credentials=True,          
    resources={r"/*": {"origins": [
        "http://localhost:3000",        # React dev server
        "http://127.0.0.1:3000"
    ]}},
    expose_headers="*",                 
    allow_headers="*"                   
)




    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(sessions_bp, url_prefix='/study_sessions')
    app.register_blueprint(chat_bp, url_prefix='/chat')
    app.register_blueprint(kanban_bp, url_prefix='/tasks')
    app.register_blueprint(groups_bp, url_prefix='/groups')  

    # Start background tasks
    start_scheduler(app)

    return app

# Create and run the Flask app
app = create_app()

if __name__ == '__main__':
    app.run(host='localhost', port=5000, debug=True)
