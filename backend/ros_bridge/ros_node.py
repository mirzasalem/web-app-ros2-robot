"""ROS 2 bridge for Buddy — teleop, odometry, map, AMCL pose, Nav2 goal/plan."""

from __future__ import annotations

import math
import os
import threading
import time
from dataclasses import asdict, dataclass
from typing import Any, Optional

try:
    import rclpy
    from geometry_msgs.msg import PoseStamped, PoseWithCovarianceStamped, TwistStamped
    from nav_msgs.msg import OccupancyGrid, Odometry, Path
    from rcl_interfaces.msg import Log
    from rclpy.node import Node
    from sensor_msgs.msg import BatteryState

    ROS_AVAILABLE = True
    _ROS_LOG_ERROR = Log.ERROR
except ImportError:
    ROS_AVAILABLE = False
    Node = object  # type: ignore[misc, assignment]
    TwistStamped = None  # type: ignore[misc, assignment]
    Odometry = None  # type: ignore[misc, assignment]
    OccupancyGrid = None  # type: ignore[misc, assignment]
    PoseStamped = None  # type: ignore[misc, assignment]
    PoseWithCovarianceStamped = None  # type: ignore[misc, assignment]
    Path = None  # type: ignore[misc, assignment]
    Log = None  # type: ignore[misc, assignment]
    BatteryState = None  # type: ignore[misc, assignment]
    _ROS_LOG_ERROR = 40

MAX_PLAN_POINTS = 500
POSE_STALE_SEC = 2.0


def _quat_to_yaw(w: float, x: float, y: float, z: float) -> float:
    siny_cosp = 2.0 * (w * z + x * y)
    cosy_cosp = 1.0 - 2.0 * (y * y + z * z)
    return math.atan2(siny_cosp, cosy_cosp)


def _pose_dict(x: float, y: float, yaw: float) -> dict[str, float]:
    return {"x": float(x), "y": float(y), "yaw": float(yaw)}


