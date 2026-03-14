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
    path("lists/<int:pk>/", views.UserListDetailView.as_view(), name="user-list-detail"),
    path("lists/<int:pk>/entries/", views.UserListEntriesView.as_view(), name="user-list-entries"),
    path("lists/<int:pk>/entries/<int:entry_pk>/", views.UserListEntryDetailView.as_view(), name="user-list-entry-detail"),
    path("lists/<int:pk>/reorder/", views.reorder_list_entries, name="user-list-reorder"),
    path("lists/<int:pk>/like/", views.like_list, name="user-list-like"),
    path("lists/<int:pk>/unlike/", views.unlike_list, name="user-list-unlike"),

    path("feed/", views.ActivityFeedView.as_view(), name="activity-feed"),
]
