import os
from unittest.mock import patch

from django.test import SimpleTestCase

from ros_bridge.mapping_manager import MappingManager


class MappingManagerTests(SimpleTestCase):
    def setUp(self) -> None:
        MappingManager._instance = None

    @patch.dict(os.environ, {"BUDDY_WEB_DISABLE_ROS": "1"})
    def test_simulated_start_stop(self) -> None:
        mgr = MappingManager.instance()
        data = mgr.start(username="admin", display_name="Admin")
        self.assertTrue(data["running"])
        self.assertEqual(data["started_by"], "admin")
        data = mgr.stop()
        self.assertFalse(data["running"])
