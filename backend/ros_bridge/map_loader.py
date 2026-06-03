"""Load Nav2-style occupancy maps from PGM+YAML or ROS OccupancyGrid."""

from __future__ import annotations

import base64
import os
from pathlib import Path
from typing import Any

import yaml


def _default_map_dir() -> Path:
    env = os.environ.get("BUDDY_MAP_DIR")
    if env:
        return Path(env)
    # ros2_ws/webapp/backend -> ros2_ws/src/buddy/maps
    return Path(__file__).resolve().parents[3] / "src" / "buddy" / "maps"


def _default_map_yaml() -> Path:
    name = os.environ.get("BUDDY_MAP_YAML", "my_map.yaml")
    return _default_map_dir() / name


def _parse_pgm(path: Path) -> tuple[int, int, bytes]:
    with open(path, "rb") as f:
        magic = f.readline().strip()
        if magic != b"P5":
            raise ValueError(f"Unsupported PGM format: {magic!r}")
        # skip comments
        line = f.readline()
        while line.startswith(b"#"):
            line = f.readline()
        parts = line.decode().split()
        while len(parts) < 2:
            line = f.readline()
            while line.startswith(b"#"):
                line = f.readline()
            parts = line.decode().split()
        width, height = int(parts[0]), int(parts[1])
        maxval = int(f.readline().strip())
        if maxval != 255:
            raise ValueError(f"Expected maxval 255, got {maxval}")
        data = f.read()
    if len(data) != width * height:
        raise ValueError("PGM size mismatch")
    return width, height, data


def _pixel_to_occ(px: int, *, occ_val: int, free_val: int) -> int:
    if px >= occ_val:
        return 100
    if px <= free_val:
        return 0
    return 255  # unknown (sentinel for frontend)


def pgm_to_occupancy_ros(
    width: int,
    height: int,
    pgm_bytes: bytes,
    *,
    occupied_thresh: float,
    free_thresh: float,
) -> bytes:
    """PGM (top row first) → ROS OccupancyGrid row-major (bottom row first)."""
    occ_val = int(occupied_thresh * 255)
    free_val = int(free_thresh * 255)
    out = bytearray(width * height)
    for row in range(height):
        for col in range(width):
            pgm_idx = row * width + col
            ros_j = height - 1 - row
            ros_idx = ros_j * width + col
            out[ros_idx] = _pixel_to_occ(
                pgm_bytes[pgm_idx], occ_val=occ_val, free_val=free_val
            )
    return bytes(out)


def load_map_from_yaml(yaml_path: Path | None = None) -> dict[str, Any]:
    yaml_path = yaml_path or _default_map_yaml()
    if not yaml_path.exists():
        raise FileNotFoundError(f"Map yaml not found: {yaml_path}")

    with open(yaml_path) as f:
        meta = yaml.safe_load(f)

    pgm_path = yaml_path.parent / meta["image"]
    width, height, pgm_data = _parse_pgm(pgm_path)
    occ = pgm_to_occupancy_ros(
        width,
        height,
        pgm_data,
        occupied_thresh=float(meta.get("occupied_thresh", 0.65)),
        free_thresh=float(meta.get("free_thresh", 0.196)),
    )

    origin = meta.get("origin", [0.0, 0.0, 0.0])
    if len(origin) == 3:
        ox, oy, _ = origin
    else:
        ox, oy = 0.0, 0.0

    return {
        "width": width,
        "height": height,
        "resolution": float(meta.get("resolution", 0.05)),
        "origin_x": float(ox),
        "origin_y": float(oy),
        "origin_yaw": float(origin[2]) if len(origin) > 2 else 0.0,
        "frame_id": "map",
        "source": "file",
        "data_b64": base64.b64encode(occ).decode("ascii"),
        "map_name": yaml_path.stem,
    }


def occupancy_grid_to_payload(msg: Any) -> dict[str, Any]:
    """nav_msgs/OccupancyGrid -> JSON-serializable dict."""
    data = bytes(
        (v if v >= 0 else 255) for v in msg.data
    )  # -1 unknown -> 255
    return {
        "width": int(msg.info.width),
        "height": int(msg.info.height),
        "resolution": float(msg.info.resolution),
        "origin_x": float(msg.info.origin.position.x),
        "origin_y": float(msg.info.origin.position.y),
        "origin_yaw": 0.0,
        "frame_id": msg.header.frame_id or "map",
        "source": "ros",
        "data_b64": base64.b64encode(data).decode("ascii"),
        "map_name": "live",
    }
