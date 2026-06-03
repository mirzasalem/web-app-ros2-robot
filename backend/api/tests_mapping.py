from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient


class MappingApiTests(TestCase):
    def setUp(self) -> None:
        self.client = APIClient()
        self.admin = User.objects.get(username="admin")
        self.alice = User.objects.get(username="alice")
        self.admin_token = Token.objects.get_or_create(user=self.admin)[0].key
        self.alice_token = Token.objects.get_or_create(user=self.alice)[0].key
        self.manager_patcher = patch("api.mapping_views.MappingManager")
        self.mock_cls = self.manager_patcher.start()
        self.manager = MagicMock()
        self.mock_cls.instance.return_value = self.manager
        self.manager.get_status.return_value = {
            "running": False,
            "ros_disabled": True,
            "launch": "robot_mapping.launch.py",
            "sim": False,
            "started_by": None,
            "started_by_display": None,
            "started_at": None,
            "pid": None,
            "rviz_disabled_by_env": False,
            "ros_setup_path": "/opt/ros/jazzy/setup.bash",
            "ws_setup_path": "/home/x/ros2_ws/install/setup.bash",
            "setup_files_ok": True,
        }

    def tearDown(self) -> None:
        self.manager_patcher.stop()

    def test_status_requires_admin(self) -> None:
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.alice_token}")
        res = self.client.get("/api/mapping/status/")
        self.assertEqual(res.status_code, 403)

    def test_status_admin(self) -> None:
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.admin_token}")
        res = self.client.get("/api/mapping/status/")
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.json()["running"])

    def test_start_mapping(self) -> None:
        self.manager.start.return_value = {
            "running": True,
            "started_by": "admin",
            "started_by_display": "Admin",
        }
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.admin_token}")
        res = self.client.post("/api/mapping/start/", {}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["running"])
        self.manager.start.assert_called_once()

    def test_stop_mapping(self) -> None:
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.admin_token}")
        res = self.client.post("/api/mapping/stop/", {}, format="json")
        self.assertEqual(res.status_code, 200)
        self.manager.stop.assert_called_once()
