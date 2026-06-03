import DocsSubNav from '../components/DocsSubNav'
import PageHeader from '../components/PageHeader'
import { Link } from 'react-router-dom'
import './DocumentationPage.css'

const WEB_SECTIONS = [
  {
    title: 'Run backend & frontend',
    body: `Terminal 1: backend on port 8001 (Django + ROS). Terminal 2: npm run dev on port 5173. Open http://localhost:5173. See “How to run” below.`,
  },
  {
    title: 'Sign up',
    body: `Create an account: name, username, email, password, and map X/Y (meters). Admins can change X/Y later in Manage users.`,
  },
  {
    title: 'First time here?',
    body: `Log in or sign up. Admin (admin/admin123) for Mapping and Localization. Sidebar menu on the left; account menu top right.`,
  },
  {
    title: 'Mobile',
    body: `On a phone: icon bar on the left; tap › to open the menu. Close the menu to see the Dashboard. Light/Dark on login and in the sidebar.`,
  },
  {
    title: 'Battery',
    body: `Expanded sidebar: voltage and % under the logo. Collapsed: compact % and level bar. API: GET /api/battery/ (port 8001). Future: publish sensor_msgs/BatteryState on /battery_state.`,
  },
  {
    title: 'Dashboard',
    body: `Shows where the robot is (x, y, angle), a map, and who else is using the website. “Live” means fresh data from the robot; “No odom” means the robot is not sending position yet.`,
  },
  {
    title: 'Make a map (Mapping)',
    body: `Admin only: Mapping page → Start mapping → drive slowly → Stop mapping or Stop stack (same: closes RViz, lidar, SLAM for that launch) → save the map on the computer (see full steps below).`,
  },
  {
    title: 'Use a saved map (Localization)',
    body: `Admin only: Localization in the menu → pick a map → Start → open Dashboard to see the robot on that map. Stop mapping first.`,
  },
  {
    title: 'Drive the robot',
    body: `Teleop in the menu, or the drive pad on the Mapping page. Arrow keys or on-screen buttons. Space bar stops.`,
  },
  {
    title: 'Notifications & Settings',
    body: `Notifications tell you when driving starts, stops, or if something fails. Settings is where you set your dot on the map (X and Y).`,
  },
]

