"""Helpers for long-running `ros2 launch` subprocesses from Django.

Never use stdout=PIPE without a reader: the pipe buffer fills and blocks the whole
launch tree (RViz blank, no /map, RobotModel missing) while hardware may still run.
"""

from __future__ import annotations

import os
import shlex
import subprocess
from typing import Optional, TextIO, Tuple, Union

LogStream = Optional[TextIO]
StdOut = Union[TextIO, int]


class RosEnvironmentError(Exception):
    """ROS distro or workspace setup.bash is missing or not readable."""


def resolve_setup_path(path: str) -> str:
    """Expand ~ and make absolute (does not require the file to exist)."""
    return os.path.abspath(os.path.expanduser(path.strip()))


def validate_ros_workspace_setups(ros_setup: str, ws_setup: str) -> tuple[str, str]:
    """Return (ros_setup_abs, ws_setup_abs). Raises RosEnvironmentError if scripts are missing."""
    ros_abs = resolve_setup_path(ros_setup)
    ws_abs = resolve_setup_path(ws_setup)
    if not os.path.isfile(ros_abs):
        raise RosEnvironmentError(
            f"ROS setup script not found: {ros_abs} — set BUDDY_ROS_SETUP (e.g. /opt/ros/jazzy/setup.bash)"
        )
    if not os.path.isfile(ws_abs):
        raise RosEnvironmentError(
            f"Workspace install/setup.bash not found: {ws_abs} — set BUDDY_WS_SETUP to your "
            "workspace install file (e.g. /home/you/ros2_ws/install/setup.bash)"
        )
    return ros_abs, ws_abs


def bash_ros_overlay_snippet(ros_abs: str, ws_abs: str) -> str:
    """Bash lines: HOME, verify scripts, cd workspace root, source ROS then overlay.

    Same order as a normal terminal: distro `setup.bash` first, then workspace
    `install/setup.bash`, with cwd at the workspace root.
    """
    rq = shlex.quote(ros_abs)
    wq = shlex.quote(ws_abs)
    override = os.environ.get("BUDDY_WS_ROOT", "").strip()
    if override:
        cq = shlex.quote(resolve_setup_path(override))
        cd_block = f"cd {cq} || {{ echo \"Buddy web: cannot cd to BUDDY_WS_ROOT\" >&2; exit 1; }}\n"
    else:
        cd_block = (
            '_ws_root="$(cd "$(dirname "$WS_SETUP")/.." && pwd)"\n'
            'cd "${_ws_root}" || true\n'
        )
    return (
        'export HOME="${HOME:-$(getent passwd "$(id -un)" 2>/dev/null | cut -d: -f6)}"\n'
        f"ROS_SETUP={rq}\n"
        f"WS_SETUP={wq}\n"
        'test -f "$ROS_SETUP" || { echo "Buddy web: missing ROS setup: $ROS_SETUP" >&2; exit 1; }\n'
        'test -f "$WS_SETUP" || { echo "Buddy web: missing workspace setup: $WS_SETUP" >&2; exit 1; }\n'
        f"{cd_block}"
        "# ROS 2 overlay: distro first, then workspace\n"
        'source "$ROS_SETUP"\n'
        'source "$WS_SETUP"\n'
    )


def open_launch_log_stream() -> Tuple[LogStream, StdOut, int]:
    """Return (log_file_or_none, stdout_for_popen, stderr_for_popen).

    Never use PIPE here: unread pipes block the whole ros2 launch tree.
    """
    path = os.environ.get("BUDDY_WEB_LAUNCH_LOG", "").strip()
    if path:
        f: TextIO = open(path, "a", encoding="utf-8", errors="replace")
        return f, f, subprocess.STDOUT
    return None, subprocess.DEVNULL, subprocess.DEVNULL


def close_quietly(f: Optional[TextIO]) -> None:
    if f is None:
        return
    try:
        f.close()
    except OSError:
        pass
