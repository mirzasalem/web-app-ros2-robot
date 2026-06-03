from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminUser
from ros_bridge.launch_subprocess import RosEnvironmentError
from ros_bridge.mapping_manager import MappingManager


def _display_name(request: Request) -> str:
    user = request.user
    profile = getattr(user, "profile", None)
    if profile is not None:
        return profile.display_name
    return user.username


class MappingStatusView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request: Request) -> Response:
        return Response(MappingManager.instance().get_status())


class MappingStartView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request: Request) -> Response:
        try:
            data = MappingManager.instance().start(
                username=request.user.username,
                display_name=_display_name(request),
            )
        except RuntimeError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        except RosEnvironmentError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except FileNotFoundError:
            return Response(
                {"detail": "ros2 launch not found. Source ROS and workspace on the server."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except OSError as exc:
            return Response(
                {"detail": f"Could not start mapping: {exc}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(data)


class MappingStopView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request: Request) -> Response:
        return Response(MappingManager.instance().stop())
