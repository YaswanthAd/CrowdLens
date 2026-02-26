from rest_framework import serializers
from .models import SentimentMention, SentimentSnapshot, ScrapeJob


class SentimentMentionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SentimentMention
        fields = [
            "id", "title", "source", "source_url", "author", "subreddit",
            "text", "sentiment", "sentiment_score",
            "positive_score", "negative_score", "neutral_score",
            "upvotes", "reply_count", "posted_at",
        ]


class SentimentSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = SentimentSnapshot
        fields = [
            "id", "title", "period", "snapshot_date",
            "positive_count", "negative_count", "neutral_count",
            "total_mentions", "positive_pct", "negative_pct", "neutral_pct",
            "senti_score", "reddit_mentions", "twitter_mentions",
        ]


class ScrapeJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScrapeJob
        fields = "__all__"
