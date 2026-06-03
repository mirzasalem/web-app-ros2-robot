from pathlib import Path

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from ros_bridge import buddy_docs

User = get_user_model()


class BuddyDocsApiTests(TestCase):
    def setUp(self) -> None:
        self.client = APIClient()
        user = User.objects.create_user(username="alice", password="demo123")
        self.token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

    def test_list_docs(self) -> None:
        res = self.client.get("/api/docs/buddy/")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertIn("docs", body)
        self.assertIn("package_root", body)
        ids = {d["id"] for d in body["docs"]}
        self.assertIn("readme", ids)

    def test_read_readme(self) -> None:
        res = self.client.get("/api/docs/buddy/readme/")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["id"], "readme")
        self.assertIn("content", body)
        self.assertIn("Buddy", body["content"])

    def test_unknown_doc(self) -> None:
        res = self.client.get("/api/docs/buddy/not-a-real-doc/")
        self.assertEqual(res.status_code, 404)

    def test_catalog_paths_under_package_root(self) -> None:
        root = buddy_docs.buddy_package_root()
        for entry in buddy_docs.DOC_CATALOG:
            path = (root / entry["file"]).resolve()
            path.relative_to(root)


class BuddyDocsModuleTests(TestCase):
    def test_read_readme_from_disk(self) -> None:
        root = buddy_docs.buddy_package_root()
        readme = root / "README.md"
        if not readme.is_file():
            self.skipTest("src/buddy/README.md not present in this workspace")
        doc = buddy_docs.read_buddy_doc("readme")
        self.assertTrue(doc["content"].startswith("<br>") or "Buddy" in doc["content"])
