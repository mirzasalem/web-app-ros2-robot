from django.contrib import admin

from accounts.models import Notification, UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("display_name", "user", "position_x", "position_y", "updated_at")
    search_fields = ("display_name", "user__username")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "read", "created_at")
    list_filter = ("read",)
