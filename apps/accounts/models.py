from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    email = models.EmailField(unique=True)

    # Profile
    display_name = models.CharField(max_length=50, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    avatar = models.ImageField(upload_to="avatars/%Y/%m/", blank=True, null=True)
    header_image = models.ImageField(upload_to="headers/%Y/%m/", blank=True, null=True)
    location = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True)

    # Social links
    twitter_handle = models.CharField(max_length=50, blank=True)
    letterboxd_username = models.CharField(max_length=50, blank=True)
    mal_username = models.CharField(max_length=50, blank=True)

    # Preferences
    favorite_genres = models.ManyToManyField(
        "titles.Genre", blank=True, related_name="fans"
    )
    is_private = models.BooleanField(default=False)

    # Stats
    total_titles_watched = models.PositiveIntegerField(default=0)
    total_reviews = models.PositiveIntegerField(default=0)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "users"
        ordering = ["-date_joined"]

    def __str__(self):
        return self.display_name or self.username

    @property
    def avatar_url(self):
        if self.avatar:
            return self.avatar.url
        return f"https://ui-avatars.com/api/?name={self.username}&background=1a1a2e&color=e94560"


class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "follows"
        unique_together = ("follower", "following")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.follower} → {self.following}"
