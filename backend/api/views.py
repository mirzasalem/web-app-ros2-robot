from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from api.request_activity import get_active_requesters, get_activity_summary
from api.teleop_notifications import TeleopNotificationService
from ros_bridge.localization_manager import LocalizationManager
from ros_bridge.ros_node import BuddyRosBridge


def _authenticated_user(request: Request):
    user = request.user
    if user is not None and user.is_authenticated:
        return user
    return None


class HealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        return Response({"status": "ok", "service": "buddy-web"})


class RobotStatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        data = BuddyRosBridge.instance().get_status()
        current_user = (
            request.user.username if request.user.is_authenticated else None
        )
        data["active_requesters"] = get_active_requesters()
        data["activity"] = get_activity_summary(current_user)
        data["localization"] = LocalizationManager.instance().get_status()
        return Response(data)


class TeleopView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        try:
            linear = float(request.data.get("linear", 0.0))
            angular = float(request.data.get("angular", 0.0))
        except (TypeError, ValueError):
            return Response(
                {"detail": "linear and angular must be numbers"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = BuddyRosBridge.instance().send_velocity(linear, angular)
        user = _authenticated_user(request)
        TeleopNotificationService.handle_command(
            user,
            linear=linear,
            angular=angular,
            result=result,
            stopping=not (abs(linear) > 0.001 or abs(angular) > 0.001),
        )
        return Response(result)

    def delete(self, request: Request) -> Response:
        result = BuddyRosBridge.instance().stop_robot()
        user = _authenticated_user(request)
        TeleopNotificationService.handle_command(
            user,
            linear=0.0,
            angular=0.0,
            result=result,
            stopping=True,
        )
        return Response(result)


class StopView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        result = BuddyRosBridge.instance().stop_robot()
        user = _authenticated_user(request)
        TeleopNotificationService.handle_command(
            user,
            linear=0.0,
            angular=0.0,
            result=result,
            stopping=True,
        )
        payload = {"stopped": bool(result.get("ok")), **result}
        return Response(payload)
