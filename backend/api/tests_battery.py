import os
from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from ros_bridge.battery_store import BatteryStore


class BatteryApiTests(TestCase):
    def setUp(self) -> None:
        BatteryStore._instance = None
        self.client = APIClient()

    def tearDown(self) -> None:
        BatteryStore._instance = None

    def test_battery_endpoint_shape(self) -> None:
        res = self.client.get("/api/battery/")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["api"], "/api/battery/")
        self.assertIn("voltage", body)
        self.assertIn("percentage", body)
        self.assertIn("available", body)
        self.assertIn("live", body)
        self.assertIn("topic", body)
        self.assertIn("source", body)

    @patch.dict(
        os.environ,
        {"BUDDY_BATTERY_MOCK_VOLTAGE": "12.4", "BUDDY_BATTERY_MOCK_PERCENT": "78"},
    )
    def test_battery_mock_env(self) -> None:
        BatteryStore._instance = None
        res = self.client.get("/api/battery/")
        body = res.json()
        self.assertTrue(body["available"])
        self.assertEqual(body["voltage"], 12.4)
        self.assertEqual(body["percentage"], 78.0)
        self.assertEqual(body["source"], "mock")
