from django.contrib.auth.models import User
from django.core.management import call_command
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from accounts.models import UserProfile


class AccountsApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        call_command("seed_buddy_users", verbosity=0)

    def setUp(self) -> None:
        self.admin = User.objects.get(username="admin")
        self.alice = User.objects.get(username="alice")
        self.admin_token = Token.objects.get_or_create(user=self.admin)[0].key
        self.alice_token = Token.objects.get_or_create(user=self.alice)[0].key

    def test_login_success(self) -> None:
        res = self.client.post(
            "/api/auth/login/",
            {"username": "admin", "password": "admin123"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn("token", res.json())
        self.assertTrue(res.json()["user"]["is_admin"])

    def test_login_failure(self) -> None:
        res = self.client.post(
            "/api/auth/login/",
            {"username": "admin", "password": "wrong"},
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_me_requires_auth(self) -> None:
        res = self.client.get("/api/auth/me/")
        self.assertEqual(res.status_code, 401)

    def test_register_creates_user(self) -> None:
        res = self.client.post(
            "/api/auth/register/",
            {
                "display_name": "New User",
                "username": "newuser",
                "email": "new@example.com",
                "password": "securepass1",
                "position_x": 1.5,
                "position_y": 2.5,
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        body = res.json()
        self.assertIn("token", body)
        self.assertEqual(body["user"]["display_name"], "New User")
        self.assertEqual(body["user"]["email"], "new@example.com")
        profile = UserProfile.objects.get(user__username="newuser")
        self.assertEqual(profile.position_x, 1.5)
        self.assertEqual(profile.position_y, 2.5)

    def test_register_duplicate_username(self) -> None:
        res = self.client.post(
            "/api/auth/register/",
            {
                "display_name": "X",
                "username": "alice",
                "email": "other@example.com",
                "password": "securepass1",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_non_admin_cannot_update_own_position(self) -> None:
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.alice_token}")
        res = self.client.patch(
            "/api/auth/me/",
            {"position_x": 9.0, "position_y": 8.0},
            format="json",
        )
        self.assertEqual(res.status_code, 403)

    def test_admin_updates_user_name_and_position(self) -> None:
        bob = User.objects.get(username="bob")
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.admin_token}")
        res = self.client.patch(
            f"/api/users/{bob.id}/",
            {
                "display_name": "Bob Updated",
                "position_x": 5.0,
                "position_y": 5.0,
            },
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        bob.profile.refresh_from_db()
        self.assertEqual(bob.profile.display_name, "Bob Updated")
        self.assertEqual(bob.profile.position_x, 5.0)

    def test_non_admin_cannot_rename_others(self) -> None:
        bob = User.objects.get(username="bob")
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.alice_token}")
        res = self.client.patch(
            f"/api/users/{bob.id}/",
            {"display_name": "Hacked"},
            format="json",
        )
        self.assertEqual(res.status_code, 403)

    def test_list_users(self) -> None:
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.alice_token}")
        res = self.client.get("/api/users/")
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.json()), 5)

    def test_notifications(self) -> None:
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.alice_token}")
        res = self.client.get("/api/notifications/")
        self.assertEqual(res.status_code, 200)
        self.assertGreater(len(res.json()), 0)
