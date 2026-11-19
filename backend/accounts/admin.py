from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'age', 'gender', 'height', 'weight', 'goal', 'activity_level')
    list_filter = ('gender', 'goal')
    search_fields = ('user__username', 'user__email')