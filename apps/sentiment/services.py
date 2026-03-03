import logging
from django.db.models import Count
from django.utils import timezone

logger = logging.getLogger(__name__)

MIN_MENTIONS_FOR_SCORE = 3
CONFIDENCE_THRESHOLD = 50


def analyze_text(text):
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

    analyzer = SentimentIntensityAnalyzer()
    scores = analyzer.polarity_scores(text)
    compound = scores["compound"]

    if compound >= 0.05:
        sentiment = "positive"
    elif compound <= -0.05:
        sentiment = "negative"
    else:
        if scores["pos"] > 0.2 and scores["neg"] > 0.2:
            sentiment = "mixed"
        else:
            sentiment = "neutral"

    text_len_factor = min(len(text.split()) / 20, 1.0)
    score_strength = abs(compound)
    confidence = (text_len_factor * 0.4) + (score_strength * 0.6)

    return {
        "sentiment": sentiment,
        "compound": compound,
        "positive": scores["pos"],
        "negative": scores["neg"],
        "neutral": scores["neu"],
        "confidence": round(confidence, 3),
    }


def process_unanalyzed_mentions(batch_size=100):
    from apps.sentiment.models import SentimentMention

    mentions = SentimentMention.objects.filter(is_processed=False)[:batch_size]
    count = 0

    for mention in mentions:
        try:
            result = analyze_text(mention.text)
            mention.sentiment = result["sentiment"]
            mention.sentiment_score = result["compound"]
            mention.positive_score = result["positive"]
            mention.negative_score = result["negative"]
            mention.neutral_score = result["neutral"]
            mention.confidence = result["confidence"]
            mention.is_processed = True
            mention.processed_at = timezone.now()
            mention.save()
            count += 1
        except Exception as e:
            logger.error(f"Failed to analyze mention {mention.id}: {e}")

    return count


def compute_title_sentiment(title_id):
    from apps.titles.models import Title
    from apps.sentiment.models import SentimentMention, SentimentSnapshot

    title = Title.objects.get(id=title_id)
    mentions = SentimentMention.objects.filter(title=title, is_processed=True)

    total = mentions.count()
    if total < MIN_MENTIONS_FOR_SCORE:
        return None

    counts = mentions.values("sentiment").annotate(count=Count("id"))
    count_map = {item["sentiment"]: item["count"] for item in counts}

    positive_count = count_map.get("positive", 0)
    negative_count = count_map.get("negative", 0)
    neutral_count = count_map.get("neutral", 0)
    mixed_count = count_map.get("mixed", 0)

    positive_pct = (positive_count / total) * 100
    negative_pct = (negative_count / total) * 100
    neutral_pct = (neutral_count / total) * 100

    weighted_sum = 0
    weight_total = 0
    for m in mentions.filter(sentiment_score__isnull=False):
        weight = max(1, m.upvotes + m.reply_count)
        weighted_sum += m.sentiment_score * weight
        weight_total += weight

    avg_weighted_score = weighted_sum / weight_total if weight_total > 0 else 0
    base_score = ((avg_weighted_score + 1) / 2) * 100
    confidence = min(total / CONFIDENCE_THRESHOLD, 1.0)
    final_score = (base_score * confidence) + (50 * (1 - confidence))
    final_score = round(max(0, min(100, final_score)), 1)

    reddit_count = mentions.filter(source="reddit").count()
    twitter_count = mentions.filter(source="twitter").count()

    title.senti_score = final_score
    title.senti_positive_pct = round(positive_pct, 1)
    title.senti_negative_pct = round(negative_pct, 1)
    title.senti_neutral_pct = round(neutral_pct, 1)
    title.senti_total_mentions = total
    title.senti_last_updated = timezone.now()
    title.save(update_fields=[
        "senti_score", "senti_positive_pct", "senti_negative_pct",
        "senti_neutral_pct", "senti_total_mentions", "senti_last_updated",
    ])

    today = timezone.now().date()
    SentimentSnapshot.objects.update_or_create(
        title=title,
        period=SentimentSnapshot.Period.DAILY,
        snapshot_date=today,
        defaults={
            "positive_count": positive_count,
            "negative_count": negative_count,
            "neutral_count": neutral_count,
            "mixed_count": mixed_count,
            "total_mentions": total,
            "positive_pct": round(positive_pct, 1),
            "negative_pct": round(negative_pct, 1),
            "neutral_pct": round(neutral_pct, 1),
            "avg_sentiment_score": round(avg_weighted_score, 3),
            "senti_score": final_score,
            "reddit_mentions": reddit_count,
            "twitter_mentions": twitter_count,
        },
    )

    return {
        "title": title.title,
        "senti_score": final_score,
        "positive_pct": round(positive_pct, 1),
        "negative_pct": round(negative_pct, 1),
        "neutral_pct": round(neutral_pct, 1),
        "total_mentions": total,
        "confidence": round(confidence, 2),
    }
