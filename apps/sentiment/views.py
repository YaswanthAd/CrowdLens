from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import SentimentMention, SentimentSnapshot
from .serializers import SentimentMentionSerializer, SentimentSnapshotSerializer


class TitleMentionsView(generics.ListAPIView):
    serializer_class = SentimentMentionSerializer

    def get_queryset(self):
        title_id = self.kwargs["title_id"]
        qs = SentimentMention.objects.filter(title_id=title_id, is_processed=True)

        source = self.request.query_params.get("source")
        if source:
            qs = qs.filter(source=source)

        sentiment = self.request.query_params.get("sentiment")
        if sentiment:
            qs = qs.filter(sentiment=sentiment)

        return qs.order_by("-posted_at")


class TitleSentimentHistoryView(generics.ListAPIView):
    serializer_class = SentimentSnapshotSerializer
    pagination_class = None

    def get_queryset(self):
        title_id = self.kwargs["title_id"]
        period = self.request.query_params.get("period", "daily")
        return (
            SentimentSnapshot.objects
            .filter(title_id=title_id, period=period)
            .order_by("snapshot_date")
        )


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def trigger_scrape(request, title_id):
    return Response(
        {"status": "queued", "title_id": title_id},
        status=status.HTTP_202_ACCEPTED,
    )


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def trigger_recompute(request, title_id):
    return Response(
        {"status": "queued", "title_id": title_id},
        status=status.HTTP_202_ACCEPTED,
    )
