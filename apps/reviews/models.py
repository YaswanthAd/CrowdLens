from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class Review(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews")
    title = models.ForeignKey("titles.Title", on_delete=models.CASCADE, related_name="reviews")

    rating = models.FloatField(
        null=True, blank=True,
        validators=[MinValueValidator(0.5), MaxValueValidator(5.0)],
    )
    review_text = models.TextField(blank=True)
    contains_spoilers = models.BooleanField(default=False)
    likes_count = models.PositiveIntegerField(default=0)

    watched_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "reviews"
        unique_together = ("user", "title")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["title", "-created_at"]),
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["title", "-rating"]),
        ]

    def __str__(self):
        stars = f" ({self.rating}★)" if self.rating else ""
        return f"{self.user} → {self.title.title}{stars}"

    def save(self, *args, **kwargs):
        if self.rating is not None:
            self.rating = round(self.rating * 2) / 2
        super().save(*args, **kwargs)


class ReviewLike(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="review_likes")
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="likes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "review_likes"
        unique_together = ("user", "review")


class Watchlist(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="watchlist")
    title = models.ForeignKey("titles.Title", on_delete=models.CASCADE, related_name="watchlisted_by")
    notes = models.CharField(max_length=500, blank=True)
    priority = models.PositiveSmallIntegerField(default=0)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "watchlists"
        unique_together = ("user", "title")
        ordering = ["-priority", "-added_at"]

    def __str__(self):
        return f"{self.user} wants to watch {self.title.title}"


class UserList(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="lists")
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200)
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=True)
    is_ranked = models.BooleanField(default=False)
    likes_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_lists"
        unique_together = ("user", "slug")
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.user}: {self.name}"

    @property
    def title_count(self):
        return self.entries.count()


class UserListEntry(models.Model):
    user_list = models.ForeignKey(UserList, on_delete=models.CASCADE, related_name="entries")
    title = models.ForeignKey("titles.Title", on_delete=models.CASCADE, related_name="list_appearances")
    order = models.PositiveIntegerField(default=0)
    notes = models.CharField(max_length=500, blank=True)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_list_entries"
        unique_together = ("user_list", "title")
        ordering = ["order"]


class ActivityLog(models.Model):
    class ActivityType(models.TextChoices):
        WATCHED = "watched", "Watched"
        RATED = "rated", "Rated"
        REVIEWED = "reviewed", "Reviewed"
        WATCHLISTED = "watchlisted", "Added to Watchlist"
        LISTED = "listed", "Added to List"
        LIKED_REVIEW = "liked_review", "Liked a Review"
        FOLLOWED = "followed", "Followed"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="activity")
    activity_type = models.CharField(max_length=20, choices=ActivityType.choices)
    title = models.ForeignKey("titles.Title", on_delete=models.CASCADE, null=True, blank=True, related_name="activity")
    target_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name="activity_about")
    review = models.ForeignKey(Review, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "activity_log"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["activity_type", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.user} {self.get_activity_type_display()} {self.title or self.target_user}"
