# Buddy Web — User Guide (step by step)

This guide explains how to **install and run** the website and how to **use** it with the Buddy robot. Plain language — no expert knowledge required.

| Document | Use it for |
|----------|------------|
| **This file** | Full guide: run backend/frontend + every feature |
| [../README.md](../README.md) | Quick reference for developers |
| [CHANGELOG.md](CHANGELOG.md) | What changed recently |

---

## Part 0 — Install and run the website

You need **two programs** running:

1. **Backend** (Django) — port **8001** — talks to the robot and ROS  
2. **Frontend** (React) — port **5173** — what you see in the browser  

Use **two terminal windows** on the robot computer (or one for backend only if someone else hosts the UI).

### Step 0.1 — Build the Buddy robot package (once)

```bash
cd ~/ros2_ws
colcon build --packages-select buddy
source install/setup.bash
```

### Step 0.2 — Set up the backend (once)

```bash
cd ~/ros2_ws/webapp/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

python manage.py migrate
python manage.py seed_buddy_users
```

This creates demo users (`admin` / `admin123`, etc.).

### Step 0.3 — Start the backend (every time)

**Terminal 1:**

```bash
cd ~/ros2_ws/webapp/backend
source .venv/bin/activate

source /opt/ros/jazzy/setup.bash
source ~/ros2_ws/install/setup.bash

python manage.py runserver 0.0.0.0:8001
```

Leave this terminal open. You should see: `Starting development server at http://0.0.0.0:8001/`

