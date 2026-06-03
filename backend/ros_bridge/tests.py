import os
import time
from unittest.mock import patch

from django.test import SimpleTestCase

from ros_bridge.ros_node import BuddyRosBridge, _quat_to_yaw


class RosBridgeTests(SimpleTestCase):
    def test_quat_to_yaw_identity(self) -> None:
        yaw = _quat_to_yaw(1.0, 0.0, 0.0, 0.0)
        self.assertAlmostEqual(yaw, 0.0, places=5)

    def test_send_velocity_clamped(self) -> None:
        bridge = BuddyRosBridge()
        bridge._node = None
        bridge.send_velocity(99.0, -99.0)
        # no crash without ROS node

    def test_get_status_marks_stale_odom_disconnected(self) -> None:
        bridge = BuddyRosBridge()
        bridge._update_odom(x=1.0, y=2.0, yaw=0.1, linear_x=0.0, angular_z=0.0)
        with patch.object(time, "time", return_value=bridge._status.last_odom_sec + 5):
            data = bridge.get_status()
        self.assertFalse(data["connected"])

    def test_get_status_recent_odom_connected(self) -> None:
        bridge = BuddyRosBridge()
        bridge._update_odom(x=0.0, y=0.0, yaw=0.0, linear_x=0.1, angular_z=0.0)
        data = bridge.get_status()
        self.assertTrue(data["connected"])

    def test_stop_robot(self) -> None:
        bridge = BuddyRosBridge()
        with patch.object(bridge, "send_velocity") as mock_send:
            bridge.stop_robot()
        mock_send.assert_called_once_with(0.0, 0.0)

    @patch.dict(os.environ, {"BUDDY_WEB_DISABLE_ROS": "1"})
    def test_start_respects_disable_flag(self) -> None:
        bridge = BuddyRosBridge()
        bridge.start()
        self.assertFalse(bridge._running)
