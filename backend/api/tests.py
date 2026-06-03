from unittest.mock import MagicMock, patch

from django.test import TestCase
from rest_framework.test import APIClient


class ApiTests(TestCase):
    def setUp(self) -> None:
        self.client = APIClient()
        self.bridge_patcher = patch("api.views.BuddyRosBridge")
        self.mock_bridge_cls = self.bridge_patcher.start()
        self.bridge = MagicMock()
        self.mock_bridge_cls.instance.return_value = self.bridge
        self.bridge.get_status.return_value = {
            "ros_available": False,
            "connected": False,
            "linear_x": 0.0,
            "angular_z": 0.0,
            "x": 1.0,
            "y": 2.0,
            "yaw": 0.5,
            "last_odom_sec": None,
        }
        self.teleop_ok = {
            "ok": True,
            "published": True,
            "ros_available": True,
            "linear": 0.0,
            "angular": 0.0,
            "error": None,
            "warning": None,
        }
        self.bridge.send_velocity.return_value = self.teleop_ok
        self.bridge.stop_robot.return_value = self.teleop_ok

    def tearDown(self) -> None:
        self.bridge_patcher.stop()

    def test_health(self) -> None:
        res = self.client.get("/api/health/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["service"], "buddy-web")

    def test_status(self) -> None:
        res = self.client.get("/api/status/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["x"], 1.0)
        self.bridge.get_status.assert_called_once()

    def test_teleop_post(self) -> None:
        res = self.client.post(
            "/api/teleop/",
            {"linear": 0.1, "angular": -0.2},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["ok"])
        self.bridge.send_velocity.assert_called_once_with(0.1, -0.2)

    def test_teleop_invalid(self) -> None:
        res = self.client.post(
            "/api/teleop/",
            {"linear": "fast", "angular": 0},
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_teleop_delete_stops(self) -> None:
        res = self.client.delete("/api/teleop/")
        self.assertEqual(res.status_code, 200)
        self.bridge.stop_robot.assert_called_once()

    def test_stop_post(self) -> None:
        res = self.client.post("/api/stop/", {}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["stopped"])
        self.bridge.stop_robot.assert_called_once()
