from rest_framework import serializers
from .models import User, Follow


class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.ReadOnlyField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "username", "display_name", "bio", "avatar", "avatar_url",
            "header_image", "location", "website", "twitter_handle",
            "letterboxd_username", "mal_username", "is_private",
            "total_titles_watched", "total_reviews",
            "followers_count", "following_count", "date_joined",
        ]
        read_only_fields = ["id", "date_joined", "total_titles_watched", "total_reviews"]

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()


class UserMinimalSerializer(serializers.ModelSerializer):
    avatar_url = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = ["id", "username", "display_name", "avatar_url"]


class FollowSerializer(serializers.ModelSerializer):
    follower = UserMinimalSerializer(read_only=True)
    following = UserMinimalSerializer(read_only=True)

    class Meta:
        model = Follow
        fields = ["id", "follower", "following", "created_at"]
