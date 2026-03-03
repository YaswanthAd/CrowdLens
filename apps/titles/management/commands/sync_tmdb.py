import logging
import time

import requests
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils.text import slugify

from apps.titles.models import Title, Genre, Person, TitleCast

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Sync popular titles from TMDB into the database"

    def add_arguments(self, parser):
        parser.add_argument("--type", choices=["movie", "tv"], default="movie")
        parser.add_argument("--pages", type=int, default=3)
        parser.add_argument("--movie-id", type=int, help="Sync a specific TMDB movie ID")
        parser.add_argument("--tv-id", type=int, help="Sync a specific TMDB TV show ID")

    def handle(self, *args, **options):
        self.api_key = settings.TMDB_API_KEY
        if not self.api_key:
            self.stderr.write(self.style.ERROR(
                "TMDB_API_KEY not set. Get one at https://www.themoviedb.org/settings/api"
            ))
            return

        self.base_url = settings.TMDB_BASE_URL
        self.session = requests.Session()
        self.session.params = {"api_key": self.api_key}

        self._sync_genres()

        if options["movie_id"]:
            self._sync_single("movie", options["movie_id"])
        elif options["tv_id"]:
            self._sync_single("tv", options["tv_id"])
        else:
            self._sync_popular(options["type"], options["pages"])

    def _sync_genres(self):
        for content_type in ["movie", "tv"]:
            resp = self.session.get(f"{self.base_url}/genre/{content_type}/list")
            if resp.ok:
                for g in resp.json().get("genres", []):
                    Genre.objects.update_or_create(
                        tmdb_id=g["id"],
                        defaults={"name": g["name"], "slug": slugify(g["name"])},
                    )
        self.stdout.write(self.style.SUCCESS(f"Synced {Genre.objects.count()} genres"))

    def _sync_popular(self, content_type, pages):
        endpoint = f"{self.base_url}/{content_type}/popular"
        total_synced = 0

        for page in range(1, pages + 1):
            resp = self.session.get(endpoint, params={"page": page})
            if not resp.ok:
                self.stderr.write(f"Failed page {page}: {resp.status_code}")
                continue

            results = resp.json().get("results", [])
            for item in results:
                try:
                    title_type = "movie" if content_type == "movie" else "tv"
                    self._sync_title(item, title_type)
                    total_synced += 1
                except Exception as e:
                    logger.error(f"Failed to sync {item.get('title', item.get('name'))}: {e}")

            self.stdout.write(f"  Page {page}/{pages} done ({len(results)} titles)")
            time.sleep(0.25)

        self.stdout.write(self.style.SUCCESS(f"Synced {total_synced} {content_type} titles"))

    def _sync_single(self, content_type, tmdb_id):
        resp = self.session.get(
            f"{self.base_url}/{content_type}/{tmdb_id}",
            params={"append_to_response": "credits"},
        )
        if not resp.ok:
            self.stderr.write(f"Failed: {resp.status_code}")
            return

        data = resp.json()
        title_type = "movie" if content_type == "movie" else "tv"
        title = self._sync_title(data, title_type, with_credits=True)
        self.stdout.write(self.style.SUCCESS(f"Synced: {title}"))

    def _sync_title(self, data, title_type, with_credits=False):
        name = data.get("title") or data.get("name", "Unknown")
        original_name = data.get("original_title") or data.get("original_name", "")
        release_str = data.get("release_date") or data.get("first_air_date") or ""
        release = None
        release_year = None
        if release_str:
            try:
                from datetime import date
                parts = release_str.split("-")
                release = date(int(parts[0]), int(parts[1]), int(parts[2]))
                release_year = parts[0]
            except (ValueError, IndexError):
                release = None

        slug_base = slugify(name)[:480]
        slug = slug_base
        if release_year:
            slug = f"{slug_base}-{release_year}"

        title, created = Title.objects.update_or_create(
            tmdb_id=data["id"],
            title_type=title_type,
            defaults={
                "title": name,
                "original_title": original_name,
                "slug": slug,
                "overview": data.get("overview", ""),
                "tagline": data.get("tagline", ""),
                "release_date": release if release else None,
                "runtime_minutes": data.get("runtime"),
                "original_language": data.get("original_language", ""),
                "poster_path": data.get("poster_path") or "",
                "backdrop_path": data.get("backdrop_path") or "",
                "tmdb_rating": data.get("vote_average"),
                "tmdb_vote_count": data.get("vote_count", 0),
                "total_seasons": data.get("number_of_seasons"),
                "total_episodes": data.get("number_of_episodes"),
                "status": self._map_status(data.get("status", "")),
            },
        )

        genre_ids = data.get("genre_ids") or [g["id"] for g in data.get("genres", [])]
        genres = Genre.objects.filter(tmdb_id__in=genre_ids)
        title.genres.set(genres)

        if with_credits and "credits" in data:
            self._sync_credits(title, data["credits"])

        action = "Created" if created else "Updated"
        logger.debug(f"{action}: {title}")
        return title

    def _sync_credits(self, title, credits):
        directors = []
        for crew in credits.get("crew", []):
            if crew.get("job") == "Director":
                person, _ = Person.objects.update_or_create(
                    tmdb_id=crew["id"],
                    defaults={
                        "name": crew["name"],
                        "profile_image": (
                            f"https://image.tmdb.org/t/p/w185{crew['profile_path']}"
                            if crew.get("profile_path") else ""
                        ),
                    },
                )
                directors.append(person)
        title.directors.set(directors)

        TitleCast.objects.filter(title=title).delete()
        for i, member in enumerate(credits.get("cast", [])[:10]):
            person, _ = Person.objects.update_or_create(
                tmdb_id=member["id"],
                defaults={
                    "name": member["name"],
                    "profile_image": (
                        f"https://image.tmdb.org/t/p/w185{member['profile_path']}"
                        if member.get("profile_path") else ""
                    ),
                },
            )
            TitleCast.objects.create(
                title=title,
                person=person,
                character_name=member.get("character", ""),
                order=i,
            )

    @staticmethod
    def _map_status(tmdb_status):
        mapping = {
            "Released": "released",
            "Post Production": "upcoming",
            "In Production": "upcoming",
            "Planned": "upcoming",
            "Returning Series": "airing",
            "Ended": "ended",
            "Canceled": "cancelled",
        }
        return mapping.get(tmdb_status, "released")
