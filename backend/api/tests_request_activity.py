import time
from unittest.mock import patch

from django.test import SimpleTestCase

from api.request_activity import (
    RequestActivityTracker,
    describe_request,
    get_active_requesters,
    get_activity_summary,
    register_request,
)


class RequestActivityTests(SimpleTestCase):
    def setUp(self) -> None:
        RequestActivityTracker._sessions.clear()

    def test_describe_request_known_path(self) -> None:
        self.assertEqual(
            describe_request("GET", "/api/status/"),
            "Checking robot status",
        )

    def test_active_requesters_lists_recent(self) -> None:
        register_request("alice", "Alice", "GET", "/api/status/")
        rows = get_active_requesters()
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["user"], "Alice")
        self.assertEqual(rows[0]["action"], "Checking robot status")

    def test_active_requesters_expires(self) -> None:
        register_request("alice", "Alice", "GET", "/api/status/")
        with patch.object(time, "time", return_value=time.time() + 20):
            self.assertEqual(get_active_requesters(), [])

    def test_activity_summary_others_excludes_current_user(self) -> None:
        register_request("alice", "Alice", "GET", "/api/status/")
        register_request("bob", "Bob", "GET", "/api/map/")
        summary = get_activity_summary("alice")
        self.assertTrue(summary["others_active"])
        self.assertEqual(summary["others_count"], 1)
        self.assertEqual(summary["other_requesters"][0]["username"], "bob")

    def test_activity_summary_no_others(self) -> None:
        register_request("alice", "Alice", "GET", "/api/status/")
        summary = get_activity_summary("alice")
        self.assertFalse(summary["others_active"])
        self.assertEqual(summary["others_count"], 0)
