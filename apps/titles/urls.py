from django.urls import path
from . import views

urlpatterns = [
    path("", views.TitleListView.as_view(), name="title-list"),
    path("trending/", views.TrendingView.as_view(), name="title-trending"),
    path("genres/", views.GenreListView.as_view(), name="genre-list"),
    path("<slug:slug>/", views.TitleDetailView.as_view(), name="title-detail"),
]
