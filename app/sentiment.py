"""
Sentiment analysis using VADER (Valence Aware Dictionary and sEntiment Reasoner).
VADER is optimized for social media text, making it ideal for processing reviews
from Reddit, Twitter, and other platforms.
"""
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

_analyzer = SentimentIntensityAnalyzer()


def analyze_text(text: str) -> dict:
    """
    Analyze the sentiment of a single text string.

    Returns a dict with keys:
      - compound: overall score in [-1.0, +1.0]
      - pos:      proportion of positive tokens
      - neu:      proportion of neutral tokens
      - neg:      proportion of negative tokens
      - label:    'positive', 'neutral', or 'negative'
    """
    if not text or not text.strip():
        return {"compound": 0.0, "pos": 0.0, "neu": 1.0, "neg": 0.0, "label": "neutral"}

    scores = _analyzer.polarity_scores(text)
    compound = scores["compound"]

    if compound >= 0.05:
        label = "positive"
    elif compound <= -0.05:
        label = "negative"
    else:
        label = "neutral"

    return {
        "compound": round(compound, 4),
        "pos": round(scores["pos"], 4),
        "neu": round(scores["neu"], 4),
        "neg": round(scores["neg"], 4),
        "label": label,
    }


def aggregate_sentiments(texts: list[str]) -> dict:
    """
    Analyze a list of texts and return aggregated sentiment metrics.

    Returns a dict with:
      - average_compound: mean compound score in [-1.0, +1.0]
      - positive_pct:     percentage of positive texts
      - neutral_pct:      percentage of neutral texts
      - negative_pct:     percentage of negative texts
      - overall_label:    dominant sentiment label
      - review_count:     number of texts analyzed
    """
    if not texts:
        return {
            "average_compound": 0.0,
            "positive_pct": 0.0,
            "neutral_pct": 100.0,
            "negative_pct": 0.0,
            "overall_label": "neutral",
            "review_count": 0,
        }

    results = [analyze_text(t) for t in texts]
    total = len(results)

    avg_compound = sum(r["compound"] for r in results) / total
    pos_count = sum(1 for r in results if r["label"] == "positive")
    neg_count = sum(1 for r in results if r["label"] == "negative")
    neu_count = total - pos_count - neg_count

    if avg_compound >= 0.05:
        overall_label = "positive"
    elif avg_compound <= -0.05:
        overall_label = "negative"
    else:
        overall_label = "neutral"

    return {
        "average_compound": round(avg_compound, 4),
        "positive_pct": round(pos_count / total * 100, 1),
        "neutral_pct": round(neu_count / total * 100, 1),
        "negative_pct": round(neg_count / total * 100, 1),
        "overall_label": overall_label,
        "review_count": total,
    }
