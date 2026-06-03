"""Track who is actively calling the Buddy API."""

from __future__ import annotations

import threading
import time
from typing import Optional

ACTIVE_TIMEOUT_SEC = 12.0

_ACTION_LABELS = {
    ("GET", "/api/status/"): "Checking robot status",
    ("GET", "/api/map/"): "Loading map",
    ("GET", "/api/users/"): "Loading users",
    ("GET", "/api/notifications/"): "Loading notifications",
    ("GET", "/api/auth/me/"): "Loading profile",
    ("POST", "/api/teleop/"): "Sending drive commands",
    ("DELETE", "/api/teleop/"): "Stopping robot",
    ("POST", "/api/stop/"): "Stopping robot",
    ("GET", "/api/mapping/status/"): "Checking mapping status",
    ("POST", "/api/mapping/start/"): "Starting SLAM mapping",
    ("POST", "/api/mapping/stop/"): "Stopping SLAM mapping",
    ("GET", "/api/localization/maps/"): "Listing saved maps",
    ("GET", "/api/localization/status/"): "Checking localization status",
    ("POST", "/api/localization/start/"): "Starting AMCL localization",
    ("POST", "/api/localization/stop/"): "Stopping localization",
    ("PATCH", "/api/users/"): "Updating user data",
}


def describe_request(method: str, path: str) -> str:
    key = (method.upper(), path.rstrip("/") + "/")
    if key in _ACTION_LABELS:
        return _ACTION_LABELS[key]
    if path.startswith("/api/users/") and method.upper() == "PATCH":
        return "Updating user data"
    return f"{method.upper()} {path}"


class RequestActivityTracker:
    _lock = threading.Lock()
    _sessions: dict[str, dict] = {}

    @classmethod
    def register(
        cls,
        *,
        username: str,
        display_name: str,
        method: str,
        path: str,
    ) -> None:
        now = time.time()
        action = describe_request(method, path)
        with cls._lock:
            cls._sessions[username] = {
                "username": username,
                "user": display_name,
                "action": action,
                "path": path,
                "method": method.upper(),
                "last_sec": now,
            }

    @classmethod
    def active_requesters(cls) -> list[dict]:
        now = time.time()
        with cls._lock:
            rows = []
            stale = []
            for username, row in cls._sessions.items():
                age = now - row["last_sec"]
                if age > ACTIVE_TIMEOUT_SEC:
                    stale.append(username)
                    continue
                rows.append(
                    {
                        "username": row["username"],
                        "user": row["user"],
                        "action": row["action"],
                        "path": row["path"],
                        "method": row["method"],
                        "seconds_ago": round(age, 1),
                    }
                )
            for username in stale:
                del cls._sessions[username]
        rows.sort(key=lambda r: r["seconds_ago"])
        return rows


def register_request(
    username: str,
    display_name: str,
    method: str,
    path: str,
) -> None:
    RequestActivityTracker.register(
        username=username,
        display_name=display_name,
        method=method,
        path=path,
    )


def get_active_requesters() -> list[dict]:
    return RequestActivityTracker.active_requesters()


def get_activity_summary(current_username: Optional[str] = None) -> dict:
    """Summarize API activity, with a clear others_active flag for the dashboard."""
    requesters = get_active_requesters()
    if current_username:
        others = [r for r in requesters if r["username"] != current_username]
    else:
        others = list(requesters)
    return {
        "anyone_active": len(requesters) > 0,
        "others_active": len(others) > 0,
        "others_count": len(others),
        "other_requesters": others,
    }
