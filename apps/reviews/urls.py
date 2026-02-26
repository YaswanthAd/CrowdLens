from django.urls import path
from . import views

urlpatterns = [
    path("", views.ReviewListView.as_view(), name="review-list"),
    path("<int:pk>/", views.ReviewDetailView.as_view(), name="review-detail"),
    path("<int:pk>/like/", views.like_review, name="review-like"),
    path("<int:pk>/unlike/", views.unlike_review, name="review-unlike"),

    path("watchlist/", views.WatchlistView.as_view(), name="watchlist"),
    path("watchlist/<int:pk>/", views.WatchlistRemoveView.as_view(), name="watchlist-remove"),

    path("lists/", views.UserListView.as_view(), name="user-lists"),

    path("feed/", views.ActivityFeedView.as_view(), name="activity-feed"),
]
