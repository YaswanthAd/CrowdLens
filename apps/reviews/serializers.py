from rest_framework import serializers
from django.utils.text import slugify
from apps.accounts.serializers import UserMinimalSerializer
from apps.titles.serializers import TitleListSerializer
from .models import Review, Watchlist, UserList, UserListEntry, UserListLike, ActivityLog


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


class UserListEntrySerializer(serializers.ModelSerializer):
    title_info = TitleListSerializer(source="title", read_only=True)

    class Meta:
        model = UserListEntry
        fields = ["id", "title", "title_info", "order", "notes", "added_at"]
        read_only_fields = ["id", "added_at"]


class UserListSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)
    title_count = serializers.ReadOnlyField()
    poster_thumbnails = serializers.SerializerMethodField()
    is_liked_by_me = serializers.SerializerMethodField()

    class Meta:
        model = UserList
        fields = [
            "id", "user", "name", "slug", "description", "is_public",
            "is_ranked", "likes_count", "title_count", "poster_thumbnails",
            "is_liked_by_me", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "slug", "likes_count", "created_at", "updated_at"]

    def get_poster_thumbnails(self, obj):
        entries = obj.entries.select_related("title").order_by("order")[:4]
        return [e.title.poster_full_url for e in entries if e.title.poster_full_url]

    def get_is_liked_by_me(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def create(self, validated_data):
        user = validated_data["user"]
        base_slug = slugify(validated_data["name"]) or "list"
        slug = base_slug
        counter = 1
        while UserList.objects.filter(user=user, slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        validated_data["slug"] = slug
        return super().create(validated_data)


class UserListDetailSerializer(UserListSerializer):
    entries = UserListEntrySerializer(many=True, read_only=True)

    class Meta(UserListSerializer.Meta):
        fields = UserListSerializer.Meta.fields + ["entries"]


class ActivityLogSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = ActivityLog
        fields = [
            "id", "user", "activity_type", "title",
            "target_user", "review", "created_at",
        ]
