"""Read whitelisted markdown files from the Buddy ROS package (src/buddy)."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

# Only these files may be served through the web API (path relative to package root).
DOC_CATALOG: list[dict[str, str]] = [
    {
        "id": "readme",
        "file": "README.md",
        "title": "Buddy README",
        "description": "Main robot guide — mapping, navigation, and launch commands",
    },
    {
        "id": "drive_train",
        "file": "docs/DRIVE_TRAIN.md",
        "title": "Drive train",
        "description": "Motors, wheels, encoders, and calibration",
    },
    {
        "id": "installation",
        "file": "Package_Installation_Instruction.md",
        "title": "Installation",
        "description": "Ubuntu, ROS 2 Jazzy, and dependencies",
    },
    {
        "id": "troubleshooting",
        "file": "Tips_and_Troubleshooting.md",
        "title": "Tips & troubleshooting",
        "description": "Common problems and fixes",
    },
    {
        "id": "standalone",
        "file": "STANDALONE.md",
        "title": "Standalone package",
        "description": "Using Buddy without minibot",
    },
]

_CATALOG_BY_ID = {entry["id"]: entry for entry in DOC_CATALOG}


def buddy_package_root() -> Path:
    env = os.environ.get("BUDDY_PACKAGE_DIR")
    if env:
        return Path(env).expanduser().resolve()
    # ros2_ws/webapp/backend/ros_bridge -> ros2_ws/src/buddy
    return (Path(__file__).resolve().parents[3] / "src" / "buddy").resolve()


def list_buddy_docs() -> dict[str, Any]:
    root = buddy_package_root()
    docs: list[dict[str, Any]] = []
    for entry in DOC_CATALOG:
        path = root / entry["file"]
        docs.append(
            {
                "id": entry["id"],
                "title": entry["title"],
                "description": entry["description"],
                "relative_path": entry["file"],
                "available": path.is_file(),
            }
        )
    return {
        "package_root": str(root),
        "docs": docs,
    }


def read_buddy_doc(doc_id: str) -> dict[str, Any]:
    entry = _CATALOG_BY_ID.get(doc_id)
    if entry is None:
        raise KeyError(f"Unknown document: {doc_id}")

    root = buddy_package_root()
    path = (root / entry["file"]).resolve()
    try:
        path.relative_to(root)
    except ValueError:
        raise ValueError("Invalid document path.") from None

    if not path.is_file():
        raise FileNotFoundError(entry["file"])

    content = path.read_text(encoding="utf-8", errors="replace")
    stat = path.stat()
    return {
        "id": entry["id"],
        "title": entry["title"],
        "description": entry["description"],
        "relative_path": entry["file"],
        "path": str(path),
        "content": content,
        "size_bytes": stat.st_size,
        "modified": stat.st_mtime,
    }
