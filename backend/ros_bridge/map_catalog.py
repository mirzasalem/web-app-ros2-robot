"""Discover saved Nav2 maps (YAML + PGM) for localization."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from ros_bridge.map_loader import _default_map_dir


def list_available_maps() -> list[dict[str, Any]]:
    """Return maps under BUDDY_MAP_DIR (or workspace maps folder)."""
    maps_dir = _default_map_dir()
    if not maps_dir.is_dir():
        return []

    maps: list[dict[str, Any]] = []
    for yaml_path in sorted(maps_dir.glob("*.yaml")):
        entry = _map_entry_from_yaml(yaml_path)
        if entry is not None:
            maps.append(entry)
    return maps


def resolve_map_yaml(map_id: str) -> Path:
    """Resolve map stem name to an existing YAML path."""
    if not map_id or not map_id.strip():
        raise ValueError("Map name is required.")
    safe_id = Path(map_id.strip()).stem
    maps_root = _default_map_dir().resolve()
    yaml_path = (maps_root / f"{safe_id}.yaml").resolve()
    try:
        yaml_path.relative_to(maps_root)
    except ValueError:
        raise ValueError("Invalid map name.") from None
    if not yaml_path.is_file():
        raise FileNotFoundError(f"Map not found: {safe_id}")
    if _map_entry_from_yaml(yaml_path) is None:
        raise FileNotFoundError(f"Map files incomplete: {safe_id}")
    return yaml_path


def _map_entry_from_yaml(yaml_path: Path) -> dict[str, Any] | None:
    try:
        with open(yaml_path) as f:
            meta = yaml.safe_load(f) or {}
    except (OSError, yaml.YAMLError):
        return None

    image_name = meta.get("image")
    if not image_name:
        return None
    pgm_path = yaml_path.parent / image_name
    if not pgm_path.is_file():
        return None

    return {
        "id": yaml_path.stem,
        "name": yaml_path.stem,
        "yaml_path": str(yaml_path.resolve()),
        "pgm_path": str(pgm_path.resolve()),
        "resolution": float(meta.get("resolution", 0.05)),
    }
