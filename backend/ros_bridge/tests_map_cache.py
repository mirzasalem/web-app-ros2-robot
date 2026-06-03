import os
from pathlib import Path

from django.test import SimpleTestCase

from ros_bridge.map_cache import MapCache
from ros_bridge.map_catalog import list_available_maps


class MapCacheTests(SimpleTestCase):
    def setUp(self) -> None:
        MapCache._instance = None

    def test_load_from_yaml(self) -> None:
        maps = list_available_maps()
        self.assertGreaterEqual(len(maps), 1)
        data = MapCache.instance().load_from_yaml(maps[0]["yaml_path"])
        self.assertTrue(data["available"])
        self.assertEqual(data["source"], "localization")
        self.assertEqual(data["map_name"], maps[0]["id"])
