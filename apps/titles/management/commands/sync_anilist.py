"""
Management command: sync_anilist

Imports popular anime from AniList GraphQL API (no API key required).

Usage:
    SQLITE=1 python manage.py sync_anilist
    SQLITE=1 python manage.py sync_anilist --pages 5
    SQLITE=1 python manage.py sync_anilist --id 1535    # specific AniList ID
"""
import logging
import time

import requests
from django.core.management.base import BaseCommand
from django.utils.text import slugify

from apps.titles.models import Title, Genre, Person, TitleCast

logger = logging.getLogger(__name__)

ANILIST_GRAPHQL = "https://graphql.anilist.co"

POPULAR_QUERY = """
query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage currentPage }
    media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
      id
      title { romaji english native }
      description(asHtml: false)
      coverImage { extraLarge large }
      bannerImage
      startDate { year month day }
      endDate { year month day }
      episodes
      duration
      status
      averageScore
      popularity
      genres
      studios(isMain: true) { nodes { name } }
      staff(sort: RELEVANCE) {
        edges {
          role
          node { id name { full } image { medium } }
        }
      }
      characters(sort: ROLE, role: MAIN) {
        edges {
          node { id name { full } image { medium } }
          voiceActors(language: JAPANESE) { id name { full } image { medium } }
        }
      }
    }
  }
}
"""

SINGLE_QUERY = """
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    title { romaji english native }
    description(asHtml: false)
    coverImage { extraLarge large }
    bannerImage
    startDate { year month day }
    endDate { year month day }
    episodes
    duration
    status
    averageScore
    popularity
    genres
    studios(isMain: true) { nodes { name } }
    staff(sort: RELEVANCE) {
      edges {
        role
        node { id name { full } image { medium } }
      }
    }
  }
}
"""


class Command(BaseCommand):
    help = "Sync popular anime from AniList GraphQL API"

    def add_arguments(self, parser):
        parser.add_argument("--pages", type=int, default=3, help="Number of pages (50 per page)")
        parser.add_argument("--id", type=int, help="Sync a specific AniList media ID")

    def handle(self, *args, **options):
        self.session = requests.Session()
        self.session.headers["Content-Type"] = "application/json"
        self.session.headers["Accept"] = "application/json"

        if options["id"]:
            self._sync_single(options["id"])
        else:
            self._sync_popular(options["pages"])

    def _graphql(self, query, variables):
        resp = self.session.post(ANILIST_GRAPHQL, json={"query": query, "variables": variables})
        if resp.status_code == 429:
            retry_after = int(resp.headers.get("Retry-After", 60))
            self.stdout.write(self.style.WARNING(f"Rate limited — waiting {retry_after}s"))
            time.sleep(retry_after)
            resp = self.session.post(ANILIST_GRAPHQL, json={"query": query, "variables": variables})
        resp.raise_for_status()
        return resp.json()

    def _sync_popular(self, pages):
        total_synced = 0
        for page in range(1, pages + 1):
            try:
                data = self._graphql(POPULAR_QUERY, {"page": page, "perPage": 50})
                media_list = data["data"]["Page"]["media"]
                for item in media_list:
                    try:
                        self._save_anime(item)
                        total_synced += 1
                    except Exception as e:
                        name = item.get("title", {}).get("romaji", "?")
                        logger.error(f"Failed to save {name}: {e}")
                self.stdout.write(f"  Page {page}/{pages} done ({len(media_list)} titles)")
                time.sleep(0.5)
            except Exception as e:
                self.stderr.write(f"Page {page} failed: {e}")

        self.stdout.write(self.style.SUCCESS(f"Synced {total_synced} anime titles"))

    def _sync_single(self, anilist_id):
        data = self._graphql(SINGLE_QUERY, {"id": anilist_id})
        item = data["data"]["Media"]
        title = self._save_anime(item)
        self.stdout.write(self.style.SUCCESS(f"Synced: {title}"))

    def _save_anime(self, item):
        # Prefer English title, fall back to romaji, then native
        english = item["title"].get("english") or ""
        romaji = item["title"].get("romaji") or ""
        native = item["title"].get("native") or ""
        name = english or romaji or native or "Unknown"
        original = native or romaji

        # Release date
        sd = item.get("startDate") or {}
        release_date = None
        release_year = None
        if sd.get("year") and sd.get("month") and sd.get("day"):
            try:
                from datetime import date
                release_date = date(sd["year"], sd["month"], sd["day"])
                release_year = str(sd["year"])
            except ValueError:
                release_year = str(sd["year"]) if sd.get("year") else None
        elif sd.get("year"):
            release_year = str(sd["year"])

        # End date
        ed = item.get("endDate") or {}
        end_date = None
        if ed.get("year") and ed.get("month") and ed.get("day"):
            try:
                from datetime import date
                end_date = date(ed["year"], ed["month"], ed["day"])
            except ValueError:
                pass

        slug_base = slugify(romaji or name)[:480]
        slug = f"{slug_base}-{release_year}" if release_year else slug_base

        # Handle slug collisions
        existing = Title.objects.filter(slug=slug).exclude(anilist_id=item["id"]).first()
        if existing:
            slug = f"{slug}-al{item['id']}"

        # Status mapping
        status_map = {
            "FINISHED": "ended",
            "RELEASING": "airing",
            "NOT_YET_RELEASED": "upcoming",
            "CANCELLED": "cancelled",
        }
        status = status_map.get(item.get("status", ""), "released")

        # Poster/backdrop
        cover = item.get("coverImage") or {}
        poster_url = cover.get("extraLarge") or cover.get("large") or ""
        backdrop_url = item.get("bannerImage") or ""

        # AniList score is out of 100; not a 10-scale, keep as-is but store in tmdb_rating as /10
        raw_score = item.get("averageScore")
        tmdb_rating = round(raw_score / 10, 1) if raw_score else None

        title_obj, created = Title.objects.update_or_create(
            anilist_id=item["id"],
            defaults={
                "title": name,
                "original_title": original,
                "slug": slug,
                "title_type": "anime",
                "overview": item.get("description") or "",
                "release_date": release_date,
                "end_date": end_date,
                "runtime_minutes": item.get("duration"),
                "total_episodes": item.get("episodes"),
                "poster_url": poster_url,
                "backdrop_url": backdrop_url,
                "tmdb_rating": tmdb_rating,
                "tmdb_vote_count": item.get("popularity") or 0,
                "studio": ", ".join(s["name"] for s in (item.get("studios") or {}).get("nodes", [])),
                "status": status,
            },
        )

        # Genres
        for genre_name in item.get("genres") or []:
            genre, _ = Genre.objects.get_or_create(
                name=genre_name,
                defaults={"slug": slugify(genre_name)},
            )
            title_obj.genres.add(genre)

        # Directors (AniList: role "Director" or "Original Creator")
        directors = []
        for edge in (item.get("staff") or {}).get("edges") or []:
            if edge.get("role") in ("Director", "Series Director"):
                node = edge["node"]
                person, _ = Person.objects.update_or_create(
                    anilist_id=node["id"],
                    defaults={
                        "name": node["name"]["full"],
                        "profile_image": (node.get("image") or {}).get("medium") or "",
                    },
                )
                directors.append(person)
        if directors:
            title_obj.directors.set(directors)

        action = "Created" if created else "Updated"
        logger.debug(f"{action}: {title_obj}")
        return title_obj
