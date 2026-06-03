from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from ros_bridge.localization_manager import LocalizationManager
from ros_bridge.map_cache import MapCache


class MapView(APIView):
    """Occupancy grid for RViz-style dashboard (file fallback or live /map)."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        loc = LocalizationManager.instance().get_status()
        data = MapCache.instance().get_map()
        data["localization_active"] = bool(loc.get("running"))
        data["localization_map"] = loc.get("map_id") if loc.get("running") else None
        return Response(data)


class MapPublicMetaView(APIView):
    """Map availability without full grid (optional)."""

    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        data = MapCache.instance().get_map()
        return Response(
            {
                "available": data.get("available", False),
                "source": data.get("source"),
                "map_name": data.get("map_name"),
                "width": data.get("width"),
                "height": data.get("height"),
                "resolution": data.get("resolution"),
            }
        )
