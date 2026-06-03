from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers

from accounts.models import Notification, UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    is_admin = serializers.SerializerMethodField()
    user_id = serializers.IntegerField(source="user.id", read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "user_id",
            "username",
            "email",
            "display_name",
            "position_x",
            "position_y",
            "is_admin",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]

    def get_is_admin(self, obj: UserProfile) -> bool:
        return obj.user.is_staff or obj.user.is_superuser


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["display_name", "position_x", "position_y"]


class RegisterSerializer(serializers.Serializer):
    display_name = serializers.CharField(max_length=120)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, max_length=128, write_only=True)
    position_x = serializers.FloatField(default=0.0)
    position_y = serializers.FloatField(default=0.0)

    def validate_username(self, value: str) -> str:
        username = value.strip()
        if not username:
            raise serializers.ValidationError("Username is required.")
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError("This username is already taken.")
        return username

    def validate_email(self, value: str) -> str:
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("This email is already registered.")
        return email

    def validate_display_name(self, value: str) -> str:
        name = value.strip()
        if not name:
            raise serializers.ValidationError("Name is required.")
        return name

    def create(self, validated_data: dict) -> User:
        display_name = validated_data.pop("display_name")
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )
        profile = user.profile
        profile.display_name = display_name
        profile.position_x = validated_data["position_x"]
        profile.position_y = validated_data["position_y"]
        profile.save(
            update_fields=["display_name", "position_x", "position_y", "updated_at"]
        )
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs: dict) -> dict:
        user = authenticate(
            username=attrs["username"],
            password=attrs["password"],
        )
        if not user:
            raise serializers.ValidationError("Invalid username or password.")
        attrs["user"] = user
        return attrs


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "title", "message", "read", "created_at"]
        read_only_fields = fields
