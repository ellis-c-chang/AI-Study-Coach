import os
from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from dotenv import load_dotenv

from backend.database import db
from backend.database import models           # noqa: F401  (ensure models are imported)
from backend.routes.auth import auth_bp
from backend.routes.study_sessions import sessions_bp
from backend.routes.chat import chat_bp
from backend.routes.kanban import kanban_bp
from backend.routes.study_groups import groups_bp
from backend.routes.onboarding import onboarding_bp
from backend.routes.gamification import gamification_bp, initialize_achievements
from backend.config import DevelopmentConfig, ProductionConfig
from backend.utils.scheduler import start_scheduler

load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OpenAI API Key is missing. Please check your .env file.")


def create_app() -> Flask:
    app = Flask(__name__)

    if os.getenv("FLASK_ENV") == "production":
        app.config.from_object(ProductionConfig)
    else:
        app.config.from_object(DevelopmentConfig)

    db.init_app(app)
    Migrate(app, db)

    CORS(
    app,
    supports_credentials=True,
    origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",

        # Vercel =
        "https://ai-study-coach.vercel.app"
    ],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"]
)

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(sessions_bp, url_prefix="/study_sessions")
    app.register_blueprint(chat_bp, url_prefix="/chat")
    app.register_blueprint(kanban_bp, url_prefix="/tasks")
    app.register_blueprint(groups_bp, url_prefix="/groups")
    app.register_blueprint(onboarding_bp, url_prefix="/onboarding")
    app.register_blueprint(gamification_bp, url_prefix="/gamification")

    with app.app_context():
        initialize_achievements()

    start_scheduler(app)

    return app


app = create_app()

if __name__ != "__main__":
    with app.app_context():
        try:
            db.create_all()
        except Exception as exc:  # pragma: no cover
            print(f"[warn] create_all failed: {exc}")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=app.config["DEBUG"], use_reloader=False)
