"""
Social media review fetcher.

Supports Reddit (via PRAW) when credentials are configured, and falls back to
a curated demo dataset so the application works out of the box without API keys.
"""
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Demo / fallback data
# ---------------------------------------------------------------------------

DEMO_REVIEWS: dict[str, list[str]] = {
    "Dune: Part Two": [
        "Absolutely breathtaking visuals and an incredible score. Villeneuve has done it again!",
        "The world-building is unmatched. Zendaya and Chalamet have amazing chemistry.",
        "A bit slow in the middle but the final act is pure cinematic gold.",
        "Better than the first one. The sandworm riding scene is iconic.",
        "Stunning cinematography but the story felt rushed compared to the book.",
        "One of the best sci-fi films in years. Cannot stop thinking about it.",
        "The action sequences were breathtaking. Definitely a must-watch on IMAX.",
        "A masterpiece of modern cinema. The scope and ambition are unparalleled.",
        "Slightly disappointed — some character arcs felt underdeveloped.",
        "Florence Pugh was incredible. The political intrigue was fascinating.",
    ],
    "Oppenheimer": [
        "Nolan's magnum opus. Three hours flew by. Absolutely riveting.",
        "Cillian Murphy deserves every award. The courtroom scenes are tense.",
        "The non-linear structure is confusing at first but pays off brilliantly.",
        "The bomb test sequence is the most jaw-dropping thing I've seen in a cinema.",
        "Emotionally heavy but important. A film that stays with you.",
        "Brilliant performances all around. Emily Blunt is phenomenal.",
        "A bit too long but every scene is purposeful. True masterpiece.",
        "The score by Ludwig Göransson is hauntingly beautiful.",
        "Thought-provoking and deeply human. One of the best films of the decade.",
        "Some scenes dragged but overall an extraordinary achievement.",
    ],
    "Attack on Titan": [
        "The best anime I have ever watched. The ending is divisive but the journey is incredible.",
        "Season 3 and 4 are among the greatest pieces of storytelling in any medium.",
        "Eren's character arc is one of the most complex in anime history.",
        "The animation quality in the final season is absolutely stunning.",
        "Emotionally devastating. I cried multiple times in the final arc.",
        "The political commentary and moral ambiguity set it apart from other anime.",
        "MAPPA did an amazing job taking over from WIT Studio.",
        "One of the greatest stories ever told. Period.",
        "The ending left me with mixed feelings but I respect the vision.",
        "Rewatching it and catching all the foreshadowing is mind-blowing.",
    ],
    "The Bear": [
        "The most stressful and brilliant TV show I've ever watched.",
        "Season 2 is a masterpiece. The Forks episode alone deserves every Emmy.",
        "Jeremy Allen White is extraordinary. This show demands your full attention.",
        "Carmy's breakdown in the walk-in is the best single scene on TV in years.",
        "The ensemble cast is flawless. Every character gets their moment.",
        "Rewatched all of season 2 in one day. That's how good it is.",
        "The kitchen chaos feels so real and visceral. Incredibly immersive.",
        "Season 3 was a slight step down but still better than most shows.",
        "The writing is sharp, the direction is innovative, the acting is top tier.",
        "It genuinely made me anxious watching it. That's excellent filmmaking.",
    ],
    "Bluey": [
        "The best children's show ever made. Adults cry at it constantly.",
        "Every episode is a tiny masterpiece of storytelling. Genuinely moving.",
        "Bandit and Chilli are the best TV parents ever written.",
        "I watch this with my kids and end up more emotionally affected than they are.",
        "The writing is sophisticated enough for adults but perfect for children.",
        "Flat pack and The Sign made me sob. Incredible animated storytelling.",
        "How is a kids show this emotionally resonant? Pure genius.",
        "The Australian setting and humor are so refreshing and charming.",
        "My whole family loves it. Rare to find a show that works for all ages.",
        "Easily the most heart-warming show on television right now.",
    ],
    "Poor Things": [
        "Lanthimos at his most ambitious and imaginative. Emma Stone is otherworldly.",
        "Bizarre, funny, dark, and strangely beautiful. A one-of-a-kind film.",
        "Emma Stone's performance is career-best. Deserved every award.",
        "The production design is jaw-dropping — every frame is a painting.",
        "Not for everyone but if it clicks with you it's unforgettable.",
        "Feminist story wrapped in a surrealist package. Thought-provoking.",
        "The fisheye lens direction is initially jarring but becomes hypnotic.",
        "Mark Ruffalo is hysterically funny. Unexpected comedic gem.",
        "Uncomfortable in the best way possible. A truly original vision.",
        "The score and cinematography are unlike anything else in recent memory.",
    ],
    "Demon Slayer": [
        "The animation quality is out of this world. Ufotable never misses.",
        "Tanjiro is such a pure and lovable protagonist. Rooting for him always.",
        "The Mugen Train arc is one of the greatest anime films ever made.",
        "Entertainment District arc has some of the best action sequences in anime.",
        "The story is simple but the execution and visuals are extraordinary.",
        "Zenitsu is annoying but every other character is brilliant.",
        "The music by Yuki Kajiura and Go Shiina gives me chills every time.",
        "Incredible emotional moments balanced with stunning fight choreography.",
        "The Hashira Training arc built up perfectly. Excited for what's next.",
        "One of the most visually spectacular anime productions ever made.",
    ],
    "Succession": [
        "The greatest TV drama of the 21st century. Every season is flawless.",
        "The finale is perfect. Heartbreaking, poetic, and deeply satisfying.",
        "Brian Cox is terrifying and hilarious as Logan Roy. A legendary performance.",
        "The writing is Shakespearean in scope and wit. Genuinely literary TV.",
        "Kieran Culkin should have won every award for his portrayal of Roman.",
        "Rewatching it knowing the ending adds so many layers. Masterful storytelling.",
        "The dinner scenes alone are worth the entire show. Dialogue is impeccable.",
        "Nothing has topped this for prestige TV drama. A cultural landmark.",
        "The sibling dynamics are so painful and real. Beautifully observed.",
        "Season 4 stuck the landing perfectly. A rare achievement in television.",
    ],
}


