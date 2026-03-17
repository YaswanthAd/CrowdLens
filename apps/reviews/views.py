import calendar
from datetime import date
from django.db.models import Max
from django.utils import timezone
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


# ── Recap ─────────────────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def recap(request):
    year = int(request.query_params.get("year", timezone.now().year))

    from django.db.models import Q
    reviews = (
        Review.objects
        .filter(user=request.user)
        .filter(
            Q(watched_date__year=year) |
            Q(watched_date__isnull=True, created_at__year=year)
        )
        .select_related("title")
        .prefetch_related("title__genres")
    )

    if not reviews.exists():
        return Response({"year": year, "empty": True})

    # ── Totals ──
    total = reviews.count()
    total_minutes = sum(r.title.runtime_minutes or 0 for r in reviews)
    total_hours = round(total_minutes / 60)

    # ── Type breakdown ──
    type_counts = {}
    type_ratings = {}
    for r in reviews:
        t = r.title.title_type
        type_counts[t] = type_counts.get(t, 0) + 1
        if r.rating is not None:
            type_ratings.setdefault(t, []).append(r.rating)
    type_avg_ratings = {t: round(sum(v) / len(v), 2) for t, v in type_ratings.items()}
    highest_rated_type = max(type_avg_ratings, key=type_avg_ratings.get) if type_avg_ratings else None

    # ── Ratings ──
    rated = [r.rating for r in reviews if r.rating is not None]
    avg_rating = round(sum(rated) / len(rated), 2) if rated else None
    perfect_scores = sum(1 for r in rated if r == 5.0)
    low_scores = sum(1 for r in rated if r <= 2.0)

    rating_distribution = {}
    for r in rated:
        key = str(r)
        rating_distribution[key] = rating_distribution.get(key, 0) + 1

    # ── Monthly patterns ──
    month_counts = {}
    month_ratings = {}
    for r in reviews:
        d = r.watched_date or r.created_at.date()
        m = d.month
        month_counts[m] = month_counts.get(m, 0) + 1
        if r.rating is not None:
            month_ratings.setdefault(m, []).append(r.rating)

    month_avg = {m: round(sum(v) / len(v), 2) for m, v in month_ratings.items() if len(v) >= 2}
    most_active_month = max(month_counts, key=month_counts.get) if month_counts else None
    harshest_month = min(month_avg, key=month_avg.get) if month_avg else None
    most_generous_month = max(month_avg, key=month_avg.get) if month_avg else None

    months_chart = [
        {"month": calendar.month_abbr[m], "count": month_counts.get(m, 0)}
        for m in range(1, 13)
    ]

    # ── Day of week ──
    dow_counts = [0] * 7
    for r in reviews:
        d = r.watched_date or r.created_at.date()
        dow_counts[d.weekday()] += 1
    dow_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    most_active_dow = dow_names[dow_counts.index(max(dow_counts))]

    # ── Genres ──
    genre_counts = {}
    genre_ratings = {}
    for r in reviews:
        for g in r.title.genres.all():
            genre_counts[g.name] = genre_counts.get(g.name, 0) + 1
            if r.rating is not None:
                genre_ratings.setdefault(g.name, []).append(r.rating)
    top_genre = max(genre_counts, key=genre_counts.get) if genre_counts else None
    genre_avg_ratings = {g: round(sum(v) / len(v), 2) for g, v in genre_ratings.items() if len(v) >= 2}
    highest_rated_genre = max(genre_avg_ratings, key=genre_avg_ratings.get) if genre_avg_ratings else None
    lowest_rated_genre = min(genre_avg_ratings, key=genre_avg_ratings.get) if len(genre_avg_ratings) > 1 else None
    top_genres_chart = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)[:6]

    # ── Discovery lag ──
    today = date.today()
    lags = []
    for r in reviews:
        if r.title.release_date:
            watched = r.watched_date or r.created_at.date()
            lag = (watched - r.title.release_date).days
            if lag >= 0:
                lags.append(lag)
    avg_lag_days = round(sum(lags) / len(lags)) if lags else None

    # ── Era / decade ──
    decade_counts = {}
    for r in reviews:
        if r.title.release_date:
            decade = (r.title.release_date.year // 10) * 10
            decade_counts[decade] = decade_counts.get(decade, 0) + 1
    top_decade = max(decade_counts, key=decade_counts.get) if decade_counts else None

    # ── Oldest title watched ──
    with_release = [(r.title.title, r.title.release_date.year) for r in reviews if r.title.release_date]
    oldest_title = min(with_release, key=lambda x: x[1]) if with_release else None

    # ── Reviews written ──
    reviews_written = sum(1 for r in reviews if r.review_text and r.review_text.strip())

    # ── Personality tag ──
    if avg_rating and avg_rating >= 4.0:
        personality = ("Easy Pleaser", "You love almost everything you watch.")
    elif avg_rating and avg_rating <= 2.5:
        personality = ("Tough Crowd", "You hold your 5 stars like a secret.")
    elif perfect_scores == 0:
        personality = ("The Holdout", "You haven't given a single perfect score.")
    elif perfect_scores >= 5:
        personality = ("Generous Soul", "You hand out perfect scores like candy.")
    elif highest_rated_type == "anime":
        personality = ("Anime Head", "Anime is your highest-rated category by far.")
    elif highest_rated_type == "tv":
        personality = ("Binge Machine", "You rate TV above everything else.")
    else:
        personality = ("Film Purist", "Movies are where your heart is.")

    return Response({
        "year": year,
        "empty": False,
        "total": total,
        "total_hours": total_hours,
        "total_minutes": total_minutes,
        "type_counts": type_counts,
        "type_avg_ratings": type_avg_ratings,
        "highest_rated_type": highest_rated_type,
        "avg_rating": avg_rating,
        "perfect_scores": perfect_scores,
        "low_scores": low_scores,
        "rating_distribution": rating_distribution,
        "most_active_month": calendar.month_name[most_active_month] if most_active_month else None,
        "most_active_month_count": month_counts.get(most_active_month) if most_active_month else None,
        "harshest_month": calendar.month_name[harshest_month] if harshest_month else None,
        "harshest_month_avg": month_avg.get(harshest_month) if harshest_month else None,
        "most_generous_month": calendar.month_name[most_generous_month] if most_generous_month else None,
        "most_generous_month_avg": month_avg.get(most_generous_month) if most_generous_month else None,
        "most_active_dow": most_active_dow,
        "months_chart": months_chart,
        "top_genre": top_genre,
        "top_genre_count": genre_counts.get(top_genre) if top_genre else None,
        "highest_rated_genre": highest_rated_genre,
        "highest_rated_genre_avg": genre_avg_ratings.get(highest_rated_genre) if highest_rated_genre else None,
        "lowest_rated_genre": lowest_rated_genre,
        "lowest_rated_genre_avg": genre_avg_ratings.get(lowest_rated_genre) if lowest_rated_genre else None,
        "top_genres_chart": [{"genre": g, "count": c} for g, c in top_genres_chart],
        "avg_lag_days": avg_lag_days,
        "top_decade": top_decade,
        "oldest_title": {"title": oldest_title[0], "year": oldest_title[1]} if oldest_title else None,
        "reviews_written": reviews_written,
        "personality": {"label": personality[0], "description": personality[1]},
    })


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
