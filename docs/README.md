# Buddy Web — Documentation

Easy guides for the Buddy robot website.

## Start here

| Document | Who it is for |
|----------|----------------|
| **[USER_GUIDE.md](USER_GUIDE.md)** | **Everyone** — **how to run backend & frontend**, sign up, dashboard, mapping, localization, teleop, **battery (sidebar + API)**, mobile, troubleshooting |
| **[../README.md](../README.md)** | Developers — install, API, environment variables, project layout |
| **[CHANGELOG.md](CHANGELOG.md)** | Recent changes to the website |

## Run the website (short)

You need **both** running:

**Terminal 1 — Backend (port 8001):**

```bash
cd backend
source .venv/bin/activate
source /opt/ros/jazzy/setup.bash
source ~/ros2_ws/install/setup.bash
python manage.py runserver 0.0.0.0:8001
```

**Terminal 2 — Frontend (port 5173):**

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

Full steps (first-time setup, sign up, checks): **[USER_GUIDE.md — Part 0](USER_GUIDE.md#part-0--install-and-run-the-website)**

**Mapping / localization from the website** use `ros2 launch` in a subprocess with `BUDDY_ROS_SETUP` + `BUDDY_WS_SETUP` (see [README — Environment variables](../README.md#environment-variables)). Use **absolute** `BUDDY_WS_SETUP` when the Django process is started by systemd or another minimal environment.

## In the browser

| Menu item | Content |
|-----------|---------|
| **Documentation** | Website guide (step by step), including **Battery (sidebar and API)** |
| **Robot docs** | Full `src/buddy/README.md` and other package files, rendered live |
| **Sidebar battery** | Voltage and % under the logo (expanded) or compact strip when collapsed — see [USER_GUIDE — Battery](USER_GUIDE.md#battery-sidebar--api) |

Use the tabs **Website guide** | **Robot package (README)** at the top of those pages.

## Robot package (`src/buddy`)

| File | Topic |
|------|--------|
| `~/ros2_ws/src/buddy/README.md` | Main robot guide (ROS terminal) |
| `~/ros2_ws/src/buddy/docs/DRIVE_TRAIN.md` | Motors and wheels |
| `~/ros2_ws/src/buddy/Package_Installation_Instruction.md` | Installation |
| `~/ros2_ws/src/buddy/Tips_and_Troubleshooting.md` | Troubleshooting |

Localization **Choose map** reads from `~/ros2_ws/src/buddy/maps/` (`.yaml` + `.pgm` files).
