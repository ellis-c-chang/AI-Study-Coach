import os
from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from dotenv import load_dotenv

# ── internal imports ──────────────────────────────────────────────────────────
from backend.database import db
from backend.database import models                        # noqa: F401
from backend.routes.auth import auth_bp
from backend.routes.study_sessions import sessions_bp
from backend.routes.chat import chat_bp
from backend.routes.kanban import kanban_bp
from backend.routes.study_groups import groups_bp
from backend.routes.onboarding import onboarding_bp
from backend.routes.gamification import gamification_bp, initialize_achievements
from backend.config import DevelopmentConfig, ProductionConfig
from backend.utils.scheduler import start_scheduler
# ──────────────────────────────────────────────────────────────────────────────

load_dotenv()

# --- sanity-check OPENAI key --------------------------------------------------
if not os.getenv("OPENAI_API_KEY"):
    raise ValueError("OpenAI API Key is missing. Please check your .env file.")

# ── factory ───────────────────────────────────────────────────────────────────
def create_app() -> Flask:
    app = Flask(__name__)

    # choose config
    env_cfg = ProductionConfig if os.getenv("FLASK_ENV") == "production" else DevelopmentConfig
    app.config.from_object(env_cfg)

    # db + migrations
    db.init_app(app)
    Migrate(app, db)

    # ---------- CORS ----------
    CORS(
        app,
        supports_credentials=True,
        origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://ai-study-coach.vercel.app",
        ],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )

    # ---------- blueprints ----------
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(sessions_bp, url_prefix="/study_sessions")
    app.register_blueprint(chat_bp, url_prefix="/chat")
    app.register_blueprint(kanban_bp, url_prefix="/tasks")
    app.register_blueprint(groups_bp, url_prefix="/groups")
    app.register_blueprint(onboarding_bp, url_prefix="/onboarding")
    app.register_blueprint(gamification_bp, url_prefix="/gamification")

    # ---------- one-time init ----------
    with app.app_context():
        initialize_achievements()

    # ---------- background jobs ----------
    start_scheduler(app)

    return app


app = create_app()

# If imported by WSGI server, ensure tables exist (safe for prod: wrapped in try)
if __name__ != "__main__":
    with app.app_context():
        try:
            db.create_all()
        except Exception as exc:  # pragma: no cover
            print(f"[warn] create_all failed: {exc}")

# Local run
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=app.config["DEBUG"], use_reloader=False)
