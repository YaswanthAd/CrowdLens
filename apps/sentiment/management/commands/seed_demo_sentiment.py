"""
Management command: seed_demo_sentiment

Generates realistic fake Reddit mentions + sentiment scores for titles
so the frontend has data to display during development.

Usage:
    SQLITE=1 python manage.py seed_demo_sentiment
    SQLITE=1 python manage.py seed_demo_sentiment --titles 20 --mentions 15
    SQLITE=1 python manage.py seed_demo_sentiment --clear
"""

import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone


# Realistic Reddit-style comment templates per sentiment
POSITIVE_TEMPLATES = [
    "Just finished watching {title} and honestly it blew me away. The storytelling is top-notch.",
    "I can't believe how good {title} is. Binged the whole thing in one sitting.",
    "{title} is easily one of the best things I've watched this year. Highly recommend.",
    "The animation quality in {title} is absolutely stunning. Every frame is a work of art.",
    "Finally got around to watching {title} and wow, it lived up to the hype and then some.",
    "Rewatching {title} for the third time. It gets better every rewatch.",
    "{title} has some of the best character development I've ever seen in this genre.",
    "The soundtrack in {title} is phenomenal. It perfectly complements every scene.",
    "I'm obsessed with {title}. The world-building is incredibly detailed.",
    "Can we talk about how underrated {title} is? Deserves way more attention.",
]

NEGATIVE_TEMPLATES = [
    "{title} was honestly such a letdown. The pacing was all over the place.",
    "I wanted to like {title} but the writing just isn't there. Very disappointing.",
    "Dropped {title} after a few episodes. Couldn't get into it at all.",
    "The ending of {title} completely ruined everything they built up. What a waste.",
    "{title} feels like a cash grab. Zero originality or effort put into the story.",
    "Am I the only one who thinks {title} is overrated? The characters are so flat.",
    "{title} had potential but squandered it with terrible pacing and forced drama.",
    "The dialogue in {title} is cringe-worthy. Nobody talks like that in real life.",
]

NEUTRAL_TEMPLATES = [
    "{title} is decent. Not amazing, not terrible. Worth a watch if you have time.",
    "Just watched {title}. It's okay I guess. Some good moments, some boring parts.",
    "{title} has its moments but overall it's pretty average for the genre.",
    "Mixed feelings on {title}. The premise is interesting but the execution is uneven.",
    "I can see why people like {title} but it's not really my thing. Solid 6/10.",
    "{title} is a standard entry in the genre. Nothing groundbreaking but competent enough.",
]

SUBREDDITS = [
    "anime", "television", "movies", "TrueFilm", "flicks",
    "MovieSuggestions", "animesuggest", "kdrama", "horror",
    "scifi", "fantasy", "NetflixBestOf", "hulu",
]

USERNAMES = [
    "cinephile_99", "binge_watcher", "film_nerd", "couch_critic",
    "screen_sage", "reel_talk", "plot_twist_fan", "genre_hopper",
    "midnight_viewer", "casual_watcher", "deep_diver", "frame_by_frame",
    "the_reviewer", "hot_takes_only", "stream_surfer", "popcorn_addict",
    "watch_list_zero", "subtitle_reader", "dub_enjoyer", "weekly_binger",
]


class Command(BaseCommand):
    help = "Seed demo sentiment mentions and scores for development"

    def add_arguments(self, parser):
        parser.add_argument(
            "--titles",
            type=int,
            default=50,
            help="Number of titles to seed (default: 50, picks randomly)",
        )
        parser.add_argument(
            "--mentions",
            type=int,
            default=12,
            help="Average mentions per title (default: 12)",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear all demo-sourced mentions first",
        )

    def handle(self, *args, **options):
        from apps.sentiment.models import SentimentMention
        from apps.sentiment.services import analyze_text, compute_title_sentiment
        from apps.titles.models import Title

        if options["clear"]:
            deleted, _ = SentimentMention.objects.filter(
                source_id__startswith="demo-"
            ).delete()
            # Also reset title scores
            Title.objects.filter(senti_score__isnull=False).update(
                senti_score=None,
                senti_positive_pct=None,
                senti_negative_pct=None,
                senti_neutral_pct=None,
                senti_total_mentions=0,
                senti_last_updated=None,
            )
            self.stdout.write(self.style.WARNING(f"Cleared {deleted} demo mentions + reset title scores"))

        # Pick titles
        all_titles = list(Title.objects.all())
        if not all_titles:
            self.stdout.write(self.style.ERROR("No titles in database. Import some first."))
            return

        count = min(options["titles"], len(all_titles))
        titles = random.sample(all_titles, count)
        avg_mentions = options["mentions"]

        self.stdout.write(f"Seeding ~{avg_mentions} mentions for {count} titles...")

        now = timezone.now()
        created_total = 0

        for title in titles:
            # Vary mention count per title (avg_mentions ± 40%)
            n = max(4, int(avg_mentions * random.uniform(0.6, 1.4)))

            # Give each title a sentiment "personality" — some are loved, some are hated
            bias = random.choice(["positive", "positive", "mixed", "negative"])
            if bias == "positive":
                weights = (0.60, 0.15, 0.25)  # pos, neg, neu
            elif bias == "negative":
                weights = (0.20, 0.50, 0.30)
            else:
                weights = (0.35, 0.30, 0.35)

            for i in range(n):
                source_id = f"demo-{title.id}-{i}"
                if SentimentMention.objects.filter(source="reddit", source_id=source_id).exists():
                    continue

                # Pick sentiment bucket
                r = random.random()
                if r < weights[0]:
                    templates = POSITIVE_TEMPLATES
                elif r < weights[0] + weights[1]:
                    templates = NEGATIVE_TEMPLATES
                else:
                    templates = NEUTRAL_TEMPLATES

                text = random.choice(templates).format(title=title.title)
                result = analyze_text(text)

                posted_at = now - timedelta(
                    days=random.randint(1, 60),
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59),
                )

                SentimentMention.objects.create(
                    title=title,
                    source="reddit",
                    source_id=source_id,
                    source_url=f"https://reddit.com/r/{random.choice(SUBREDDITS)}/comments/{source_id}",
                    author=random.choice(USERNAMES),
                    subreddit=random.choice(SUBREDDITS),
                    post_type=random.choice(["comment", "post"]),
                    text=text,
                    text_length=len(text.split()),
                    sentiment=result["sentiment"],
                    sentiment_score=round(result["compound"], 4),
                    positive_score=result["positive"],
                    negative_score=result["negative"],
                    neutral_score=result["neutral"],
                    confidence=result["confidence"],
                    upvotes=random.randint(1, 500),
                    downvotes=random.randint(0, 30),
                    reply_count=random.randint(0, 40),
                    is_processed=True,
                    processed_at=now,
                    posted_at=posted_at,
                )
                created_total += 1

        self.stdout.write(self.style.SUCCESS(f"Created {created_total} demo mentions"))

        # Recompute scores
        self.stdout.write(f"Computing SentiScores for {count} titles...")
        scored = 0
        for title in titles:
            result = compute_title_sentiment(title.id)
            if result:
                scored += 1
                self.stdout.write(
                    f"  {result['title']}: {result['senti_score']:.0f} "
                    f"({result['positive_pct']:.0f}% pos, "
                    f"{result['negative_pct']:.0f}% neg, "
                    f"{result['total_mentions']} mentions)"
                )

        self.stdout.write(self.style.SUCCESS(
            f"Done. {scored}/{count} titles now have SentiScores."
        ))
