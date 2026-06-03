from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Notification, UserProfile
from accounts.permissions import IsAdminUser
from accounts.serializers import (
    LoginSerializer,
    NotificationSerializer,
    RegisterSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
)


def _profile_payload(profile: UserProfile) -> dict:
    return UserProfileSerializer(profile).data


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "token": token.key,
                "user": _profile_payload(user.profile),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, _ = Token.objects.get_or_create(user=user)
        profile = user.profile
        return Response(
            {
                "token": token.key,
                "user": _profile_payload(profile),
            }
        )


class LogoutView(APIView):
    def post(self, request: Request) -> Response:
        Token.objects.filter(user=request.user).delete()
        return Response({"detail": "Logged out."})


class MeView(APIView):
    def get(self, request: Request) -> Response:
        return Response(_profile_payload(request.user.profile))

    def patch(self, request: Request) -> Response:
        is_admin = request.user.is_staff or request.user.is_superuser
        if not is_admin:
            restricted = {"display_name", "position_x", "position_y"} & request.data.keys()
            if restricted:
                return Response(
                    {
                        "detail": (
                            "Only an admin can change your name or map position. "
                            "Set them at signup or ask an admin."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

        profile = request.user.profile
        serializer = UserProfileUpdateSerializer(
            profile, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(_profile_payload(profile))


class UserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        profiles = UserProfile.objects.select_related("user").all()
        return Response([_profile_payload(p) for p in profiles])


class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request: Request, user_id: int) -> Response:
        try:
            profile = UserProfile.objects.select_related("user").get(
                user_id=user_id
            )
        except UserProfile.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

        is_admin = request.user.is_staff or request.user.is_superuser
        if not is_admin:
            return Response(
                {"detail": "Only admins can edit other users."},
                status=status.HTTP_403_FORBIDDEN,
            )

        email = request.data.get("email")
        if email is not None:
            profile.user.email = str(email).strip().lower()
            profile.user.save(update_fields=["email"])

        serializer = UserProfileUpdateSerializer(
            profile, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        profile.user.refresh_from_db()
        return Response(_profile_payload(profile))


class NotificationListView(APIView):
    def get(self, request: Request) -> Response:
        qs = Notification.objects.filter(user=request.user)
        return Response(NotificationSerializer(qs, many=True).data)


class NotificationReadView(APIView):
    def post(self, request: Request, notification_id: int) -> Response:
        try:
            note = Notification.objects.get(id=notification_id, user=request.user)
        except Notification.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)
        note.read = True
        note.save(update_fields=["read"])
        return Response(NotificationSerializer(note).data)


class NotificationReadAllView(APIView):
    def post(self, request: Request) -> Response:
        updated = Notification.objects.filter(user=request.user, read=False).update(
            read=True
        )
        return Response({"marked_read": updated})
