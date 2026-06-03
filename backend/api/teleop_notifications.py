"""Teleop session notifications (start, stop, success, ROS errors)."""

from __future__ import annotations

import threading
import time
from typing import Any, Optional

from django.contrib.auth import get_user_model

from accounts.notification_service import display_name, notify_others, notify_user

User = get_user_model()

MOVE_EPS = 0.001
ERROR_THROTTLE_SEC = 20.0
ROS_ERROR_THROTTLE_SEC = 15.0


def _is_moving(linear: float, angular: float) -> bool:
    return abs(linear) > MOVE_EPS or abs(angular) > MOVE_EPS


class TeleopNotificationService:
    _lock = threading.Lock()
    _driving: set[str] = set()
    _last_error_sec: dict[str, float] = {}
    _last_ros_error_sec: dict[str, float] = {}
    _ros_error_seen: set[str] = set()

    @classmethod
    def handle_command(
        cls,
        user: Optional[Any],
        *,
        linear: float,
        angular: float,
        result: dict[str, Any],
        stopping: bool = False,
    ) -> None:
        if user is None or not getattr(user, "is_authenticated", False):
            return

        username = user.username
        moving = _is_moving(linear, angular) and not stopping
        ok = bool(result.get("ok"))
        published = bool(result.get("published"))
        error = result.get("error")
        warning = result.get("warning")

        with cls._lock:
            was_driving = username in cls._driving

            if moving and not was_driving:
                if ok and published:
                    cls._driving.add(username)
                    cls._notify_drive_start(user, linear, angular)
                elif error:
                    cls._maybe_notify_command_error(
                        user,
                        error,
                    )

            if stopping or (was_driving and not moving and ok):
                if username in cls._driving:
                    cls._driving.discard(username)
                    cls._notify_drive_stop(user, ok, published, error, warning)

            if not ok or error:
                cls._maybe_notify_command_error(user, error or "Drive command failed")

            elif warning and moving:
                cls._maybe_notify_warning(user, warning)

    @classmethod
    def _notify_drive_start(cls, user: Any, linear: float, angular: float) -> None:
        name = display_name(user)
        notify_user(
            user,
            title="Robot control started",
            message=(
                f"Your drive command was sent to ROS (linear {linear:.2f} m/s, "
                f"angular {angular:.2f} rad/s)."
            ),
        )
        notify_others(
            user,
            title="Robot in use",
            message=f"{name} started driving Buddy via the web teleop.",
        )

    @classmethod
    def _notify_drive_stop(
        cls,
        user: Any,
        ok: bool,
        published: bool,
        error: Optional[str],
        warning: Optional[str],
    ) -> None:
        name = display_name(user)
        if ok and published:
            notify_user(
                user,
                title="Robot stopped",
                message="Stop command sent to ROS successfully. The robot should be halted.",
            )
            notify_others(
                user,
                title="Robot released",
                message=f"{name} stopped web teleop control.",
            )
        elif ok and not published and warning:
            notify_user(
                user,
                title="Robot stopped (simulated)",
                message=warning,
            )
        elif error:
            notify_user(
                user,
                title="Stop command failed",
                message=str(error),
            )

    @classmethod
    def _maybe_notify_command_error(cls, user: Any, message: str) -> None:
        now = time.time()
        key = user.username
        with cls._lock:
            last = cls._last_error_sec.get(key, 0.0)
            if now - last < ERROR_THROTTLE_SEC:
                return
            cls._last_error_sec[key] = now
        notify_user(
            user,
            title="ROS teleop failed",
            message=message,
        )

    @classmethod
    def _maybe_notify_warning(cls, user: Any, message: str) -> None:
        now = time.time()
        key = user.username
        with cls._lock:
            last = cls._last_error_sec.get(key, 0.0)
            if now - last < ERROR_THROTTLE_SEC:
                return
            cls._last_error_sec[key] = now
        notify_user(
            user,
            title="ROS teleop warning",
            message=message,
        )

    @classmethod
    def handle_ros_log(
        cls,
        *,
        level: int,
        node_name: str,
        text: str,
        error_level: int,
    ) -> None:
        """Forward ROS ERROR/FATAL logs to users currently driving."""
        if level < error_level:
            return
        text = (text or "").strip()
        if not text:
            return

        fingerprint = f"{node_name}:{text[:120]}"
        now = time.time()

        with cls._lock:
            drivers = list(cls._driving)
            if not drivers:
                return
            if fingerprint in cls._ros_error_seen:
                return
            due = []
            for username in drivers:
                last = cls._last_ros_error_sec.get(username, 0.0)
                if now - last >= ROS_ERROR_THROTTLE_SEC:
                    due.append(username)
                    cls._last_ros_error_sec[username] = now
            if not due:
                return
            cls._ros_error_seen.add(fingerprint)
            if len(cls._ros_error_seen) > 200:
                cls._ros_error_seen.clear()

        users = User.objects.filter(username__in=due).select_related("profile")
        title = "ROS error"
        message = f"[{node_name}] {text}"
        for user in users:
            notify_user(user, title=title, message=message)

    @classmethod
    def reset(cls) -> None:
        with cls._lock:
            cls._driving.clear()
            cls._last_error_sec.clear()
            cls._last_ros_error_sec.clear()
            cls._ros_error_seen.clear()
