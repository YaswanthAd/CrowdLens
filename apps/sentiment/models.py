from django.db import models


class SentimentMention(models.Model):
    class Source(models.TextChoices):
        REDDIT = "reddit", "Reddit"
        TWITTER = "twitter", "Twitter/X"
        YOUTUBE = "youtube", "YouTube"

    class Sentiment(models.TextChoices):
        POSITIVE = "positive", "Positive"
        NEGATIVE = "negative", "Negative"
        NEUTRAL = "neutral", "Neutral"
        MIXED = "mixed", "Mixed"

    title = models.ForeignKey("titles.Title", on_delete=models.CASCADE, related_name="mentions")

    source = models.CharField(max_length=20, choices=Source.choices, db_index=True)
    source_id = models.CharField(max_length=200)
    source_url = models.URLField(blank=True)
    author = models.CharField(max_length=200, blank=True)
    subreddit = models.CharField(max_length=100, blank=True)
    post_type = models.CharField(max_length=20, blank=True)

    text = models.TextField()
    text_length = models.PositiveIntegerField(default=0)

    sentiment = models.CharField(max_length=10, choices=Sentiment.choices, blank=True, db_index=True)
    sentiment_score = models.FloatField(null=True, blank=True)
    positive_score = models.FloatField(null=True, blank=True)
    negative_score = models.FloatField(null=True, blank=True)
    neutral_score = models.FloatField(null=True, blank=True)
    confidence = models.FloatField(null=True, blank=True)

    upvotes = models.IntegerField(default=0)
    downvotes = models.IntegerField(default=0)
    reply_count = models.IntegerField(default=0)

    is_processed = models.BooleanField(default=False, db_index=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    posted_at = models.DateTimeField(null=True, blank=True)
    scraped_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "sentiment_mentions"
        unique_together = ("source", "source_id")
        ordering = ["-scraped_at"]
        indexes = [
            models.Index(fields=["title", "source", "-posted_at"]),
            models.Index(fields=["title", "sentiment"]),
            models.Index(fields=["is_processed", "-scraped_at"]),
        ]

    def __str__(self):
        label = self.sentiment or "unprocessed"
        return f"[{self.source}] {self.title.title}: {label} ({self.text[:50]}...)"


class SentimentSnapshot(models.Model):
    class Period(models.TextChoices):
        DAILY = "daily", "Daily"
        WEEKLY = "weekly", "Weekly"
        MONTHLY = "monthly", "Monthly"
        ALL_TIME = "all_time", "All Time"

    title = models.ForeignKey("titles.Title", on_delete=models.CASCADE, related_name="sentiment_snapshots")
    period = models.CharField(max_length=20, choices=Period.choices)
    snapshot_date = models.DateField()

    positive_count = models.PositiveIntegerField(default=0)
    negative_count = models.PositiveIntegerField(default=0)
    neutral_count = models.PositiveIntegerField(default=0)
    mixed_count = models.PositiveIntegerField(default=0)
    total_mentions = models.PositiveIntegerField(default=0)

    positive_pct = models.FloatField(default=0)
    negative_pct = models.FloatField(default=0)
    neutral_pct = models.FloatField(default=0)

    avg_sentiment_score = models.FloatField(default=0)
    senti_score = models.FloatField(default=0)

    reddit_mentions = models.PositiveIntegerField(default=0)
    twitter_mentions = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "sentiment_snapshots"
        unique_together = ("title", "period", "snapshot_date")
        ordering = ["-snapshot_date"]
        indexes = [
            models.Index(fields=["title", "period", "-snapshot_date"]),
        ]

    def __str__(self):
        return f"{self.title.title} [{self.period}] {self.snapshot_date}: {self.senti_score:.0f}%"


class ScrapeJob(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        RUNNING = "running", "Running"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    title = models.ForeignKey("titles.Title", on_delete=models.CASCADE, null=True, blank=True, related_name="scrape_jobs")
    source = models.CharField(max_length=20, choices=SentimentMention.Source.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    query = models.CharField(max_length=500)

    mentions_found = models.PositiveIntegerField(default=0)
    mentions_new = models.PositiveIntegerField(default=0)
    error_message = models.TextField(blank=True)

    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "scrape_jobs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.source}] {self.query} — {self.status}"
