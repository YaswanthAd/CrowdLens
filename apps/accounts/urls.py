from django.urls import path, include
from . import views

urlpatterns = [
    # dj-rest-auth handles login/register/social
    path("", include("dj_rest_auth.urls")),
    path("register/", include("dj_rest_auth.registration.urls")),

    # Profile
    path("profile/", views.ProfileView.as_view(), name="my-profile"),
    path("users/<str:username>/", views.UserDetailView.as_view(), name="user-detail"),
    path("users/<str:username>/follow/", views.follow_user, name="follow-user"),
    path("users/<str:username>/unfollow/", views.unfollow_user, name="unfollow-user"),
]
