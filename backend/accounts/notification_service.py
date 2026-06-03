"""Create in-app notifications for robot / ROS events."""

from __future__ import annotations

from typing import TYPE_CHECKING, Iterable, Optional

from django.contrib.auth import get_user_model

from accounts.models import Notification

if TYPE_CHECKING:
    from django.contrib.auth.models import AbstractUser

User = get_user_model()


def notify_user(user: "AbstractUser", *, title: str, message: str) -> Notification:
    return Notification.objects.create(user=user, title=title, message=message)


def notify_users(users: Iterable["AbstractUser"], *, title: str, message: str) -> None:
    for user in users:
        notify_user(user, title=title, message=message)


def notify_others(
    actor: "AbstractUser",
    *,
    title: str,
    message: str,
) -> None:
    """Notify every user except the actor."""
    others = User.objects.exclude(pk=actor.pk)
    notify_users(others, title=title, message=message)


def display_name(user: "AbstractUser") -> str:
    profile = getattr(user, "profile", None)
    if profile is not None and profile.display_name:
        return profile.display_name
    return user.username
