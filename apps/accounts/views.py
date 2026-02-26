from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import User, Follow
from .serializers import UserSerializer, UserMinimalSerializer


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserDetailView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    queryset = User.objects.all()
    lookup_field = "username"


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def follow_user(request, username):
    target = get_object_or_404(User, username=username)
    if target == request.user:
        return Response(
            {"error": "You cannot follow yourself."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    follow, created = Follow.objects.get_or_create(
        follower=request.user, following=target
    )
    if not created:
        return Response({"status": "already_following"})
    return Response({"status": "followed"}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def unfollow_user(request, username):
    target = get_object_or_404(User, username=username)
    deleted, _ = Follow.objects.filter(
        follower=request.user, following=target
    ).delete()
    if deleted:
        return Response({"status": "unfollowed"})
    return Response({"status": "not_following"})
