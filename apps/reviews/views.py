from django.db.models import Max
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Review, ReviewLike, Watchlist, UserList, UserListEntry, UserListLike, ActivityLog
from .serializers import (
    ReviewSerializer, ReviewCreateSerializer,
    WatchlistSerializer, UserListSerializer, UserListDetailSerializer,
    UserListEntrySerializer, ActivityLogSerializer,
)


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user


# ── Reviews ────────────────────────────────────────────────────────────────────

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


# ── Watchlist ──────────────────────────────────────────────────────────────────

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


# ── User Lists ─────────────────────────────────────────────────────────────────

class UserListView(generics.ListCreateAPIView):
    serializer_class = UserListSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = UserList.objects.select_related("user").prefetch_related("entries__title")

        username = self.request.query_params.get("username")
        if username:
            # Owner sees their own private lists; others see only public
            if self.request.user.is_authenticated and self.request.user.username == username:
                return qs.filter(user__username=username)
            return qs.filter(user__username=username, is_public=True)

        # ?mine=true — current user's lists including private
        if self.request.query_params.get("mine") and self.request.user.is_authenticated:
            return qs.filter(user=self.request.user)

        # Default: browse all public lists
        return qs.filter(is_public=True)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class UserListDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsOwnerOrReadOnly]

    def get_serializer_class(self):
        if self.request.method in permissions.SAFE_METHODS:
            return UserListDetailSerializer
        return UserListSerializer

    def get_queryset(self):
        return UserList.objects.select_related("user").prefetch_related("entries__title")

    def get_object(self):
        obj = get_object_or_404(UserList, pk=self.kwargs["pk"])
        if not obj.is_public:
            if not self.request.user.is_authenticated or self.request.user != obj.user:
                raise PermissionDenied("This list is private.")
        self.check_object_permissions(self.request, obj)
        return obj


class UserListEntriesView(generics.ListCreateAPIView):
    serializer_class = UserListEntrySerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return (
            UserListEntry.objects
            .filter(user_list_id=self.kwargs["pk"])
            .select_related("title")
            .order_by("order")
        )

    def perform_create(self, serializer):
        user_list = get_object_or_404(UserList, pk=self.kwargs["pk"])
        if user_list.user != self.request.user:
            raise PermissionDenied("You do not own this list.")
        max_order = (
            UserListEntry.objects
            .filter(user_list=user_list)
            .aggregate(Max("order"))["order__max"]
        ) or 0
        serializer.save(user_list=user_list, order=max_order + 1)


class UserListEntryDetailView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        entry = get_object_or_404(
            UserListEntry,
            pk=self.kwargs["entry_pk"],
            user_list_id=self.kwargs["pk"],
        )
        if entry.user_list.user != self.request.user:
            raise PermissionDenied("You do not own this list.")
        return entry


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def reorder_list_entries(request, pk):
    user_list = get_object_or_404(UserList, pk=pk)
    if user_list.user != request.user:
        return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
    order = request.data.get("order", [])  # list of entry IDs in new order
    for idx, entry_id in enumerate(order):
        UserListEntry.objects.filter(pk=entry_id, user_list=user_list).update(order=idx)
    return Response({"status": "ok"})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def like_list(request, pk):
    user_list = get_object_or_404(UserList, pk=pk)
    _, created = UserListLike.objects.get_or_create(user=request.user, user_list=user_list)
    if created:
        user_list.likes_count += 1
        user_list.save(update_fields=["likes_count"])
    return Response({"likes_count": user_list.likes_count})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def unlike_list(request, pk):
    user_list = get_object_or_404(UserList, pk=pk)
    deleted, _ = UserListLike.objects.filter(user=request.user, user_list=user_list).delete()
    if deleted:
        user_list.likes_count = max(0, user_list.likes_count - 1)
        user_list.save(update_fields=["likes_count"])
    return Response({"likes_count": user_list.likes_count})


# ── Activity Feed ──────────────────────────────────────────────────────────────

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
