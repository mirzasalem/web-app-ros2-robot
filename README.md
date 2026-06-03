# Buddy Web App

Web control panel for the **Buddy** differential-drive robot ([ROS 2 Jazzy](https://docs.ros.org/en/jazzy/)).  
Drive the robot, build maps, run localization, and monitor status from a browser — no terminal required for day-to-day use.

| Layer | Stack |
|-------|--------|
| Backend | Django 4 + Django REST Framework + `rclpy` ROS bridge |
| Frontend | React 19 + Vite |
| Robot | `ros2 launch buddy …` (mapping / localization) |

---

## Table of contents

- [Features](#features)
- [Quick start](#quick-start)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Run the app](#run-the-app)
- [Demo accounts & sign up](#demo-accounts--sign-up)
- [Battery (sidebar + API)](#battery-sidebar--api)
- [Mapping & localization](#mapping--localization)
- [Architecture](#architecture)
- [API reference](#api-reference)
- [Environment variables](#environment-variables)
- [Tests](#tests)
- [Documentation](#documentation)
- [Project layout](#project-layout)
- [Robot package](#robot-package)

---

## Features

| Feature | Who | Description |
|---------|-----|-------------|
| **Sign up** | Anyone | Create account (name, username, email, map X/Y) |
| **Dashboard** | All | Live map, robot pose, Nav2 goal/plan, online users |
| **Mapping** | Admin | Start/stop SLAM + teleop on the Mapping page |
| **Localization** | Admin | Pick a saved map, start AMCL + Nav2 |
| **Teleop** | All | Drive with D-pad or arrow keys |
| **Notifications** | All | Teleop events, errors, other users driving |
| **Manage users** | Admin | Edit names, email, map X/Y |
| **Battery** | All | Sidebar voltage / %; REST API for integrations |
| **Documentation** | All | In-app website guide |
| **Robot docs** | All | `buddy` package README rendered in the browser |
| **Light / Dark** | All | Theme on login, signup, and sidebar |
| **Mobile** | All | Icon sidebar + overlay menu on small screens |

---

## Quick start

You need **two terminals** (backend + frontend).

**Terminal 1 — Backend (port 8001)**

```bash
cd backend
source .venv/bin/activate
source /opt/ros/jazzy/setup.bash
source ~/ros2_ws/install/setup.bash   # after buddy is built
python manage.py runserver 0.0.0.0:8001
```

**Terminal 2 — Frontend (port 5173)**

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** and log in with `admin` / `admin123`.

Health check: `curl http://127.0.0.1:8001/api/health/`

Full first-time setup: [docs/USER_GUIDE.md](docs/USER_GUIDE.md#part-0--install-and-run-the-website)

---

## Prerequisites

| Requirement | Notes |
|-------------|--------|
| **Ubuntu 24.04** + **ROS 2 Jazzy** | On the robot PC for live `/odom`, mapping, localization |
| **Buddy ROS package** | Built in your workspace (`colcon build --packages-select buddy`) |
| **Python 3.12** + `rclpy` | On the machine that runs the backend |
| **Node.js 18+** | For the frontend |

macOS can run the UI for development; mapping, localization, and live robot data need the backend on a Linux machine with ROS.

---

## Installation

### ROS workspace layout

This repo is usually cloned into a ROS 2 workspace, next to the robot package:

```text
~/ros2_ws/
├── src/
│   └── buddy/          # robot package (separate repo / folder)
└── webapp/             # this repository
    ├── backend/
    ├── frontend/
    └── docs/
```

Build the robot package once:

```bash
cd ~/ros2_ws
colcon build --packages-select buddy
source install/setup.bash
```

### Backend (once per machine)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_buddy_users
```

### Frontend (once per machine)

```bash
cd frontend
npm install
```

---

## Run the app

### Backend

```bash
cd backend
source .venv/bin/activate
source /opt/ros/jazzy/setup.bash
source ~/ros2_ws/install/setup.bash
python manage.py runserver 0.0.0.0:8001
```

**UI-only / no robot** (layouts and auth testing):

```bash
export BUDDY_WEB_DISABLE_ROS=1
python manage.py runserver 0.0.0.0:8001
```

### Frontend

```bash
cd frontend
npm run dev
```

If the backend runs on another PC:

```bash
export VITE_API_PROXY=http://ROBOT-PC-IP:8001
npm run dev
```

### Production build (optional)

```bash
cd frontend
npm run build
# static files in frontend/dist/ — serve with any web server; API must stay on :8001
```

### Checklist

| Step | Check |
|------|--------|
| 1 | Backend listening on **8001** |
| 2 | `curl http://127.0.0.1:8001/api/health/` → `"status":"ok"` |
| 3 | Vite on **5173** |
| 4 | Browser login works at http://localhost:5173 |

---

## Demo accounts & sign up

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Admin — mapping, localization, manage users |
| `alice`, `bob`, `charlie`, `diana` | `demo123` | Regular users |

**Sign up:** http://localhost:5173/signup — name, username, email, password, map **X/Y** (meters).  
Regular users cannot change X/Y after signup; admins can edit any user under **Manage users**.

---

## Battery (sidebar + API)

Battery is shown in the **sidebar** and exposed over **REST** so you can wire hardware later without changing the UI.

### Sidebar UI

| Sidebar state | What you see |
|---------------|----------------|
| **Expanded** | Voltage and remaining **%** under the Buddy logo |
| **Collapsed** (icon rail) | Compact **%** and charge bar under the logo |

Updates every ~2 seconds when data is available. **No data yet** is normal until ROS or mock values are configured.

### REST API

```http
GET /api/battery/
```

Example (when data is present):

```json
{
  "voltage": 12.4,
  "percentage": 78.0,
  "available": true,
  "live": true,
  "topic": "/battery_state",
  "source": "ros",
  "api": "/api/battery/"
}
```

No auth required. Base URL in development: `http://127.0.0.1:8001/api/battery/`

### ROS integration (future — your hardware)

Publish [`sensor_msgs/BatteryState`](https://github.com/ros2/common_interfaces/blob/jazzy/sensor_msgs/msg/BatteryState.msg) on:

```text
/battery_state
```

Or set `BUDDY_WEB_BATTERY_TOPIC` to your topic name.  
ROS 2 Jazzy does **not** ship a battery node; Buddy does not publish this yet — add a small publisher when your BMS / ADC is ready.

### Test without hardware

```bash
export BUDDY_BATTERY_MOCK_VOLTAGE=12.4
export BUDDY_BATTERY_MOCK_PERCENT=78
# restart backend, then open sidebar or curl /api/battery/
```

More detail: [docs/USER_GUIDE.md — Battery](docs/USER_GUIDE.md#battery-sidebar--api) · in-app **Documentation → Battery (sidebar and API)**

---

## Mapping & localization

**Mapping (admin):** Sidebar → **Mapping** → **Start mapping** → drive slowly → **Stop mapping** or **Stop stack (RViz, lidar, SLAM, motors)** (same action) → save on the robot PC:

```bash
ros2 run nav2_map_server map_saver_cli -f ~/ros2_ws/src/buddy/maps/my_map
```

**How launches get ROS:** **Start mapping** and **Start localization** spawn `ros2 launch …` in a dedicated shell. That shell `cd`s to the workspace root (from `BUDDY_WS_SETUP` / `BUDDY_WS_ROOT`), then runs `source "$BUDDY_ROS_SETUP"` and `source "$BUDDY_WS_SETUP"` — the same overlay order as a normal terminal (`jazzy` first, then `install/setup.bash`). You do **not** need a third `source install/setup.bash` in addition to an absolute workspace setup path. For **systemd** or non-interactive users, set **`BUDDY_WS_SETUP`** (and optionally **`BUDDY_WS_ROOT`**) to **absolute** paths so the subprocess finds your overlay.

**Stop = whole stack:** Stop sends **`SIGTERM` to the process group** of that `ros2 launch` session, which shuts down RViz, the lidar node, SLAM, `ros2_control`, and everything else started by that launch file — not only web teleop.

**Status / debugging:** `GET /api/mapping/status/` includes `ros_setup_path`, `ws_setup_path`, and `setup_files_ok`. If `setup_files_ok` is false, the Mapping page shows a warning; fix paths and restart Django. Optional `BUDDY_WEB_LAUNCH_LOG` appends `ros2 launch` stdout/stderr to a file (otherwise output is discarded so pipes cannot block the tree).

**Live map / laser in the browser (Foxglove):** RViz cannot be embedded in the web UI. While mapping is active, the **Mapping** page shows **Open Foxglove Studio** and connection hints. On the robot PC (with ROS sourced): install `sudo apt install ros-jazzy-foxglove-bridge`, then run `ros2 run foxglove_bridge foxglove_bridge` (default WebSocket port **8765**). In [Foxglove Studio](https://app.foxglove.dev), use **Open connection** → **Foxglove WebSocket** → `ws://<ROBOT_IP>:8765`. Set `VITE_FOXGLOVE_WS_URL` in `frontend/.env` so the Mapping page can show and copy the exact URL.

**Headless mapping (no RViz on the Pi):** Set `BUDDY_WEB_MAPPING_NO_RVIZ=1` or `BUDDY_WEB_MAPPING_USE_RVIZ=0` before starting the Django backend so **Start mapping** runs `robot_mapping.launch.py` with `use_rviz:=false` (Foxglove + web teleop only).

**Localization (admin):** Sidebar → **Localization** → choose map → **Start** → **Dashboard**. Localization uses the same ROS overlay preamble as mapping.

Maps in the dropdown: `~/ros2_ws/src/buddy/maps/*.yaml` (override with `BUDDY_MAP_DIR`).

Step-by-step: [docs/USER_GUIDE.md](docs/USER_GUIDE.md)

---

## Architecture

```text
Browser (Vite :5173)  →  /api/*  →  Django (:8001)
                                        ├─ rclpy  → /odom, /map, /amcl_pose, web_vel, /battery_state
                                        └─ subprocess → ros2 launch buddy …
```

---

## API reference

Protected routes use: `Authorization: Token <token>`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health/` | Health check |
| `POST` | `/api/auth/register/` | Sign up |
| `POST` | `/api/auth/login/` | Log in |
| `GET` | `/api/auth/me/` | Current user profile |
| `GET` | `/api/status/` | Robot status, odom, AMCL, nav goal/plan |
| `GET` | `/api/battery/` | Battery voltage (V) and remaining % |
| `GET` | `/api/map/` | Occupancy grid |
| `GET` | `/api/map/meta/` | Map metadata |
| `POST` | `/api/teleop/` | Drive `{ "linear", "angular" }` |
| `POST` | `/api/stop/` | Stop robot |
| `POST` | `/api/mapping/start/` | Start SLAM (admin) |
| `POST` | `/api/mapping/stop/` | Stop mapping launch **process group** — RViz, lidar, SLAM, motors from that launch (admin) |
| `GET` | `/api/mapping/status/` | Mapping state; includes `setup_files_ok`, `ros_setup_path`, `ws_setup_path` |
| `GET` | `/api/localization/maps/` | List saved maps (admin) |
| `POST` | `/api/localization/start/` | `{ "map": "my_map" }` (admin) |
| `POST` | `/api/localization/stop/` | Stop Nav2 (admin) |
| `GET` | `/api/localization/status/` | Localization state |
| `GET` | `/api/docs/buddy/` | List robot markdown docs |
| `GET` | `/api/docs/buddy/<id>/` | Read one doc (e.g. `readme`) |
| `GET` | `/api/notifications/` | User notifications |

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BUDDY_WEB_DISABLE_ROS` | — | `1` = no ROS bridge; simulated mapping/localization |
| `BUDDY_WEB_ODOM_TOPIC` | `/odom` | Dashboard position |
| `BUDDY_WEB_CMD_TOPIC` | `web_vel` | Web teleop velocity topic |
| `BUDDY_WEB_BATTERY_TOPIC` | `/battery_state` | `sensor_msgs/BatteryState` for sidebar + API |
| `BUDDY_BATTERY_MOCK_VOLTAGE` | — | Mock voltage (V) without ROS |
| `BUDDY_BATTERY_MOCK_PERCENT` | — | Mock charge 0–100 % without ROS |
| `BUDDY_MAP_DIR` | `~/ros2_ws/src/buddy/maps` | Localization map list |
| `BUDDY_PACKAGE_DIR` | `~/ros2_ws/src/buddy` | Robot markdown for **Robot docs** |
| `BUDDY_MAPPING_SIM` | — | `1` → `sim_mapping.launch.py` |
| `BUDDY_LOCALIZATION_SIM` | — | `1` → `sim_navigation.launch.py` |
| `BUDDY_ROS_SETUP` | `/opt/ros/jazzy/setup.bash` | ROS setup for `ros2 launch` |
| `BUDDY_WS_SETUP` | `~/ros2_ws/install/setup.bash` | Workspace **install/setup.bash** (absolute path recommended for systemd/cron). Before launch, the shell `cd`s to the workspace root (parent of `install/`). |
| `BUDDY_WS_ROOT` | — | Optional explicit workspace root (e.g. `/home/you/ros2_ws`). If unset, derived from `BUDDY_WS_SETUP`. |
| `BUDDY_WEB_LAUNCH_LOG` | — | Optional path to append `ros2 launch` logs from Mapping/Localization. If unset, output is discarded (`/dev/null`) so pipes never block SLAM, TF, or RViz. |
| `BUDDY_WEB_MAPPING_NO_RVIZ` | — | `1` / `true` → mapping launch uses `use_rviz:=false` (headless Pi + Foxglove) |
| `BUDDY_WEB_MAPPING_USE_RVIZ` | `1` | Set `0` / `false` → same as above (alternative to `NO_RVIZ`) |
| `VITE_API_PROXY` | `http://127.0.0.1:8001` | Frontend dev proxy target |
| `VITE_FOXGLOVE_APP_URL` | `https://app.foxglove.dev` | **Open Foxglove Studio** button (optional override) |
| `VITE_FOXGLOVE_WS_URL` | — | e.g. `ws://192.168.1.50:8765` — shown on Mapping page + **Copy** (see `frontend/.env.example`) |

---

## Tests

```bash
./scripts/test.sh
```

Or:

```bash
cd backend
source .venv/bin/activate
python manage.py test
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/USER_GUIDE.md](docs/USER_GUIDE.md) | Beginner guide — install, every feature, troubleshooting |
| [docs/README.md](docs/README.md) | Documentation index |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Recent changes |
| In-app **Documentation** | Website guide in the browser |
| In-app **Robot docs** | Buddy package markdown live from disk |

---

## Project layout

```text
webapp/
├── backend/              # Django API + ROS bridge
│   ├── manage.py
│   ├── requirements.txt
│   ├── api/              # REST endpoints
│   ├── accounts/         # users, auth, notifications
│   └── ros_bridge/       # rclpy node, mapping/localization managers
├── frontend/             # React UI
│   ├── package.json
│   └── src/
├── docs/                 # USER_GUIDE, CHANGELOG
└── scripts/test.sh
```

---

## Robot package

The **Buddy** robot stack (motors, URDF, Nav2, launches) lives in the separate `buddy` ROS package, typically at `~/ros2_ws/src/buddy`.  
This web app does not modify the robot package; it launches it and reads topics/maps from your workspace.

Set `BUDDY_PACKAGE_DIR` if your `buddy` sources are not in the default path.
