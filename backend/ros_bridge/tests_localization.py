import os
from unittest.mock import patch

from django.test import SimpleTestCase

from ros_bridge.localization_manager import LocalizationManager
from ros_bridge.map_catalog import list_available_maps, resolve_map_yaml


class MapCatalogTests(SimpleTestCase):
    def test_list_and_resolve_maps(self) -> None:
        maps = list_available_maps()
        self.assertGreaterEqual(len(maps), 1)
        first_id = maps[0]["id"]
        path = resolve_map_yaml(first_id)
        self.assertTrue(path.is_file())
        self.assertEqual(path.stem, first_id)

    def test_resolve_missing_map(self) -> None:
        with self.assertRaises(FileNotFoundError):
            resolve_map_yaml("map_does_not_exist_zzz")


class LocalizationManagerTests(SimpleTestCase):
    def setUp(self) -> None:
        LocalizationManager._instance = None

    @patch.dict(os.environ, {"BUDDY_WEB_DISABLE_ROS": "1"})
    def test_simulated_start_stop(self) -> None:
        maps = list_available_maps()
        mgr = LocalizationManager.instance()
        data = mgr.start(
            map_id=maps[0]["id"],
            username="admin",
            display_name="Admin",
        )
        self.assertTrue(data["running"])
        self.assertEqual(data["map_id"], maps[0]["id"])
        data = mgr.stop()
        self.assertFalse(data["running"])
