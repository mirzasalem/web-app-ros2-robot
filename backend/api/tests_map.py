from django.contrib.auth.models import User
from django.core.management import call_command
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from ros_bridge.map_cache import MapCache


class MapApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        call_command("seed_buddy_users", verbosity=0)

    def setUp(self) -> None:
        user = User.objects.get(username="admin")
        self.token = Token.objects.get_or_create(user=user)[0].key
        MapCache.instance().reload_file()

    def test_map_requires_auth(self) -> None:
        res = self.client.get("/api/map/")
        self.assertEqual(res.status_code, 401)

    def test_map_returns_grid(self) -> None:
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token}")
        res = self.client.get("/api/map/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        if data.get("available"):
            self.assertIn("data_b64", data)
            self.assertGreater(data["width"], 0)
            self.assertGreater(data["height"], 0)
