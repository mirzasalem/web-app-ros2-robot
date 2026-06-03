from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminUser
from ros_bridge.localization_manager import LocalizationManager
from ros_bridge.launch_subprocess import RosEnvironmentError
from ros_bridge.map_catalog import list_available_maps


def _display_name(request: Request) -> str:
    user = request.user
    profile = getattr(user, "profile", None)
    if profile is not None:
        return profile.display_name
    return user.username


class LocalizationMapsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request: Request) -> Response:
        return Response({"maps": list_available_maps()})


class LocalizationStatusView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request: Request) -> Response:
        return Response(LocalizationManager.instance().get_status())


class LocalizationStartView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request: Request) -> Response:
        map_id = request.data.get("map") or request.data.get("map_id")
        if not map_id:
            return Response(
                {"detail": "Choose a map (field: map)."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            data = LocalizationManager.instance().start(
                map_id=str(map_id),
                username=request.user.username,
                display_name=_display_name(request),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except RosEnvironmentError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except FileNotFoundError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        except RuntimeError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        except OSError as exc:
            return Response(
                {"detail": f"Could not start localization: {exc}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(data)


class LocalizationStopView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request: Request) -> Response:
        return Response(LocalizationManager.instance().stop())