**Check it works:** open [http://127.0.0.1:8001/api/health/](http://127.0.0.1:8001/api/health/) — you should see `"status": "ok"`.

**Important:** For a real robot, do **not** set `BUDDY_WEB_DISABLE_ROS=1`. That mode is only for testing the UI without ROS.

**ROS paths for “Start mapping” / “Start localization”:** The backend runs `ros2 launch …` in a **separate shell** that sources ROS and your workspace the same way you would in a terminal: first `/opt/ros/jazzy/setup.bash`, then `…/ros2_ws/install/setup.bash`, with `cd` to the workspace root before sourcing. Defaults usually work if you start Django from a normal login shell. If you run the backend under **systemd**, **cron**, or another user, set **absolute** paths:

```bash
export BUDDY_ROS_SETUP=/opt/ros/jazzy/setup.bash
export BUDDY_WS_SETUP=/home/YOUR_USER/ros2_ws/install/setup.bash
# optional if the path above does not imply the workspace root:
export BUDDY_WS_ROOT=/home/YOUR_USER/ros2_ws
```

See [../README.md](../README.md#environment-variables) for all variables.

### Step 0.4 — Set up the frontend (once)

```bash
cd ~/ros2_ws/webapp/frontend
npm install
```

### Step 0.5 — Start the frontend (every time)

**Terminal 2** (while Terminal 1 is still running):

```bash
cd ~/ros2_ws/webapp/frontend
npm run dev
```

Open your browser at: **http://localhost:5173**

### Step 0.6 — Log in or sign up

- **Sign in:** use `admin` / `admin123` (full access) or `alice` / `demo123` (regular user)  
- **Create account:** click **Create an account** on the login page  

### If the UI cannot reach the API

- Backend must be running on port **8001**  
- Frontend dev server proxies `/api` to `http://127.0.0.1:8001`  
- If the backend is on another PC: `export VITE_API_PROXY=http://THAT-PC-IP:8001` before `npm run dev`  

### Stop the servers

Press **Ctrl+C** in each terminal.

---

## Part 1 — Accounts: sign up, log in, sign out

### Create a new account (sign up)

1. Open **http://localhost:5173/signup** (or click **Create an account** on the login page).  
2. Fill in:
   - **Your name** — shown on the map and in the app  
   - **Username** — used to log in  
   - **Email**  
   - **Password** (at least 8 characters) and **Confirm password**  
   - **X (meters)** and **Y (meters)** — where your dot appears on the shared map (type numbers, e.g. `0` and `0`)  
3. Click **Sign up**. You are logged in automatically.  
4. An **admin** can change your X and Y later under **Manage users**.

### Log in

1. Open the website (e.g. **http://localhost:5173/login**).  
2. Enter **username** and **password**.  
3. Click **Sign in**.  
4. Use **Light / Dark** (top right on login/signup) to change theme.

### Demo accounts

| Username | Password | Access |
|----------|----------|--------|
| `admin` | `admin123` | Everything |
| `alice`, `bob`, `charlie`, `diana` | `demo123` | Dashboard, teleop, settings — not mapping/localization |

### Sign out

Click your **name** (top right) → **Sign out**.

---

## Part 2 — Sidebar and mobile

### Desktop

- **Sidebar** on the left: icons when collapsed, full labels when expanded.  
- Under the **Buddy logo** (expanded): **voltage** and **remaining %** when the robot (or mock) sends battery data.  
- When **collapsed** (icon rail): a compact battery strip under the logo shows **%** and a small level bar.  
- Click **‹** to collapse, **›** to expand.  

### Phone / tablet (mobile)

- A narrow **icon bar** stays on the left.  
- Tap **›** to open the full menu.  
- While the menu is open, the main page shows: *“Dashboard will show when you close the sidebar”* (or the current page name).  
- Close the menu: tap **‹**, tap outside (dimmed area), or **Close menu**.  

### Menu items

| Item | Purpose |
|------|---------|
| **Dashboard** | Robot position and map |
| **Notifications** | Messages and alerts |
| **Mapping** | Make a new map (admin) |
| **Localization** | Use a saved map (admin) |
| **Teleop** | Drive the robot |
| **Manage users** | Edit users (admin) |
| **Settings** | Your profile |
| **Documentation** | This help in the browser |
| **Robot docs** | Full `src/buddy/README.md` in the browser |
| **Light / Dark** | Theme (bottom of sidebar) |

### Battery (sidebar + API)

The sidebar shows **voltage** and **remaining %** under the logo when data is available.

**REST API (for scripts or future hardware):**

- **GET** [http://127.0.0.1:8001/api/battery/](http://127.0.0.1:8001/api/battery/) — no login required  
- Example response:

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

**Wire the robot:** publish `sensor_msgs/BatteryState` on `/battery_state` (or set `BUDDY_WEB_BATTERY_TOPIC` on the backend).

**Test without ROS:**

```bash
export BUDDY_BATTERY_MOCK_VOLTAGE=12.4
export BUDDY_BATTERY_MOCK_PERCENT=78
```

Then restart the backend and open the sidebar or `GET /api/battery/`.

---

## Part 3 — Dashboard

1. Click **Dashboard** in the sidebar.  
2. **Current position** — x, y, angle. **Live** = updating; **No odom** = robot not connected.  
3. **Map** — green arrow = robot; colored dots = users.  
4. After **Localization**, you may see a gold goal and blue path.  

---

## Part 4 — Make a map (Mapping)

**Admin only.** Stop **Localization** first.

1. Click **Mapping** in the sidebar.  
2. Click **Start mapping**. Wait for **Mapping active**.  
3. **Optional — RViz-like view in the browser:** RViz is a separate desktop app and cannot run inside this website. For a live **map**, **laser scan**, and **TF** in the browser, use **Foxglove Studio** together with **foxglove_bridge** on the robot PC:
   - Install (Ubuntu, ROS 2 Jazzy): `sudo apt install ros-jazzy-foxglove-bridge` (package is available for `amd64`; on Raspberry Pi use an `arm64` build from [Foxglove](https://github.com/foxglove/ros-foxglove-bridge) if the apt package is not available).
   - With ROS and your workspace sourced, run: `ros2 run foxglove_bridge foxglove_bridge` (default WebSocket port **8765** unless you pass a different `--port`).
   - Open [Foxglove Studio](https://app.foxglove.dev) → **Open connection** → **Foxglove WebSocket** → enter `ws://<ROBOT_LAN_IP>:8765` (from another PC, use the robot’s IP, not `localhost`).
   - On the **Mapping** page (while mapping is active), use **Open Foxglove Studio** and set `VITE_FOXGLOVE_WS_URL` in `frontend/.env` so the page shows your exact URL and enables **Copy WebSocket URL**.
   - **SSH tunnel** (optional): `ssh -L 8765:localhost:8765 user@robot` then connect Foxglove to `ws://127.0.0.1:8765` on your laptop.
4. **Headless robot (no RViz window):** If the Django backend is started with `BUDDY_WEB_MAPPING_NO_RVIZ=1` or `BUDDY_WEB_MAPPING_USE_RVIZ=0`, **Start mapping** will not launch RViz on the robot; use Foxglove for visualization and the web page for teleop.
5. Use **Drive while mapping** (arrows or ↑ ↓ ← →, **Space** to stop). Drive **slowly** around the whole area.  
6. When you are done driving, click **Stop mapping** (sidebar) or **Stop stack (RViz, lidar, SLAM, motors)** (under **Drive while mapping**). Both do the same thing: they **stop the whole mapping launch** on the robot PC — RViz, lidar driver, SLAM, `ros2_control`, and related nodes — not only the web teleop.  
7. On the robot PC terminal, save the map:

```bash
ros2 run nav2_map_server map_saver_cli -f ~/ros2_ws/src/buddy/maps/my_map
```

This creates `my_map.yaml` and `my_map.pgm` in `~/ros2_ws/src/buddy/maps/`.

**If RViz opens but the map or robot model stays blank:** On the Mapping page, a **yellow alert** appears when the backend cannot find the ROS or workspace setup scripts (`setup_files_ok` is false in `GET /api/mapping/status/`). Fix `BUDDY_ROS_SETUP` / `BUDDY_WS_SETUP` (use absolute paths). To see launch errors, set `BUDDY_WEB_LAUNCH_LOG=/tmp/buddy_launch.log` and restart the backend, then start mapping again and read that file.

---

## Part 5 — Use a saved map (Localization)

**Admin only.** **Mapping** must be stopped. Maps must exist in `src/buddy/maps/`.

1. Click **Localization** in the sidebar.  
2. Under **1. Choose map**, pick a map (list comes from `~/ros2_ws/src/buddy/maps/`).  
3. Click **Start localization**. Wait for **Localization active**.  
4. Open **Dashboard** to see the map and robot.  
5. In **RViz**: **2D Pose Estimate** if needed, **2D Goal Pose** to navigate.  
6. Click **Stop localization** when done.  

You cannot run **Mapping** and **Localization** at the same time.

---

## Part 6 — Drive the robot (Teleop)

1. Click **Teleop** in the sidebar (or use the pad on the **Mapping** page while mapping).  
2. Green status lights: API, ROS, Robot.  
3. Hold direction keys or use the on-screen pad; **Space** to stop.  

---

## Part 7 — Notifications

Click **Notifications**. Unread count shows on the sidebar. Mark messages read when done.

---

## Part 8 — Settings

- Everyone can see **username**, **email**, and **name**.  
- **Regular users:** map X and Y are **read-only** (set at signup; ask an admin to change).  
- **Admins:** can edit their **display name** and **X / Y** on Settings, and edit **any user** under **Manage users**.

---

## Part 9 — Manage users (admin)

1. Click **Manage users**.  
2. Edit **display name**, **email**, **X**, **Y** for any user.  
3. Click **Save** on that row.  

---

## Part 10 — Documentation in the browser

| Page | What it is |
|------|------------|
| **Documentation** | Website guide (mapping, localization, teleop, **battery**, troubleshooting) |
| **Robot docs** | Full markdown from `~/ros2_ws/src/buddy` (README, drive train, install, troubleshooting) |

Switch tabs at the top: **Website guide** | **Robot package (README)**.

---

## Part 11 — Troubleshooting

| Problem | What to try |
|---------|-------------|
| Blank page / cannot log in | Start **backend** (8001) then **frontend** (5173) |
| `Network error` / API fails | Check [http://127.0.0.1:8001/api/health/](http://127.0.0.1:8001/api/health/) |
| Mapping active, robot still | Backend needs ROS sourced; remove `BUDDY_WEB_DISABLE_ROS` |
| No maps in Localization list | Save a map to `src/buddy/maps/` first |
| Position always `— — —` | Robot not publishing `/odom`; start robot stack |
| Robot docs empty in browser | Set `BUDDY_PACKAGE_DIR` to `~/ros2_ws/src/buddy` |
| Battery shows **—** or **No data yet** | Normal until you publish `sensor_msgs/BatteryState` on `/battery_state`, or use mock env vars (see [Battery](#battery-sidebar--api)) |
| Foxglove cannot connect | Bridge must run on the robot; firewall open on **8765**; use robot LAN IP or SSH tunnel |
| Webapp starts mapping but RViz map / RobotModel blank | 1) Check Mapping page for **setup path** alert; set `BUDDY_ROS_SETUP` and `BUDDY_WS_SETUP` to **absolute** paths. 2) Restart backend after upgrades (launch logs must not block on a pipe — current code uses `/dev/null` or `BUDDY_WEB_LAUNCH_LOG`). 3) Inspect `BUDDY_WEB_LAUNCH_LOG` if set. 4) If discovery is flaky, try `FASTDDS_BUILTIN_TRANSPORTS=UDPv4` for that shell (team policy / network dependent). |
| Start mapping returns server error (503) mentioning setup | One of the setup `.bash` files is missing at the configured path — fix env vars and restart Django. |

---

## Part 12 — Technical reference

### What the website runs for you

| Button in UI | Command on server |
|--------------|-------------------|
| Start mapping | `bash -lc` runs a small preamble: `cd` to workspace root, `source` `BUDDY_ROS_SETUP`, then `source` `BUDDY_WS_SETUP`, then `ros2 launch buddy robot_mapping.launch.py` (optional: `use_rviz:=false` when `BUDDY_WEB_MAPPING_NO_RVIZ=1`) |
| Stop mapping / Stop stack | `SIGTERM` to the **process group** of that launch shell (stops RViz, lidar, SLAM, controllers, and other nodes started by the same `ros2 launch`) |
| Start localization | Same preamble, then `ros2 launch buddy robot_navigation.launch.py map:=…/my_map.yaml` |
| Save map (terminal) | `ros2 run nav2_map_server map_saver_cli -f …/maps/my_map` |

### Environment variables

See [../README.md](../README.md#environment-variables).

### Robot package (terminal)

Main guide: `~/ros2_ws/src/buddy/README.md` — not modified by the webapp.

---

## More files

- [README.md](README.md) — documentation index  
- [../README.md](../README.md) — install, API, env vars  
- [CHANGELOG.md](CHANGELOG.md) — change log  
