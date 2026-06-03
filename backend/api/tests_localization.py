from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from ros_bridge.map_loader import _default_map_dir

User = get_user_model()


class LocalizationApiTests(APITestCase):
    def setUp(self) -> None:
        self.admin = User.objects.create_user(
            username="admin",
            password="admin123",
            is_staff=True,
        )
        self.user = User.objects.create_user(username="alice", password="demo123")
        self.manager_patcher = patch("api.localization_views.LocalizationManager")
        self.mock_manager = self.manager_patcher.start()
        self.mock_manager.instance.return_value.get_status.return_value = {
            "running": False,
            "ros_disabled": True,
            "launch": "robot_navigation.launch.py",
            "sim": False,
            "map_id": None,
        }
        self.mock_manager.instance.return_value.start.return_value = {
            "running": True,
            "map_id": "my_map",
        }

    def tearDown(self) -> None:
        self.manager_patcher.stop()

    def test_maps_list_requires_admin(self) -> None:
        self.client.force_authenticate(self.user)
        res = self.client.get("/api/localization/maps/")
        self.assertEqual(res.status_code, 403)

    def test_maps_list_admin(self) -> None:
        self.client.force_authenticate(self.admin)
        res = self.client.get("/api/localization/maps/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("maps", res.data)
        maps_root = _default_map_dir().resolve()
        for entry in res.data["maps"]:
            yaml_path = entry["yaml_path"]
            self.assertTrue(
                str(yaml_path).startswith(str(maps_root)),
                msg=f"{yaml_path} not under {maps_root}",
            )
            self.assertTrue(entry["id"])

    def test_status_admin_only(self) -> None:
        self.client.force_authenticate(self.user)
        res = self.client.get("/api/localization/status/")
        self.assertEqual(res.status_code, 403)

    def test_start_requires_map(self) -> None:
        self.client.force_authenticate(self.admin)
        res = self.client.post("/api/localization/start/", {}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_start_localization(self) -> None:
        self.client.force_authenticate(self.admin)
        res = self.client.post(
            "/api/localization/start/",
            {"map": "my_map"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.mock_manager.instance.return_value.start.assert_called_once()
