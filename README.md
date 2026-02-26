# CrowdLens 🎬

**Rank movies, TV shows, and anime based on crowd sentiment from social media reviews.**

CrowdLens aggregates public reviews (Reddit and a built-in demo dataset) and applies
[VADER](https://github.com/cjhutto/vaderSentiment) sentiment analysis — a model
purpose-built for short, informal social-media text — to produce a ranked leaderboard
with compound sentiment scores.

---

## Features

- 🏆 **Trending Rankings** — all titles ranked by average crowd sentiment score
- 🔍 **Per-title Analysis** — search any movie/show/anime to see its full sentiment breakdown
- 📊 **Sentiment Breakdown** — positive %, neutral %, and negative % per title
- 🌐 **Reddit Integration** — live review fetching via the Reddit API (optional)
- 🗃️ **Demo Dataset** — works out of the box with no API keys required
- 🛠️ **REST API** — fully JSON-based backend, easy to integrate with other tools

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Web framework | Flask 3 |
| Sentiment analysis | VADER (`vaderSentiment`) |
| Social media data | Reddit API via PRAW |
| Frontend | Vanilla HTML/CSS/JS |
| Testing | pytest + pytest-flask |

---

## Quick Start

### 1. Clone & install dependencies

```bash
git clone https://github.com/YaswanthAd/CrowdLens.git
cd CrowdLens
pip install -r requirements.txt
```

### 2. Configure (optional — Reddit credentials)

```bash
cp .env.example .env
# Edit .env and fill in your Reddit API credentials
# The app works without credentials using the built-in demo dataset
```

To get Reddit credentials, create an app at <https://www.reddit.com/prefs/apps>.

### 3. Run the application

```bash
python wsgi.py
```

Open your browser at **http://localhost:5000**

---

## API Reference

All endpoints return JSON.

### `GET /api/trending`
Returns sentiment rankings for all demo titles, sorted by score descending.

```json
{
  "rankings": [
    {
      "rank": 1,
      "title": "Dune: Part Two",
      "sentiment": {
        "average_compound": 0.3901,
        "positive_pct": 80.0,
        "neutral_pct": 10.0,
        "negative_pct": 10.0,
        "overall_label": "positive",
        "review_count": 10
      }
    }
  ]
}
```

### `GET /api/analyze?title=<title>&limit=<n>`
Fetch reviews and sentiment for a specific title.

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `title`   | ✅        | —       | Movie/show/anime name |
| `limit`   | ❌        | 25      | Max reviews to fetch (1–100) |

### `POST /api/analyze_text`
Analyse the sentiment of a single piece of text.

**Request body:** `{ "text": "This movie is absolutely brilliant!" }`

**Response:**
```json
{
  "text": "This movie is absolutely brilliant!",
  "sentiment": {
    "compound": 0.6249,
    "pos": 0.534,
    "neu": 0.466,
    "neg": 0.0,
    "label": "positive"
  }
}
```

### `GET /api/titles`
Returns the list of all built-in demo titles.

---

## Running Tests

```bash
python -m pytest -v
```

---

## Project Structure

```
CrowdLens/
├── app/
│   ├── __init__.py       # Flask application factory
│   ├── routes.py         # API and page routes
│   ├── sentiment.py      # VADER sentiment analysis helpers
│   ├── fetcher.py        # Reddit + demo-dataset review fetcher
│   ├── templates/
│   │   └── index.html    # Single-page frontend
│   └── static/
│       ├── css/style.css
│       └── js/app.js
├── tests/
│   ├── test_sentiment.py
│   ├── test_routes.py
│   └── test_fetcher.py
├── wsgi.py               # Application entry point
├── requirements.txt
├── pytest.ini
└── .env.example
```