export default function DocumentationPage() {
  return (
    <div className="page docs-page">
      <PageHeader
        title="Documentation"
        subtitle="Easy step-by-step guide — no expert knowledge needed"
      />

      <DocsSubNav />

      <article className="glass docs-card docs-card--buddy">
        <h2>What is Buddy?</h2>
        <p className="docs-lead">
          Buddy is a small wheeled robot. This website lets you see where it is, drive it, build a
          map of a room, and later drive using that saved map. You do not need to be a programmer
          to use the website — follow the steps below.
        </p>

        <h3>The usual order (do these once)</h3>
        <ol className="docs-list docs-steps">
          <li>
            <strong>Step 1 — Make a map</strong> (Mapping page): drive around so the robot learns
            the room, then save the map file on the computer.
          </li>
          <li>
            <strong>Step 2 — Use that map</strong> (Localization in the menu): tell the robot
            which saved map to use, then it can navigate on it.
          </li>
          <li>
            <strong>Step 3 — Send goals</strong> (optional): on the robot computer, RViz program
            → click where the robot should go. You can also watch the goal on the Dashboard map.
          </li>
        </ol>

        <h3 id="run-backend-frontend">How to run the backend and frontend</h3>
        <p className="docs-lead">
          You need <strong>two terminals</strong> on the robot PC (or one for backend if the UI
          runs elsewhere).
        </p>
        <p className="docs-lead">
          <strong>First time only:</strong> build Buddy, create Python venv,{' '}
          <code>pip install -r requirements.txt</code>, <code>python manage.py migrate</code>,{' '}
          <code>python manage.py seed_buddy_users</code>, and <code>npm install</code> in the
          frontend folder. Details in <strong>webapp/docs/USER_GUIDE.md</strong> Part 0.
        </p>
        <p>
          <strong>Terminal 1 — Backend (every time):</strong>
        </p>
        <pre className="docs-code">
{`cd ~/ros2_ws/webapp/backend
source .venv/bin/activate
source /opt/ros/jazzy/setup.bash
source ~/ros2_ws/install/setup.bash
python manage.py runserver 0.0.0.0:8001`}
        </pre>
        <p>
          <strong>Terminal 2 — Frontend (every time):</strong>
        </p>
        <pre className="docs-code">
{`cd ~/ros2_ws/webapp/frontend
npm run dev`}
        </pre>
        <p className="docs-lead">
          Open <strong>http://localhost:5173</strong> in your browser. Backend API: port{' '}
          <strong>8001</strong>.
        </p>

        <h3 id="signup-steps">How to sign up</h3>
        <ol className="docs-list docs-steps">
          <li>
            On the login page, click <strong>Create an account</strong> (or go to{' '}
            <code>/signup</code>).
          </li>
          <li>
            Enter <strong>name</strong>, <strong>username</strong>, <strong>email</strong>, and{' '}
            <strong>password</strong> (twice).
          </li>
          <li>
            Enter <strong>X</strong> and <strong>Y</strong> in meters (your dot on the shared
            map). Type numbers like <code>0</code> or <code>1.5</code> — not sliders.
          </li>
          <li>Click <strong>Sign up</strong>. You are logged in automatically.</li>
        </ol>
        <p className="docs-note">
          Only an <strong>admin</strong> can change your map X/Y after signup (Manage users).
        </p>

        <h3>Who can do what?</h3>
        <ul className="docs-list">
          <li>
            <strong>Everyone</strong> — Dashboard, Notifications, Teleop (drive), Settings, this
            help page.
          </li>
          <li>
            <strong>Admin only</strong> — Mapping (make a new map), Localization (use a saved
            map), Manage users.
          </li>
          <li>
            Log in as <strong>admin</strong> (password <code>admin123</code> in the demo) for
            Mapping and Localization.
          </li>
        </ul>

        <h3 id="login-steps">How to log in</h3>
        <ol className="docs-list docs-steps">
          <li>Open the Buddy website in your browser.</li>
          <li>Type your username and password.</li>
          <li>Click sign in. You land on the Dashboard.</li>
          <li>
            To sign out later: click your <strong>name</strong> (top right) → Sign out.
          </li>
        </ol>

        <h3 id="dashboard-steps">How to use the Dashboard</h3>
        <ol className="docs-list docs-steps">
          <li>
            Click <strong>Dashboard</strong> in the left menu if you are not already there.
          </li>
          <li>
            Read <strong>Current position</strong> — three numbers: where the robot thinks it is
            (x, y, and angle). If it says <strong>Live</strong>, data is updating. If{' '}
            <strong>No odom</strong>, the robot is not connected yet (ask whoever started the
            robot computer).
          </li>
          <li>
            Look at the <strong>map</strong> — walls are dark areas; the green arrow is the
            robot; colored dots are people using the site.
          </li>
          <li>
            After you start Localization, you may also see a gold mark (goal) and a blue line
            (path the robot plans to drive).
          </li>
        </ol>

        <h3 id="web-mapping">How to make a map (Mapping) — step by step</h3>
        <p className="docs-lead">
          <strong>Admin only.</strong> You are teaching the robot the shape of a room. Do this
          before Localization.
        </p>
        <p className="docs-lead">
          <strong>Before you start:</strong> log in as admin. Make sure Localization is stopped
          (not running at the same time).
        </p>
        <ol className="docs-list docs-steps">
          <li>
            In the left menu, click <strong>Mapping</strong>. A new page opens.
          </li>
          <li>
            You should see <strong>Mapping stopped</strong>. Click the big{' '}
            <strong>Start mapping</strong> button.
          </li>
          <li>
            Wait a few seconds. The label should change to <strong>Mapping active</strong>. On the
            robot computer, extra programs may open (that is normal).
          </li>
          <li>
            On the right side, a <strong>Drive while mapping</strong> area appears. Use the arrow
            buttons on screen, or the ↑ ↓ ← → keys on your keyboard. Hold to move; press{' '}
            <strong>Space</strong> to stop.
          </li>
          <li>
            Drive the robot <strong>slowly</strong> around the whole area you want on the map.
            Go every corridor and corner once.
          </li>
          <li>
            When finished, click <strong>Stop mapping</strong> (sidebar) or{' '}
            <strong>Stop stack (RViz, lidar, SLAM, motors)</strong> under the drive pad. Both stop
            the same <strong>ros2 launch</strong> on the robot computer (not only the website
            buttons).
          </li>
          <li>
            <strong>Important — save the map on the robot computer.</strong> Someone must run this
            in a terminal (copy and paste, press Enter):
            <pre className="docs-code">
{`ros2 run nav2_map_server map_saver_cli \\
  -f ~/ros2_ws/src/buddy/maps/my_map`}
            </pre>
            You can change <code>my_map</code> to another name. This creates the map files the
            website needs later.
          </li>
        </ol>
        <p className="docs-note">
          If the website says mapping is active but nothing happens on the robot, the server may
          be in “test only” mode — ask your team to start the website with ROS connected (not
          test mode). If RViz opens but the map stays empty, ask them to check environment variables{' '}
          <code>BUDDY_ROS_SETUP</code> and <code>BUDDY_WS_SETUP</code> (absolute paths help when
          Django is started by systemd) and the yellow warning on the Mapping page.
        </p>

        <h3 id="web-localization">How to use a saved map (Localization) — step by step</h3>
        <p className="docs-lead">
          <strong>Admin only.</strong> You already saved a map (see above). Now the robot will
          use that map to know where it is in the room.
        </p>
        <p className="docs-lead">
          <strong>Before you start:</strong> mapping must be stopped. The map file must exist in
          the robot’s <code>maps</code> folder.
        </p>
        <ol className="docs-list docs-steps">
          <li>
            In the left menu, click <strong>Localization</strong>. A panel opens on the side.
          </li>
          <li>
            Under <strong>1. Choose map</strong>, pick your map from the list (for example{' '}
            <code>my_map</code>). Maps come from <code>~/ros2_ws/src/buddy/maps/</code>.
          </li>
          <li>
            Click <strong>Start localization</strong>. Wait until it says{' '}
            <strong>Localization active</strong>.
          </li>
          <li>
            Click <strong>Dashboard</strong> in the menu. You should see your map and the robot
            on it.
          </li>
          <li>
            On the robot computer, open <strong>RViz</strong> (it may open by itself). If the
            robot position looks wrong, use <strong>2D Pose Estimate</strong> and click where the
            robot really is on the map.
          </li>
          <li>
            To send the robot somewhere: use <strong>2D Goal Pose</strong> in RViz and click the
            goal on the map. You will see the goal on the website Dashboard too.
          </li>
          <li>
            When done, go back to <strong>Localization</strong> and click{' '}
            <strong>Stop localization</strong>.
          </li>
        </ol>

        <h3>How to drive the robot (Teleop)</h3>
        <ol className="docs-list docs-steps">
          <li>
            Click <strong>Teleop</strong> in the left menu (or use the drive pad on the Mapping
            page while mapping).
          </li>
          <li>
            Check the small green lights say API, ROS, and Robot are OK (green). If Robot is
            not OK, the robot may not be running.
          </li>
          <li>
            Press and hold the direction you want (↑ ↓ ← → or the on-screen pad). Release to
            stop, or press <strong>Space</strong>.
          </li>
        </ol>

        <h3>Notifications</h3>
        <p>
          Click <strong>Notifications</strong> in the menu. You will see messages when you start
          or stop driving, when something fails, or when someone else uses the robot. A number on
          the menu shows unread messages.
        </p>

        <h3>Settings</h3>
        <p>
          View your username, email, and name. <strong>Regular users</strong> see map X/Y as
          read-only (set at signup). <strong>Admins</strong> can edit name and X/Y here or in{' '}
          <strong>Manage users</strong>.
        </p>
        <p className="docs-note">
          Theme: <strong>Light / Dark</strong> on login, signup, or at the bottom of the sidebar.
        </p>

        <h3 id="battery-api">Battery (sidebar and API)</h3>
        <p className="docs-lead">
          When the sidebar is <strong>open</strong>, <strong>voltage</strong> and{' '}
          <strong>remaining %</strong> appear under the Buddy logo. When the sidebar is{' '}
          <strong>collapsed</strong> (icon rail), a compact strip under the logo shows the{' '}
          <strong>%</strong> and a small charge bar. Data refreshes every few seconds when
          available.
        </p>
        <p className="docs-note">
          <strong>Future work:</strong> connect real hardware by publishing ROS battery messages —
          the website is ready; you do not need to change the UI.
        </p>
        <p>
          <strong>API link:</strong>{' '}
          <a href="http://127.0.0.1:8001/api/battery/" target="_blank" rel="noreferrer">
            http://127.0.0.1:8001/api/battery/
          </a>{' '}
          — returns JSON with <code>voltage</code>, <code>percentage</code>, <code>live</code>, and{' '}
          <code>topic</code>. Use this from scripts or when you add real battery hardware later.
        </p>
        <p>
          <strong>Robot:</strong> publish <code>sensor_msgs/BatteryState</code> on{' '}
          <code>/battery_state</code> (or set <code>BUDDY_WEB_BATTERY_TOPIC</code> on the backend).
        </p>
        <p className="docs-note">
          <strong>Test without ROS:</strong> <code>export BUDDY_BATTERY_MOCK_VOLTAGE=12.4</code> and{' '}
          <code>export BUDDY_BATTERY_MOCK_PERCENT=78</code>, then restart the backend.
        </p>

        <h3>Mobile (phone or tablet)</h3>
        <ul className="docs-list">
          <li>Sidebar shows icons on the left; tap <strong>›</strong> to open the full menu.</li>
          <li>
            While the menu is open, the page tells you to close it to see the Dashboard (or
            current page).
          </li>
          <li>Close with <strong>‹</strong>, tap outside, or <strong>Close menu</strong>.</li>
        </ul>

        <h3>When something goes wrong</h3>
        <ul className="docs-list">
          <li>
            <strong>“Mapping active” but robot does not move</strong> — Is the robot computer on?
            Is the website started with ROS? Try Stop, then Start again.
          </li>
          <li>
            <strong>Cannot start localization</strong> — Stop mapping first. Did you save the
            map after mapping?
          </li>
          <li>
            <strong>No maps in the list</strong> — Save a map first (see Mapping steps).
          </li>
          <li>
            <strong>Current position shows — — —</strong> — Robot not sending position yet; wait
            or restart the robot programs.
          </li>
          <li>
            <strong>Robot on map in wrong place</strong> — In RViz, use 2D Pose Estimate.
          </li>
          <li>
            <strong>RViz blank map / blank robot</strong> — Backend must source the right ROS +
            workspace for the launch subprocess (<code>BUDDY_ROS_SETUP</code>,{' '}
            <code>BUDDY_WS_SETUP</code>). See the Mapping page warning or ask your team to read{' '}
            <code>webapp/README.md</code> and <code>webapp/docs/USER_GUIDE.md</code>.
          </li>
        </ul>

        <h3 id="buddy-package-docs">Official robot guides (read in the browser)</h3>
        <p className="docs-lead">
          The full <strong>README</strong> and other files from <code>src/buddy</code> are loaded
          live from the robot computer — no need to open files in a text editor.
        </p>
        <p>
          <Link to="/docs/buddy" className="docs-cta-link">
            Open robot package docs →
          </Link>
        </p>
        <p className="docs-note">
          Includes README, drive train, installation, troubleshooting, and standalone guide.
          Full written guide: <strong>webapp/docs/USER_GUIDE.md</strong> · Install & run:{' '}
          <strong>webapp/README.md</strong>
        </p>
      </article>

      <h2 className="docs-section-heading">Quick reminders</h2>
      <div className="docs-grid">
        {WEB_SECTIONS.map((s) => (
          <article key={s.title} className="glass docs-card">
            <h2>{s.title}</h2>
            <p>{s.body}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
