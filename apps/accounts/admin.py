from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Follow

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["username", "email", "display_name", "total_reviews", "date_joined"]
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Profile", {"fields": ("display_name", "bio", "avatar", "header_image", "location", "website")}),
        ("Social", {"fields": ("twitter_handle", "letterboxd_username", "mal_username")}),
        ("Stats", {"fields": ("total_titles_watched", "total_reviews", "is_private")}),
    )

@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ["follower", "following", "created_at"]
