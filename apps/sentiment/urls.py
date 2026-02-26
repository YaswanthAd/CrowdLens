from django.urls import path
from . import views

urlpatterns = [
    path(
        "titles/<int:title_id>/mentions/",
        views.TitleMentionsView.as_view(),
        name="title-mentions",
    ),
    path(
        "titles/<int:title_id>/history/",
        views.TitleSentimentHistoryView.as_view(),
        name="title-sentiment-history",
    ),
    path(
        "titles/<int:title_id>/scrape/",
        views.trigger_scrape,
        name="trigger-scrape",
    ),
    path(
        "titles/<int:title_id>/recompute/",
        views.trigger_recompute,
        name="trigger-recompute",
    ),
]
