from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from accounts.models import Notification
from api.teleop_notifications import TeleopNotificationService

User = get_user_model()


class TeleopNotificationTests(APITestCase):
    def setUp(self) -> None:
        TeleopNotificationService.reset()
        self.alice = User.objects.create_user(
            username="alice_teleop",
            password="demo123",
        )
        self.alice.profile.display_name = "Alice"
        self.alice.profile.save()
        self.bob = User.objects.create_user(
            username="bob_teleop",
            password="demo123",
        )
        self.bob.profile.display_name = "Bob"
        self.bob.profile.save()
        self.token = Token.objects.create(user=self.alice)

        self.bridge_patcher = patch("api.views.BuddyRosBridge")
        self.mock_bridge_cls = self.bridge_patcher.start()
        self.bridge = MagicMock()
        self.mock_bridge_cls.instance.return_value = self.bridge

    def tearDown(self) -> None:
        self.bridge_patcher.stop()
        TeleopNotificationService.reset()

    def _auth(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

    def test_drive_start_creates_notifications(self) -> None:
        self._auth()
        self.bridge.send_velocity.return_value = {
            "ok": True,
            "published": True,
            "ros_available": True,
            "linear": 0.1,
            "angular": 0.0,
            "error": None,
            "warning": None,
        }
        res = self.client.post(
            "/api/teleop/",
            {"linear": 0.1, "angular": 0.0},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(
            Notification.objects.filter(user=self.alice, title="Robot control started").count(),
            1,
        )
        self.assertEqual(
            Notification.objects.filter(user=self.bob, title="Robot in use").count(),
            1,
        )

    def test_ros_failure_creates_notification(self) -> None:
        self._auth()
        self.bridge.send_velocity.return_value = {
            "ok": False,
            "published": False,
            "ros_available": False,
            "linear": 0.1,
            "angular": 0.0,
            "error": "ROS bridge is not running.",
            "warning": None,
        }
        self.client.post(
            "/api/teleop/",
            {"linear": 0.1, "angular": 0.0},
            format="json",
        )
        self.assertEqual(
            Notification.objects.filter(user=self.alice, title="ROS teleop failed").count(),
            1,
        )

    def test_stop_creates_success_notification(self) -> None:
        self._auth()
        TeleopNotificationService._driving.add(self.alice.username)
        self.bridge.stop_robot.return_value = {
            "ok": True,
            "published": True,
            "ros_available": True,
            "linear": 0.0,
            "angular": 0.0,
            "error": None,
            "warning": None,
        }
        self.client.post("/api/stop/", {}, format="json")
        self.assertEqual(
            Notification.objects.filter(user=self.alice, title="Robot stopped").count(),
            1,
        )
