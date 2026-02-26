"""
Flask routes for CrowdLens.
"""
import logging
from flask import Blueprint, jsonify, render_template, request, current_app
from .sentiment import analyze_text, aggregate_sentiments
from .fetcher import fetch_reviews, list_demo_titles

logger = logging.getLogger(__name__)
bp = Blueprint("main", __name__)


@bp.get("/")
def index():
    """Serve the main single-page application."""
    return render_template("index.html")


@bp.get("/api/titles")
def api_titles():
    """Return the list of demo titles available without Reddit credentials."""
    return jsonify({"titles": list_demo_titles()})


@bp.get("/api/analyze")
def api_analyze():
    """
    Fetch social media reviews for a title and return aggregated sentiment.

    Query parameters:
      - title (required): movie/show/anime name to analyze
      - limit (optional, default=25): max number of reviews to fetch
    """
    title = request.args.get("title", "").strip()
    if not title:
        return jsonify({"error": "title parameter is required"}), 400

    try:
        limit = int(request.args.get("limit", 25))
        limit = max(1, min(limit, 100))
    except ValueError:
        return jsonify({"error": "limit must be an integer"}), 400

    config = {
        "REDDIT_CLIENT_ID": current_app.config.get("REDDIT_CLIENT_ID", ""),
        "REDDIT_CLIENT_SECRET": current_app.config.get("REDDIT_CLIENT_SECRET", ""),
        "REDDIT_USER_AGENT": current_app.config.get("REDDIT_USER_AGENT", "CrowdLens/1.0"),
    }

    reviews = fetch_reviews(title, config=config, limit=limit)

    if not reviews:
        return jsonify({"error": f"No reviews found for '{title}'"}), 404

    sentiment = aggregate_sentiments(reviews)
    return jsonify({
        "title": title,
        "sentiment": sentiment,
        "reviews": reviews,
    })


@bp.get("/api/trending")
def api_trending():
    """
    Return sentiment rankings for all demo titles, sorted by average compound score.
    """
    titles = list_demo_titles()
    results = []

    for title in titles:
        reviews = fetch_reviews(title)
        sentiment = aggregate_sentiments(reviews)
        results.append({
            "title": title,
            "sentiment": sentiment,
        })

    # Sort by average compound score descending (highest ranked first)
    results.sort(key=lambda x: x["sentiment"]["average_compound"], reverse=True)

    for rank, item in enumerate(results, start=1):
        item["rank"] = rank

    return jsonify({"rankings": results})


@bp.post("/api/analyze_text")
def api_analyze_text():
    """
    Analyze the sentiment of a single piece of text provided in the request body.

    Request JSON:
      { "text": "..." }
    """
    data = request.get_json(silent=True)
    if not data or "text" not in data:
        return jsonify({"error": "JSON body with 'text' field is required"}), 400

    text = str(data["text"]).strip()
    if not text:
        return jsonify({"error": "text must not be empty"}), 400

    result = analyze_text(text)
    return jsonify({"text": text, "sentiment": result})
