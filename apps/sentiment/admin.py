from django.contrib import admin
from .models import SentimentMention, SentimentSnapshot, ScrapeJob

@admin.register(SentimentMention)
class SentimentMentionAdmin(admin.ModelAdmin):
    list_display = ["title", "source", "sentiment", "sentiment_score", "is_processed", "posted_at"]
    list_filter = ["source", "sentiment", "is_processed"]

@admin.register(SentimentSnapshot)
class SentimentSnapshotAdmin(admin.ModelAdmin):
    list_display = ["title", "period", "snapshot_date", "senti_score", "total_mentions"]
    list_filter = ["period"]

@admin.register(ScrapeJob)
class ScrapeJobAdmin(admin.ModelAdmin):
    list_display = ["title", "source", "status", "mentions_found", "created_at"]
    list_filter = ["source", "status"]
