from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from accounts.models import Notification, UserProfile

DEMO_USERS = [
    {
        "username": "admin",
        "password": "admin123",
        "display_name": "Admin",
        "is_staff": True,
        "is_superuser": True,
        "position_x": 0.0,
        "position_y": 0.0,
    },
    {
        "username": "alice",
        "password": "demo123",
        "display_name": "Alice Explorer",
        "position_x": 1.5,
        "position_y": 2.0,
    },
    {
        "username": "bob",
        "password": "demo123",
        "display_name": "Bob Navigator",
        "position_x": 3.2,
        "position_y": 1.1,
    },
    {
        "username": "charlie",
        "password": "demo123",
        "display_name": "Charlie Mapper",
        "position_x": -1.2,
        "position_y": 4.0,
    },
    {
        "username": "diana",
        "password": "demo123",
        "display_name": "Diana Pilot",
        "position_x": 0.5,
        "position_y": -2.3,
    },
]

NOTIFICATIONS = {
    "alice": [
        ("Mapping complete", "Your saved map is ready for navigation."),
        ("Low battery", "Charge Buddy before the next run."),
    ],
    "bob": [
        ("Nav2 goal reached", "Robot arrived at the target pose."),
    ],
    "charlie": [
        ("SLAM started", "Drive slowly while building the map."),
        ("Joystick connected", "Gamepad detected on /dev/input/js0."),
    ],
    "admin": [
        ("System", "You have admin access to manage all user positions."),
    ],
}


class Command(BaseCommand):
    help = "Create admin + demo users with positions and sample notifications."

    def handle(self, *args, **options) -> None:
        for spec in DEMO_USERS:
            user, created = User.objects.get_or_create(
                username=spec["username"],
                defaults={
                    "is_staff": spec.get("is_staff", False),
                    "is_superuser": spec.get("is_superuser", False),
                },
            )
            if created:
                user.set_password(spec["password"])
                user.is_staff = spec.get("is_staff", False)
                user.is_superuser = spec.get("is_superuser", False)
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Created user: {user.username}"))
            else:
                user.set_password(spec["password"])
                user.is_staff = spec.get("is_staff", False)
                user.is_superuser = spec.get("is_superuser", False)
                user.save()
                self.stdout.write(f"Updated user: {user.username}")

            profile = user.profile
            profile.display_name = spec["display_name"]
            profile.position_x = spec["position_x"]
            profile.position_y = spec["position_y"]
            profile.save()

        Notification.objects.filter(
            user__username__in=NOTIFICATIONS.keys()
        ).delete()
        for username, notes in NOTIFICATIONS.items():
            user = User.objects.get(username=username)
            for title, message in notes:
                Notification.objects.create(user=user, title=title, message=message)

        self.stdout.write(self.style.SUCCESS("Seed complete."))
        self.stdout.write("Login: admin / admin123  |  demo users: alice,bob,charlie,diana / demo123")
