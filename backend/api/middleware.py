from __future__ import annotations

from typing import Optional

from api.request_activity import register_request

_SKIP_PATHS = {"/api/health/"}


class RequestActivityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith("/api/") and request.path not in _SKIP_PATHS:
            user = _resolve_user(request)
            if user is not None:
                display = user.username
                profile = getattr(user, "profile", None)
                if profile is not None:
                    display = profile.display_name
                register_request(
                    user.username,
                    display,
                    request.method,
                    request.path,
                )
        return self.get_response(request)


def _resolve_user(request):
    user = request.user
    if user is not None and user.is_authenticated:
        return user
    auth = request.META.get("HTTP_AUTHORIZATION", "")
    if not auth.startswith("Token "):
        return None
    key = auth[6:].strip()
    if not key:
        return None
    try:
        from rest_framework.authtoken.models import Token

        return Token.objects.select_related("user", "user__profile").get(key=key).user
    except Exception:
        return None
