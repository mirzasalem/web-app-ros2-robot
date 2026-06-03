"""Start/stop Buddy AMCL + Nav2 localization for a chosen map."""

from __future__ import annotations

import os
import shlex
import signal
import subprocess
import threading
import time
from typing import Optional, TextIO

from ros_bridge.launch_subprocess import (
    bash_ros_overlay_snippet,
    close_quietly,
    open_launch_log_stream,
    resolve_setup_path,
    validate_ros_workspace_setups,
)
from ros_bridge.map_cache import MapCache
from ros_bridge.map_catalog import resolve_map_yaml

ROS_DISABLED = os.environ.get("BUDDY_WEB_DISABLE_ROS", "").lower() in ("1", "true", "yes")
USE_SIM = os.environ.get("BUDDY_LOCALIZATION_SIM", "").lower() in ("1", "true", "yes")
LAUNCH_FILE = os.environ.get(
    "BUDDY_LOCALIZATION_LAUNCH",
    "sim_navigation.launch.py" if USE_SIM else "robot_navigation.launch.py",
)
ROS_SETUP = os.environ.get("BUDDY_ROS_SETUP", "/opt/ros/jazzy/setup.bash")
WS_SETUP = os.environ.get(
    "BUDDY_WS_SETUP",
    os.path.expanduser("~/ros2_ws/install/setup.bash"),
)


class LocalizationManager:
    """Runs `ros2 launch buddy <navigation launch> map:=<yaml>`."""

    _instance: Optional["LocalizationManager"] = None
    _inst_lock = threading.Lock()

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._process: Optional[subprocess.Popen] = None
        self._launch_log_file: Optional[TextIO] = None
        self._started_by: Optional[str] = None
        self._started_display: Optional[str] = None
        self._started_at: Optional[float] = None
        self._map_id: Optional[str] = None
        self._map_yaml: Optional[str] = None
        self._simulated = False

    @classmethod
    def instance(cls) -> "LocalizationManager":
        with cls._inst_lock:
            if cls._instance is None:
                cls._instance = cls()
            return cls._instance

    def _close_launch_log_locked(self) -> None:
        close_quietly(self._launch_log_file)
        self._launch_log_file = None

    def _is_running_locked(self) -> bool:
        if self._simulated:
            return True
        if self._process is None:
            return False
        code = self._process.poll()
        if code is not None:
            self._process = None
            self._started_by = None
            self._started_display = None
            self._started_at = None
            self._map_id = None
            self._map_yaml = None
            self._close_launch_log_locked()
            return False
        return True

    def get_status(self) -> dict:
        with self._lock:
            running = self._is_running_locked()
            return {
                "running": running,
                "ros_disabled": ROS_DISABLED,
                "launch": LAUNCH_FILE,
                "sim": USE_SIM,
                "map_id": self._map_id if running else None,
                "map_yaml": self._map_yaml if running else None,
                "started_by": self._started_by if running else None,
                "started_by_display": self._started_display if running else None,
                "started_at": self._started_at,
                "pid": self._process.pid if running and self._process else None,
                "ros_setup_path": resolve_setup_path(ROS_SETUP),
                "ws_setup_path": resolve_setup_path(WS_SETUP),
                "setup_files_ok": os.path.isfile(resolve_setup_path(ROS_SETUP))
                and os.path.isfile(resolve_setup_path(WS_SETUP)),
            }

    def start(self, *, map_id: str, username: str, display_name: str) -> dict:
        from ros_bridge.mapping_manager import MappingManager

        yaml_path = resolve_map_yaml(map_id)
        if MappingManager.instance().get_status().get("running"):
            raise RuntimeError("Stop SLAM mapping before starting localization.")

        MapCache.instance().load_from_yaml(yaml_path)

        with self._lock:
            if self._is_running_locked():
                raise RuntimeError("Localization is already running.")

            if ROS_DISABLED:
                self._simulated = True
                self._started_by = username
                self._started_display = display_name
                self._started_at = time.time()
                self._map_id = yaml_path.stem
                self._map_yaml = str(yaml_path)
                return self.get_status()

            ros_abs, ws_abs = validate_ros_workspace_setups(ROS_SETUP, WS_SETUP)
            env_snippet = bash_ros_overlay_snippet(ros_abs, ws_abs)

            self._close_launch_log_locked()
            log_f, stdout_arg, stderr_arg = open_launch_log_stream()
            self._launch_log_file = log_f

            map_arg = shlex.quote(str(yaml_path))
            cmd = (
                "set -e\n"
                f"{env_snippet}"
                f"ros2 launch buddy {LAUNCH_FILE} map:={map_arg}\n"
            )
            self._process = subprocess.Popen(
                ["bash", "-lc", cmd],
                stdout=stdout_arg,
                stderr=stderr_arg,
                start_new_session=True,
                text=True,
            )
            self._simulated = False
            self._started_by = username
            self._started_display = display_name
            self._started_at = time.time()
            self._map_id = yaml_path.stem
            self._map_yaml = str(yaml_path)
            return self.get_status()

    def stop(self) -> dict:
        from ros_bridge.ros_node import BuddyRosBridge

        BuddyRosBridge.instance().clear_nav_state()

        with self._lock:
            if self._simulated:
                self._simulated = False
                self._started_by = None
                self._started_display = None
                self._started_at = None
                self._map_id = None
                self._map_yaml = None
                return self.get_status()

            if self._process is None:
                self._close_launch_log_locked()
                return self.get_status()

            try:
                os.killpg(os.getpgid(self._process.pid), signal.SIGTERM)
            except ProcessLookupError:
                pass
            try:
                self._process.wait(timeout=8)
            except subprocess.TimeoutExpired:
                try:
                    os.killpg(os.getpgid(self._process.pid), signal.SIGKILL)
                except ProcessLookupError:
                    pass
                self._process.wait(timeout=3)

            self._process = None
            self._started_by = None
            self._started_display = None
            self._started_at = None
            self._map_id = None
            self._map_yaml = None
            self._close_launch_log_locked()
            return self.get_status()
