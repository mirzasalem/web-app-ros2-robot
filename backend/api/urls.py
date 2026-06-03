from django.urls import path

from api import battery_views, docs_views, localization_views, map_views, mapping_views, views

urlpatterns = [
    path("health/", views.HealthView.as_view(), name="health"),
    path("battery/", battery_views.BatteryView.as_view(), name="battery"),
    path("map/", map_views.MapView.as_view(), name="map"),
    path("map/meta/", map_views.MapPublicMetaView.as_view(), name="map-meta"),
    path("status/", views.RobotStatusView.as_view(), name="status"),
    path("teleop/", views.TeleopView.as_view(), name="teleop"),
    path("stop/", views.StopView.as_view(), name="stop"),
    path("mapping/status/", mapping_views.MappingStatusView.as_view(), name="mapping-status"),
    path("mapping/start/", mapping_views.MappingStartView.as_view(), name="mapping-start"),
    path("mapping/stop/", mapping_views.MappingStopView.as_view(), name="mapping-stop"),
    path(
        "localization/maps/",
        localization_views.LocalizationMapsView.as_view(),
        name="localization-maps",
    ),
    path(
        "localization/status/",
        localization_views.LocalizationStatusView.as_view(),
        name="localization-status",
    ),
    path(
        "localization/start/",
        localization_views.LocalizationStartView.as_view(),
        name="localization-start",
    ),
    path(
        "localization/stop/",
        localization_views.LocalizationStopView.as_view(),
        name="localization-stop",
    ),
    path("docs/buddy/", docs_views.BuddyDocsListView.as_view(), name="buddy-docs-list"),
    path(
        "docs/buddy/<str:doc_id>/",
        docs_views.BuddyDocDetailView.as_view(),
        name="buddy-doc-detail",
    ),
]
