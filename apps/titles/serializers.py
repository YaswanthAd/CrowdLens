from rest_framework import serializers
from .models import Title, Genre, Person, TitleCast


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ["id", "name", "slug"]


class PersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = ["id", "name", "profile_image"]


class TitleCastSerializer(serializers.ModelSerializer):
    person = PersonSerializer(read_only=True)

    class Meta:
        model = TitleCast
        fields = ["person", "character_name", "order"]


class TitleListSerializer(serializers.ModelSerializer):
    poster_full_url = serializers.ReadOnlyField()
    genres = GenreSerializer(many=True, read_only=True)

    class Meta:
        model = Title
        fields = [
            "id", "title", "slug", "title_type", "release_date",
            "poster_full_url", "genres", "senti_score",
            "senti_positive_pct", "senti_negative_pct",
            "avg_user_rating", "total_user_ratings",
            "tmdb_rating", "runtime_minutes",
        ]


class TitleDetailSerializer(serializers.ModelSerializer):
    poster_full_url = serializers.ReadOnlyField()
    backdrop_full_url = serializers.ReadOnlyField()
    genres = GenreSerializer(many=True, read_only=True)
    directors = PersonSerializer(many=True, read_only=True)
    cast_list = TitleCastSerializer(source="titlecast_set", many=True, read_only=True)

    class Meta:
        model = Title
        fields = [
            "id", "title", "original_title", "slug", "title_type", "status",
            "overview", "tagline", "release_date", "end_date",
            "runtime_minutes", "original_language",
            "poster_full_url", "backdrop_full_url",
            "genres", "directors", "cast_list",
            "tmdb_id", "imdb_id", "anilist_id",
            "tmdb_rating", "tmdb_vote_count", "imdb_rating",
            "total_seasons", "total_episodes", "episode_runtime",
            "studio", "network",
            "senti_score", "senti_positive_pct", "senti_negative_pct",
            "senti_neutral_pct", "senti_total_mentions", "senti_last_updated",
            "avg_user_rating", "total_user_ratings", "total_user_reviews",
            "total_watchlisted",
            "created_at", "updated_at",
        ]
