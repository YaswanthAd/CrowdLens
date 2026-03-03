"""
Management command: seed_sentiment

Seeds SentiScores for all titles by running VADER sentiment analysis
on existing user reviews — no Reddit/Twitter API needed.

Usage:
    SQLITE=1 python manage.py seed_sentiment
    SQLITE=1 python manage.py seed_sentiment --title-id 42
    SQLITE=1 python manage.py seed_sentiment --clear
"""
import logging
from django.core.management.base import BaseCommand
from django.utils import timezone

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Seed SentiScores from user review text using VADER"

    def add_arguments(self, parser):
        parser.add_argument(
            "--title-id",
            type=int,
            help="Only process a specific title ID",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear all review-sourced mentions first, then re-seed",
        )

    def handle(self, *args, **options):
        from apps.reviews.models import Review
        from apps.sentiment.models import SentimentMention
        from apps.sentiment.services import analyze_text, compute_title_sentiment
        from apps.titles.models import Title

        if options["clear"]:
            deleted, _ = SentimentMention.objects.filter(source="review").delete()
            self.stdout.write(self.style.WARNING(f"Cleared {deleted} review-sourced mentions"))

        # Filter reviews to process
        reviews_qs = Review.objects.filter(review_text__isnull=False).exclude(review_text="")
        if options["title_id"]:
            reviews_qs = reviews_qs.filter(title_id=options["title_id"])

        total = reviews_qs.count()
        self.stdout.write(f"Processing {total} reviews...")

        created_count = 0
        for review in reviews_qs.select_related("title"):
            source_id = f"review-{review.id}"

            # Skip if already seeded
            if SentimentMention.objects.filter(source="review", source_id=source_id).exists():
                continue

            result = analyze_text(review.review_text)

            # Weight by star rating: high-rated reviews boost positive sentiment
            # rating is 0.5–5.0; map to -1..+1 as a secondary signal
            if review.rating:
                rating_signal = (review.rating - 2.5) / 2.5  # -1 to +1
                blended_score = (result["compound"] * 0.7) + (rating_signal * 0.3)
            else:
                blended_score = result["compound"]

            # Reclassify based on blended score
            if blended_score >= 0.05:
                sentiment = "positive"
            elif blended_score <= -0.05:
                sentiment = "negative"
            else:
                sentiment = "neutral"

            SentimentMention.objects.create(
                title=review.title,
                source="review",
                source_id=source_id,
                author=review.user.username if review.user else "anonymous",
                text=review.review_text,
                text_length=len(review.review_text.split()),
                sentiment=sentiment,
                sentiment_score=round(blended_score, 4),
                positive_score=result["positive"],
                negative_score=result["negative"],
                neutral_score=result["neutral"],
                confidence=result["confidence"],
                upvotes=max(0, review.likes_count) if hasattr(review, "likes_count") else 0,
                is_processed=True,
                processed_at=timezone.now(),
                posted_at=review.created_at,
            )
            created_count += 1

        self.stdout.write(self.style.SUCCESS(f"Created {created_count} sentiment mentions"))

        # Now recompute SentiScores for affected titles
        if options["title_id"]:
            title_ids = [options["title_id"]]
        else:
            title_ids = list(
                SentimentMention.objects.filter(source="review")
                .values_list("title_id", flat=True)
                .distinct()
            )

        self.stdout.write(f"Recomputing SentiScores for {len(title_ids)} titles...")
        scored = 0
        for title_id in title_ids:
            result = compute_title_sentiment(title_id)
            if result:
                scored += 1
                self.stdout.write(
                    f"  {result['title']}: {result['senti_score']:.0f} "
                    f"({result['positive_pct']:.0f}% pos, "
                    f"{result['negative_pct']:.0f}% neg, "
                    f"{result['total_mentions']} mentions)"
                )

        self.stdout.write(self.style.SUCCESS(f"Done. {scored} titles now have SentiScores."))
