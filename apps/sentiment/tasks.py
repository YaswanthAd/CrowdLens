import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(name="sentiment.scrape_title")
def scrape_title_task(title_id):
    from apps.titles.models import Title
    from apps.sentiment.scrapers import RedditScraper

    title = Title.objects.get(id=title_id)
    scraper = RedditScraper()
    result = scraper.scrape_title(title)
    logger.info(f"Scraped '{title.title}': {result}")
    return result


@shared_task(name="sentiment.scrape_trending")
def scrape_trending_titles():
    from apps.titles.models import Title

    titles = Title.objects.filter(
        release_date__gte=timezone.now().date() - timezone.timedelta(days=90),
    ).order_by("-total_user_ratings")[:20]

    for title in titles:
        scrape_title_task.delay(title.id)

    logger.info(f"Queued scraping for {titles.count()} trending titles")


@shared_task(name="sentiment.process_mentions")
def process_mentions_task(batch_size=200):
    from apps.sentiment.services import process_unanalyzed_mentions

    count = process_unanalyzed_mentions(batch_size)
    logger.info(f"Processed {count} mentions")
    return count


@shared_task(name="sentiment.recompute_title_score")
def recompute_title_score_task(title_id):
    from apps.sentiment.services import compute_title_sentiment

    result = compute_title_sentiment(title_id)
    if result:
        logger.info(f"Recomputed score for '{result['title']}': {result['senti_score']}")
    return result


@shared_task(name="sentiment.recompute_all_scores")
def recompute_all_scores():
    from apps.titles.models import Title

    titles = Title.objects.filter(senti_total_mentions__gte=1)
    for title in titles:
        recompute_title_score_task.delay(title.id)

    logger.info(f"Queued score recomputation for {titles.count()} titles")