def _get_reddit_client(config: dict):
    """Return a PRAW Reddit client if credentials are configured, else None."""
    try:
        import praw  # noqa: PLC0415

        client_id = config.get("REDDIT_CLIENT_ID", "")
        client_secret = config.get("REDDIT_CLIENT_SECRET", "")
        user_agent = config.get("REDDIT_USER_AGENT", "CrowdLens/1.0")

        if not client_id or not client_secret:
            return None

        return praw.Reddit(
            client_id=client_id,
            client_secret=client_secret,
            user_agent=user_agent,
        )
    except Exception as exc:  # pragma: no cover
        logger.warning("Could not initialise Reddit client: %s", exc)
        return None


def fetch_reddit_reviews(title: str, config: dict, limit: int = 25) -> list[str]:
    """
    Search Reddit for posts/comments about *title* and return text snippets.
    Falls back to an empty list if credentials are unavailable or the request fails.
    """
    reddit = _get_reddit_client(config)
    if reddit is None:
        return []

    texts: list[str] = []
    try:
        subreddits = ["movies", "television", "anime", "MovieSuggestions", "flicks"]
        for sub_name in subreddits:
            if len(texts) >= limit:
                break
            subreddit = reddit.subreddit(sub_name)
            for submission in subreddit.search(title, limit=5, sort="relevance"):
                if title.lower() in submission.title.lower():
                    if submission.selftext:
                        texts.append(submission.selftext[:500])
                    submission.comments.replace_more(limit=0)
                    for comment in submission.comments.list()[:3]:
                        if len(comment.body) > 20:
                            texts.append(comment.body[:500])
    except Exception as exc:  # pragma: no cover
        logger.warning("Reddit fetch failed for '%s': %s", title, exc)

    return texts[:limit]


def fetch_reviews(title: str, config: Optional[dict] = None, limit: int = 25) -> list[str]:
    """
    Fetch reviews for *title* from available sources.

    Priority:
      1. Reddit (if credentials are configured)
      2. Demo dataset (built-in fallback)
    """
    if config is None:
        config = {}

    # Try Reddit first
    reddit_texts = fetch_reddit_reviews(title, config, limit=limit)
    if reddit_texts:
        return reddit_texts

    # Fall back to demo data (case-insensitive key lookup)
    title_lower = title.lower()
    for key, reviews in DEMO_REVIEWS.items():
        if title_lower in key.lower() or key.lower() in title_lower:
            return reviews[:limit]

    return []


def list_demo_titles() -> list[str]:
    """Return all titles available in the built-in demo dataset."""
    return list(DEMO_REVIEWS.keys())
