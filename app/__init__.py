"""
CrowdLens - Sentiment analysis for movies, TV shows, and anime
based on public social media reviews.
"""
from flask import Flask
from dotenv import load_dotenv
import os

load_dotenv()


def create_app(test_config=None):
    """Application factory."""
    app = Flask(__name__, template_folder="templates", static_folder="static")

    app.config.from_mapping(
        SECRET_KEY=os.environ.get("SECRET_KEY", "dev-secret-key"),
        REDDIT_CLIENT_ID=os.environ.get("REDDIT_CLIENT_ID", ""),
        REDDIT_CLIENT_SECRET=os.environ.get("REDDIT_CLIENT_SECRET", ""),
        REDDIT_USER_AGENT=os.environ.get("REDDIT_USER_AGENT", "CrowdLens/1.0"),
    )

    if test_config is not None:
        app.config.update(test_config)

    from .routes import bp
    app.register_blueprint(bp)

    return app
