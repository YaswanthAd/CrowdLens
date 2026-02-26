from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Review, ReviewLike, Watchlist, UserList, ActivityLog
from .serializers import (
    ReviewSerializer, ReviewCreateSerializer,
    WatchlistSerializer, UserListSerializer, ActivityLogSerializer,
)


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user


class ReviewListView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer

    def get_queryset(self):
        qs = Review.objects.select_related("user", "title").all()
        title_id = self.request.query_params.get("title")
        if title_id:
            qs = qs.filter(title_id=title_id)
        username = self.request.query_params.get("user")
        if username:
            qs = qs.filter(user__username=username)
        return qs

    def perform_create(self, serializer):
        review = serializer.save(user=self.request.user)
        ActivityLog.objects.create(
            user=self.request.user,
            activity_type=ActivityLog.ActivityType.REVIEWED,
            title=review.title,
            review=review,
        )


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReviewSerializer
    queryset = Review.objects.all()
    permission_classes = [IsOwnerOrReadOnly]


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def like_review(request, pk):
    review = get_object_or_404(Review, pk=pk)
    _, created = ReviewLike.objects.get_or_create(user=request.user, review=review)
    if created:
        review.likes_count += 1
        review.save(update_fields=["likes_count"])
    return Response({"likes_count": review.likes_count})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def unlike_review(request, pk):
    review = get_object_or_404(Review, pk=pk)
    deleted, _ = ReviewLike.objects.filter(user=request.user, review=review).delete()
    if deleted:
        review.likes_count = max(0, review.likes_count - 1)
        review.save(update_fields=["likes_count"])
    return Response({"likes_count": review.likes_count})


class WatchlistView(generics.ListCreateAPIView):
    serializer_class = WatchlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Watchlist.objects.filter(user=self.request.user).select_related("title")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WatchlistRemoveView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Watchlist.objects.filter(user=self.request.user)


class UserListView(generics.ListCreateAPIView):
    serializer_class = UserListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserList.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ActivityFeedView(generics.ListAPIView):
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        following_ids = self.request.user.following.values_list("following_id", flat=True)
        return (
            ActivityLog.objects
            .filter(user_id__in=following_ids)
            .select_related("user")
            .order_by("-created_at")
        )
