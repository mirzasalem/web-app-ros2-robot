from django.apps import AppConfig


class RosBridgeConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "ros_bridge"

    def ready(self) -> None:
        import sys

        if "test" in sys.argv:
            return

        from ros_bridge.ros_node import BuddyRosBridge

        BuddyRosBridge.instance().start()
