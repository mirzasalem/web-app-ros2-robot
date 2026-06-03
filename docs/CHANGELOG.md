# Buddy Web — Change log

## Docs — ROS subprocess, Stop, troubleshooting

- **README** — Mapping & localization: overlay sourcing (`cd` + two `source`s), Stop = whole `ros2 launch` process group, `GET /api/mapping/status/` fields, `BUDDY_WEB_LAUNCH_LOG`
- **USER_GUIDE** — Part 0: when to set `BUDDY_ROS_SETUP` / `BUDDY_WS_SETUP` / `BUDDY_WS_ROOT`; Part 4: **Stop stack** button = same as **Stop mapping**; blank RViz / `setup_files_ok`; Part 11–12: troubleshooting + technical table (fixed link to `#environment-variables`)
- **docs/README.md** — note on absolute `BUDDY_WS_SETUP` for systemd
- **DocumentationPage.jsx** — in-app mapping + troubleshooting aligned with the above

## Battery (sidebar + API)

- **Sidebar** — voltage and remaining % under the Buddy logo (polls every 2s)
- **API** — `GET /api/battery/` → [http://127.0.0.1:8001/api/battery/](http://127.0.0.1:8001/api/battery/)
- **ROS** — subscribes to `sensor_msgs/BatteryState` on `BUDDY_WEB_BATTERY_TOPIC` (default `/battery_state`)
- **Mock** — `BUDDY_BATTERY_MOCK_VOLTAGE`, `BUDDY_BATTERY_MOCK_PERCENT` for dev without hardware
- **Docs** — README, USER_GUIDE, in-app Documentation

## Documentation (full update — run backend/frontend)

- **README.md** — how to run backend (8001) and frontend (5173), first-time setup, checklist, sign up, API, env vars
- **USER_GUIDE.md** — Part 0 install/run (two terminals), sign up, mobile, robot docs in browser, troubleshooting
- **docs/README.md** — quick run commands + links
- **DocumentationPage.jsx** — in-app “How to run backend and frontend”, sign up, mobile, localization maps folder

## Robot package docs in the browser

- **API** — `GET /api/docs/buddy/` and `GET /api/docs/buddy/<id>/` serve whitelisted markdown from `src/buddy` (set `BUDDY_PACKAGE_DIR` if needed).
- **Robot docs** page (`/docs/buddy`) — renders README and other guides with markdown; sidebar item **Robot docs**.
- **DocsSubNav** — switch between Website guide and Robot package on documentation pages.

## Documentation (beginner-friendly rewrite)

- **USER_GUIDE.md** — plain language, numbered parts (log in → dashboard → mapping → localization → teleop); technical details moved to Part 9
- **DocumentationPage.jsx** — same style in the browser; removed dense ROS/API tables from the main view
- **docs/README.md** — simpler index (“start here”)

## Documentation (full update)

- **docs/README.md** — documentation index (webapp + links to all `src/buddy` instruction files)
- **USER_GUIDE.md** — mapping/localization from web, dashboard `/odom`, API, env vars, **Buddy package docs table** (`src/buddy`)
- **README.md** — documentation table including buddy package
- **DocumentationPage.jsx** — web mapping/localization steps, dashboard topic table, **full buddy package file list** (README, DRIVE_TRAIN, install, troubleshooting, STANDALONE, launch/, maps/, config/), drive train + ESP32 + USB notes

## Mapping page

- Sidebar **Mapping** → dedicated **Mapping** page (`/mapping`), not a drawer
- **Start mapping** runs `ros2 launch buddy robot_mapping.launch.py` on the Django server (or `sim_mapping.launch.py` with `BUDDY_MAPPING_SIM=1`)
- Teleop D-pad on the same page while mapping is active

**Files:** `pages/MappingPage.jsx`, `ros_bridge/mapping_manager.py`, `api/mapping_views.py`

## Localization (admin)

- Sidebar drawer: pick map from `BUDDY_MAP_DIR`, **Start localization** runs `robot_navigation.launch.py map:=<yaml>`
- Dashboard map + AMCL + goal/plan when running
- Mutual exclusion with mapping

**Files:** `ros_bridge/localization_manager.py`, `ros_bridge/map_catalog.py`, `api/localization_views.py`, `components/SidebarLocalizationPanel.jsx`

## Teleop notifications

- Notifications when starting/stopping web drive, ROS teleop failures, and `/rosout` ERROR while driving
- Other users notified when someone starts/stops teleop

**Files:** `api/teleop_notifications.py`, `accounts/notification_service.py`

## Teleop UI

- Redesigned D-pad, status pills, keyboard hint chips
- `TeleopPad.css`, `TeleopStatus.jsx`, wider teleop drawer

## Dashboard

- **Current position** — `x`, `y`, `θ` from `GET /api/status/` → ROS `/odom`
- **Map robot** — `/amcl_pose` when localizing
- Telemetry: Currently calling · Anyone else calling?

## Page headers & navigation

- `PageHeader` on all pages; Mapping is a route, Localization/Teleop are drawers
- Sidebar order ends with Documentation, then theme toggle
- Settings: map X/Y only (theme in sidebar footer)

## Tests

```bash
./scripts/test.sh
```

- `api/tests_mapping.py`, `api/tests_teleop_notifications.py`
- `ros_bridge/tests_mapping.py`, `ros_bridge/tests_localization.py`, `ros_bridge/tests_map_cache.py`
