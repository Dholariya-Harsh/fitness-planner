from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    bmi = serializers.ReadOnlyField(source='calculate_bmi')
    bmr = serializers.ReadOnlyField(source='calculate_bmr')
    tdee = serializers.ReadOnlyField(source='calculate_tdee')
    target_calories = serializers.ReadOnlyField(source='calculate_target_calories')

    class Meta:
        model = UserProfile
        fields = [
            'username', 'email', 'age', 'gender', 'height', 'weight',
            'activity_level', 'goal', 'bmi', 'bmr', 'tdee', 'target_calories',
        ]

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user