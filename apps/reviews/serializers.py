from rest_framework import serializers
from apps.accounts.serializers import UserMinimalSerializer
from apps.titles.serializers import TitleListSerializer
from .models import Review, Watchlist, UserList, UserListEntry, ActivityLog


class ReviewSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)
    title_info = TitleListSerializer(source="title", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id", "user", "title", "title_info", "rating", "review_text",
            "contains_spoilers", "likes_count", "watched_date",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "user", "likes_count", "created_at", "updated_at"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["title", "rating", "review_text", "contains_spoilers", "watched_date"]


class WatchlistSerializer(serializers.ModelSerializer):
    title_info = TitleListSerializer(source="title", read_only=True)

    class Meta:
        model = Watchlist
        fields = ["id", "title", "title_info", "notes", "priority", "added_at"]
        read_only_fields = ["id", "added_at"]


class UserListSerializer(serializers.ModelSerializer):
    title_count = serializers.ReadOnlyField()

    class Meta:
        model = UserList
        fields = [
            "id", "name", "slug", "description", "is_public",
            "is_ranked", "likes_count", "title_count",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "likes_count", "created_at", "updated_at"]


class ActivityLogSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = ActivityLog
        fields = [
            "id", "user", "activity_type", "title",
            "target_user", "review", "created_at",
        ]
