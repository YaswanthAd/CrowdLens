from django.contrib import admin
from .models import Review, Watchlist, UserList, ActivityLog

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ["user", "title", "rating", "likes_count", "created_at"]
    list_filter = ["rating"]

@admin.register(Watchlist)
class WatchlistAdmin(admin.ModelAdmin):
    list_display = ["user", "title", "priority", "added_at"]

@admin.register(UserList)
class UserListAdmin(admin.ModelAdmin):
    list_display = ["user", "name", "is_public", "is_ranked"]

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ["user", "activity_type", "title", "created_at"]
    list_filter = ["activity_type"]
