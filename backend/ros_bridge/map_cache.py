"""Thread-safe cache for the occupancy grid shown in the web dashboard."""

from __future__ import annotations

import threading
import time
from typing import Any

from pathlib import Path

from ros_bridge.map_loader import load_map_from_yaml


class MapCache:
    _instance: "MapCache | None" = None
    _lock = threading.Lock()

    def __init__(self) -> None:
        self._data_lock = threading.Lock()
        self._map: dict[str, Any] | None = None
        self._updated_at: float | None = None
        self._load_static_fallback()

    @classmethod
    def instance(cls) -> "MapCache":
        with cls._lock:
            if cls._instance is None:
                cls._instance = cls()
            return cls._instance

    def _load_static_fallback(self) -> None:
        try:
            payload = load_map_from_yaml()
            with self._data_lock:
                self._map = payload
                self._updated_at = time.time()
        except FileNotFoundError:
            with self._data_lock:
                self._map = None

    def update_from_ros(self, payload: dict[str, Any]) -> None:
        with self._data_lock:
            self._map = payload
            self._updated_at = time.time()

    def get_map(self) -> dict[str, Any]:
        with self._data_lock:
            if self._map is None:
                self._load_static_fallback()
            if self._map is None:
                return {
                    "available": False,
                    "detail": "No map file found. Set BUDDY_MAP_YAML or run Nav2/map_server.",
                }
            return {
                "available": True,
                "updated_at": self._updated_at,
                **self._map,
            }

    def reload_file(self) -> dict[str, Any]:
        self._load_static_fallback()
        return self.get_map()

    def load_from_yaml(self, yaml_path: Path | str) -> dict[str, Any]:
        """Load a specific map file (e.g. when localization starts)."""
        path = Path(yaml_path)
        payload = load_map_from_yaml(path)
        payload["source"] = "localization"
        with self._data_lock:
            self._map = payload
            self._updated_at = time.time()
        return self.get_map()
