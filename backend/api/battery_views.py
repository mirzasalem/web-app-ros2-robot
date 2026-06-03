from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from ros_bridge.battery_store import BatteryStore


class BatteryView(APIView):
    """
    Battery voltage (V) and remaining charge (%).

    Wire the robot to publish sensor_msgs/BatteryState on BUDDY_WEB_BATTERY_TOPIC
  (default /battery_state). For UI testing without ROS, set BUDDY_BATTERY_MOCK_VOLTAGE
    and BUDDY_BATTERY_MOCK_PERCENT on the server.
    """

    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        payload = BatteryStore.instance().get_payload()
        payload["api"] = "/api/battery/"
        return Response(payload)
