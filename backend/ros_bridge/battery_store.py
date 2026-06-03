"""Battery voltage and state of charge for the web UI (ROS topic or mock env)."""

from __future__ import annotations

import os
import threading
import time
from typing import Any

try:
    from sensor_msgs.msg import BatteryState as RosBatteryState

    BATTERY_MSG_AVAILABLE = True
except ImportError:
    RosBatteryState = None  # type: ignore[misc, assignment]
    BATTERY_MSG_AVAILABLE = False

BATTERY_STALE_SEC = 5.0


def default_battery_topic() -> str:
    return os.environ.get("BUDDY_WEB_BATTERY_TOPIC", "/battery_state")


def _mock_from_env() -> dict[str, Any] | None:
    voltage_raw = os.environ.get("BUDDY_BATTERY_MOCK_VOLTAGE", "").strip()
    percent_raw = os.environ.get("BUDDY_BATTERY_MOCK_PERCENT", "").strip()
    if not voltage_raw and not percent_raw:
        return None
    voltage = float(voltage_raw) if voltage_raw else None
    percentage = float(percent_raw) if percent_raw else None
    return {
        "voltage": voltage,
        "percentage": percentage,
        "available": voltage is not None or percentage is not None,
        "live": True,
        "topic": default_battery_topic(),
        "source": "mock",
        "last_update_sec": time.time(),
    }


def _normalize_percentage(value: float) -> float:
    """ROS BatteryState.percentage is often 0–1; API uses 0–100."""
    if value <= 1.0:
        return max(0.0, min(100.0, value * 100.0))
    return max(0.0, min(100.0, value))


class BatteryStore:
    """Thread-safe cache of the latest battery reading."""

    _instance: "BatteryStore | None" = None
    _lock = threading.Lock()

    def __init__(self) -> None:
        self._data_lock = threading.Lock()
        self._voltage: float | None = None
        self._percentage: float | None = None
        self._last_update_sec: float | None = None
        self._topic = default_battery_topic()

    @classmethod
    def instance(cls) -> "BatteryStore":
        with cls._lock:
            if cls._instance is None:
                cls._instance = cls()
            return cls._instance

    def update_from_ros(self, msg: Any) -> None:
        voltage = float(msg.voltage) if msg.voltage is not None else None
        percentage: float | None = None
        if hasattr(msg, "percentage") and msg.percentage is not None:
            percentage = _normalize_percentage(float(msg.percentage))

        with self._data_lock:
            self._voltage = voltage
            self._percentage = percentage
            self._last_update_sec = time.time()

    def get_payload(self) -> dict[str, Any]:
        mock = _mock_from_env()
        if mock is not None:
            return {
                "voltage": mock["voltage"],
                "percentage": mock["percentage"],
                "available": mock["available"],
                "live": mock["live"],
                "topic": mock["topic"],
                "source": mock["source"],
            }

        with self._data_lock:
            voltage = self._voltage
            percentage = self._percentage
            last = self._last_update_sec
            topic = self._topic

        live = last is not None and (time.time() - last) < BATTERY_STALE_SEC
        available = voltage is not None or percentage is not None

        return {
            "voltage": voltage,
            "percentage": percentage,
            "available": available,
            "live": live and available,
            "topic": topic,
            "source": "ros" if available else "none",
        }
