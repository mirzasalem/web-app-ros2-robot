from django.urls import path

from accounts import views

urlpatterns = [
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("auth/login/", views.LoginView.as_view(), name="login"),
    path("auth/logout/", views.LogoutView.as_view(), name="logout"),
    path("auth/me/", views.MeView.as_view(), name="me"),
    path("users/", views.UserListView.as_view(), name="user-list"),
    path("users/<int:user_id>/", views.UserDetailView.as_view(), name="user-detail"),
    path("notifications/", views.NotificationListView.as_view(), name="notifications"),
    path(
        "notifications/read-all/",
        views.NotificationReadAllView.as_view(),
        name="notifications-read-all",
    ),
    path(
        "notifications/<int:notification_id>/read/",
        views.NotificationReadView.as_view(),
        name="notification-read",
    ),
]
