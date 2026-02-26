from django.db import models


class Genre(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)
    tmdb_id = models.IntegerField(null=True, blank=True, unique=True)
    anilist_id = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = "genres"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Person(models.Model):
    name = models.CharField(max_length=200)
    profile_image = models.URLField(blank=True)
    tmdb_id = models.IntegerField(null=True, blank=True, unique=True)
    anilist_id = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = "people"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Title(models.Model):
    class TitleType(models.TextChoices):
        MOVIE = "movie", "Movie"
        TV = "tv", "TV Series"
        ANIME = "anime", "Anime"

    class Status(models.TextChoices):
        RELEASED = "released", "Released"
        UPCOMING = "upcoming", "Upcoming"
        AIRING = "airing", "Currently Airing"
        ENDED = "ended", "Ended"
        CANCELLED = "cancelled", "Cancelled"

    # Core
    title = models.CharField(max_length=500)
    original_title = models.CharField(max_length=500, blank=True)
    slug = models.SlugField(max_length=500, unique=True)
    title_type = models.CharField(max_length=10, choices=TitleType.choices, db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.RELEASED)

    # Metadata
    overview = models.TextField(blank=True)
    tagline = models.CharField(max_length=500, blank=True)
    release_date = models.DateField(null=True, blank=True, db_index=True)
    end_date = models.DateField(null=True, blank=True)
    runtime_minutes = models.PositiveIntegerField(null=True, blank=True)
    original_language = models.CharField(max_length=10, blank=True)

    # Images
    poster_url = models.URLField(blank=True)
    backdrop_url = models.URLField(blank=True)
    poster_path = models.CharField(max_length=200, blank=True)
    backdrop_path = models.CharField(max_length=200, blank=True)

    # Relationships
    genres = models.ManyToManyField(Genre, blank=True, related_name="titles")
    directors = models.ManyToManyField(Person, blank=True, related_name="directed_titles")
    cast = models.ManyToManyField(Person, blank=True, related_name="acted_in", through="TitleCast")

    # External IDs
    tmdb_id = models.IntegerField(null=True, blank=True, db_index=True)
    imdb_id = models.CharField(max_length=20, blank=True, db_index=True)
    anilist_id = models.IntegerField(null=True, blank=True, db_index=True)
    mal_id = models.IntegerField(null=True, blank=True)

    # External Ratings
    tmdb_rating = models.FloatField(null=True, blank=True)
    tmdb_vote_count = models.PositiveIntegerField(default=0)
    imdb_rating = models.FloatField(null=True, blank=True)

    # TV / Anime specific
    total_seasons = models.PositiveIntegerField(null=True, blank=True)
    total_episodes = models.PositiveIntegerField(null=True, blank=True)
    episode_runtime = models.PositiveIntegerField(null=True, blank=True)
    studio = models.CharField(max_length=200, blank=True)
    network = models.CharField(max_length=200, blank=True)

    # CrowdLens Sentiment Scores
    senti_score = models.FloatField(null=True, blank=True)
    senti_positive_pct = models.FloatField(null=True, blank=True)
    senti_negative_pct = models.FloatField(null=True, blank=True)
    senti_neutral_pct = models.FloatField(null=True, blank=True)
    senti_total_mentions = models.PositiveIntegerField(default=0)
    senti_last_updated = models.DateTimeField(null=True, blank=True)

    # User Stats
    avg_user_rating = models.FloatField(null=True, blank=True)
    total_user_ratings = models.PositiveIntegerField(default=0)
    total_user_reviews = models.PositiveIntegerField(default=0)
    total_watchlisted = models.PositiveIntegerField(default=0)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "titles"
        ordering = ["-release_date"]
        indexes = [
            models.Index(fields=["title_type", "-release_date"]),
            models.Index(fields=["title_type", "-senti_score"]),
            models.Index(fields=["-senti_score"]),
            models.Index(fields=["-avg_user_rating"]),
            models.Index(fields=["tmdb_id", "title_type"]),
        ]

    def __str__(self):
        year = self.release_date.year if self.release_date else "TBD"
        return f"{self.title} ({year}) [{self.get_title_type_display()}]"

    @property
    def poster_full_url(self):
        if self.poster_url:
            return self.poster_url
        if self.poster_path:
            return f"https://image.tmdb.org/t/p/w500{self.poster_path}"
        return ""

    @property
    def backdrop_full_url(self):
        if self.backdrop_url:
            return self.backdrop_url
        if self.backdrop_path:
            return f"https://image.tmdb.org/t/p/w1280{self.backdrop_path}"
        return ""


class TitleCast(models.Model):
    title = models.ForeignKey(Title, on_delete=models.CASCADE)
    person = models.ForeignKey(Person, on_delete=models.CASCADE)
    character_name = models.CharField(max_length=200, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "title_cast"
        ordering = ["order"]
        unique_together = ("title", "person", "character_name")

    def __str__(self):
        return f"{self.person.name} as {self.character_name} in {self.title.title}"


class TitleImage(models.Model):
    class ImageType(models.TextChoices):
        POSTER = "poster", "Poster"
        BACKDROP = "backdrop", "Backdrop"
        STILL = "still", "Still"
        LOGO = "logo", "Logo"

    title = models.ForeignKey(Title, on_delete=models.CASCADE, related_name="images")
    image_url = models.URLField()
    image_type = models.CharField(max_length=20, choices=ImageType.choices)
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    language = models.CharField(max_length=10, blank=True)

    class Meta:
        db_table = "title_images"

    def __str__(self):
        return f"{self.title.title} - {self.get_image_type_display()}"