def _decimate_path(points: list[dict[str, float]], max_pts: int = MAX_PLAN_POINTS) -> list[dict[str, float]]:
    if len(points) <= max_pts:
        return points
    step = max(1, len(points) // max_pts)
    return points[::step]


@dataclass
class RobotStatus:
    ros_available: bool = False
    connected: bool = False
    linear_x: float = 0.0
    angular_z: float = 0.0
    x: float = 0.0
    y: float = 0.0
    yaw: float = 0.0
    last_odom_sec: float | None = None

    def to_dict(self) -> dict:
        return asdict(self)


class _BuddyRosNode(Node):
    def __init__(self, bridge: "BuddyRosBridge") -> None:
        super().__init__("buddy_web_bridge")
        self._bridge = bridge
        cmd_topic = os.environ.get("BUDDY_WEB_CMD_TOPIC", "web_vel")
        odom_topic = os.environ.get("BUDDY_WEB_ODOM_TOPIC", "/odom")
        map_topic = os.environ.get("BUDDY_WEB_MAP_TOPIC", "/map")
        amcl_topic = os.environ.get("BUDDY_WEB_AMCL_TOPIC", "/amcl_pose")
        goal_topic = os.environ.get("BUDDY_WEB_GOAL_TOPIC", "/goal_pose")
        plan_topic = os.environ.get("BUDDY_WEB_PLAN_TOPIC", "/plan")
        battery_topic = os.environ.get("BUDDY_WEB_BATTERY_TOPIC", "/battery_state")

        self._cmd_pub = self.create_publisher(TwistStamped, cmd_topic, 10)
        self._odom_sub = self.create_subscription(
            Odometry, odom_topic, self._on_odom, 10
        )
        self._map_sub = self.create_subscription(
            OccupancyGrid, map_topic, self._on_map, 10
        )
        self._amcl_sub = self.create_subscription(
            PoseWithCovarianceStamped, amcl_topic, self._on_amcl, 10
        )
        self._goal_sub = self.create_subscription(
            PoseStamped, goal_topic, self._on_goal, 10
        )
        self._plan_sub = self.create_subscription(Path, plan_topic, self._on_plan, 10)
        self._rosout_sub = self.create_subscription(Log, "/rosout", self._on_rosout, 50)
        if BatteryState is not None:
            self._battery_sub = self.create_subscription(
                BatteryState, battery_topic, self._on_battery, 10
            )
        self.get_logger().info(
            "Buddy web bridge (cmd=%s odom=%s map=%s amcl=%s goal=%s plan=%s battery=%s)",
            cmd_topic,
            odom_topic,
            map_topic,
            amcl_topic,
            goal_topic,
            plan_topic,
            battery_topic,
        )

    def _on_map(self, msg: OccupancyGrid) -> None:
        from ros_bridge.map_cache import MapCache
        from ros_bridge.map_loader import occupancy_grid_to_payload

        MapCache.instance().update_from_ros(occupancy_grid_to_payload(msg))

    def _on_battery(self, msg: BatteryState) -> None:
        from ros_bridge.battery_store import BatteryStore

        BatteryStore.instance().update_from_ros(msg)

    def _on_odom(self, msg: Odometry) -> None:
        q = msg.pose.pose.orientation
        yaw = _quat_to_yaw(q.w, q.x, q.y, q.z)
        self._bridge._update_odom(
            x=msg.pose.pose.position.x,
            y=msg.pose.pose.position.y,
            yaw=yaw,
            linear_x=msg.twist.twist.linear.x,
            angular_z=msg.twist.twist.angular.z,
        )

    def _on_amcl(self, msg: PoseWithCovarianceStamped) -> None:
        p = msg.pose.pose.position
        q = msg.pose.pose.orientation
        yaw = _quat_to_yaw(q.w, q.x, q.y, q.z)
        self._bridge._update_map_pose(p.x, p.y, yaw)

    def _on_goal(self, msg: PoseStamped) -> None:
        p = msg.pose.position
        q = msg.pose.orientation
        yaw = _quat_to_yaw(q.w, q.x, q.y, q.z)
        self._bridge._update_nav_goal(p.x, p.y, yaw)

    def _on_plan(self, msg: Path) -> None:
        points = [
            {"x": pose.pose.position.x, "y": pose.pose.position.y}
            for pose in msg.poses
        ]
        self._bridge._update_nav_plan(points)

    def _on_rosout(self, msg: Log) -> None:
        from api.teleop_notifications import TeleopNotificationService

        TeleopNotificationService.handle_ros_log(
            level=int(msg.level),
            node_name=str(msg.name),
            text=str(msg.msg),
            error_level=_ROS_LOG_ERROR,
        )

    def publish_cmd(self, linear: float, angular: float) -> dict[str, Any]:
        msg = TwistStamped()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.header.frame_id = "base_link"
        msg.twist.linear.x = float(linear)
        msg.twist.angular.z = float(angular)
        self._cmd_pub.publish(msg)
        warning: str | None = None
        try:
            if self._cmd_pub.get_subscription_count() == 0:
                warning = (
                    "Command published but nothing is subscribed on the teleop topic "
                    "(is twist_mux / the robot stack running?)."
                )
        except Exception:
            pass
        return {"published": True, "warning": warning}


class BuddyRosBridge:
    """Thread-safe singleton bridge between Django and ROS 2."""

    _instance: "BuddyRosBridge | None" = None
    _lock = threading.Lock()

    def __init__(self) -> None:
        self._status_lock = threading.Lock()
        self._status = RobotStatus(ros_available=ROS_AVAILABLE)
        self._nav_lock = threading.Lock()
        self._map_pose: Optional[dict[str, float]] = None
        self._last_amcl_sec: Optional[float] = None
        self._nav_goal: Optional[dict[str, float]] = None
        self._nav_plan: list[dict[str, float]] = []
        self._node: _BuddyRosNode | None = None
        self._thread: threading.Thread | None = None
        self._running = False

    @classmethod
    def instance(cls) -> "BuddyRosBridge":
        with cls._lock:
            if cls._instance is None:
                cls._instance = cls()
            return cls._instance

    def start(self) -> None:
        if self._running:
            return
        if not ROS_AVAILABLE:
            return
        if os.environ.get("BUDDY_WEB_DISABLE_ROS", "").lower() in ("1", "true", "yes"):
            return

        self._running = True
        self._thread = threading.Thread(target=self._spin_loop, daemon=True)
        self._thread.start()

    def _spin_loop(self) -> None:
        rclpy.init()
        self._node = _BuddyRosNode(self)
        with self._status_lock:
            self._status.connected = True

        try:
            while self._running and rclpy.ok():
                rclpy.spin_once(self._node, timeout_sec=0.05)
        finally:
            with self._status_lock:
                self._status.connected = False
            self._node.destroy_node()
            rclpy.shutdown()

    def stop(self) -> None:
        self._running = False

    def _update_odom(
        self,
        *,
        x: float,
        y: float,
        yaw: float,
        linear_x: float,
        angular_z: float,
    ) -> None:
        with self._status_lock:
            self._status.x = x
            self._status.y = y
            self._status.yaw = yaw
            self._status.linear_x = linear_x
            self._status.angular_z = angular_z
            self._status.last_odom_sec = time.time()

    def _update_map_pose(self, x: float, y: float, yaw: float) -> None:
        with self._nav_lock:
            self._map_pose = _pose_dict(x, y, yaw)
            self._last_amcl_sec = time.time()

    def _update_nav_goal(self, x: float, y: float, yaw: float) -> None:
        with self._nav_lock:
            self._nav_goal = _pose_dict(x, y, yaw)

    def _update_nav_plan(self, points: list[dict[str, float]]) -> None:
        with self._nav_lock:
            self._nav_plan = _decimate_path(points)

    def clear_nav_state(self) -> None:
        with self._nav_lock:
            self._map_pose = None
            self._last_amcl_sec = None
            self._nav_goal = None
            self._nav_plan = []

    def get_status(self) -> dict[str, Any]:
        with self._status_lock:
            status = RobotStatus(**self._status.to_dict())
            if status.last_odom_sec is not None:
                status.connected = (time.time() - status.last_odom_sec) < POSE_STALE_SEC
            data: dict[str, Any] = status.to_dict()

        with self._nav_lock:
            amcl_live = (
                self._last_amcl_sec is not None
                and (time.time() - self._last_amcl_sec) < POSE_STALE_SEC
            )
            data["map_pose"] = self._map_pose if amcl_live else None
            data["map_pose_live"] = amcl_live
            data["nav_goal"] = self._nav_goal
            data["nav_plan"] = list(self._nav_plan)

        return data

    def send_velocity(self, linear: float, angular: float) -> dict[str, Any]:
        linear = max(-0.18, min(0.18, linear))
        angular = max(-1.4, min(1.4, angular))
        result: dict[str, Any] = {
            "ok": False,
            "published": False,
            "ros_available": ROS_AVAILABLE,
            "linear": linear,
            "angular": angular,
            "error": None,
            "warning": None,
        }

        if not ROS_AVAILABLE:
            result["error"] = (
                "ROS 2 (rclpy) is not available on the web server. "
                "Run Django with ROS sourced."
            )
            return result

        if os.environ.get("BUDDY_WEB_DISABLE_ROS", "").lower() in ("1", "true", "yes"):
            result["ok"] = True
            result["warning"] = (
                "ROS disabled on server (BUDDY_WEB_DISABLE_ROS) — command not sent to the robot."
            )
            return result

        if self._node is None:
            result["error"] = (
                "ROS bridge is not running. Start the Buddy robot stack on the server "
                "and ensure the web backend has ROS sourced."
            )
            return result

        try:
            pub_result = self._node.publish_cmd(linear, angular)
            result["published"] = True
            result["ok"] = True
            if pub_result.get("warning"):
                result["warning"] = pub_result["warning"]
        except Exception as exc:
            result["error"] = f"ROS publish failed: {exc}"
        return result

    def stop_robot(self) -> dict[str, Any]:
        return self.send_velocity(0.0, 0.0)
