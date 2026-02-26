from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as df

from .models import Title, Genre
from .serializers import TitleListSerializer, TitleDetailSerializer, GenreSerializer


class TitleFilter(df.FilterSet):
    title_type = df.ChoiceFilter(choices=Title.TitleType.choices)
    genre = df.CharFilter(field_name="genres__slug")
    year = df.NumberFilter(field_name="release_date__year")
    year_min = df.NumberFilter(field_name="release_date__year", lookup_expr="gte")
    year_max = df.NumberFilter(field_name="release_date__year", lookup_expr="lte")
    senti_min = df.NumberFilter(field_name="senti_score", lookup_expr="gte")
    rating_min = df.NumberFilter(field_name="avg_user_rating", lookup_expr="gte")
    status = df.ChoiceFilter(choices=Title.Status.choices)

    class Meta:
        model = Title
        fields = ["title_type", "genre", "year", "status"]


class TitleListView(generics.ListAPIView):
    serializer_class = TitleListSerializer
    queryset = Title.objects.prefetch_related("genres").all()
    filterset_class = TitleFilter
    search_fields = ["title", "original_title", "overview"]
    ordering_fields = [
        "release_date", "senti_score", "avg_user_rating",
        "tmdb_rating", "total_user_ratings", "created_at",
    ]
    ordering = ["-release_date"]


class TitleDetailView(generics.RetrieveAPIView):
    serializer_class = TitleDetailSerializer
    queryset = Title.objects.prefetch_related(
        "genres", "directors", "titlecast_set__person"
    ).all()
    lookup_field = "slug"


class TrendingView(generics.ListAPIView):
    serializer_class = TitleListSerializer

    def get_queryset(self):
        return (
            Title.objects
            .filter(senti_score__isnull=False, senti_total_mentions__gte=5)
            .prefetch_related("genres")
            .order_by("-senti_score")[:50]
        )


class GenreListView(generics.ListAPIView):
    serializer_class = GenreSerializer
    queryset = Genre.objects.all()
    pagination_class = None
