from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FoodItemViewSet, MealViewSet, DailyMealLogViewSet,
    ExerciseViewSet, WorkoutSplitViewSet, WorkoutDayViewSet,
    WorkoutExerciseViewSet, WorkoutLogViewSet,
    WaterLogViewSet, SleepLogViewSet
)

router = DefaultRouter()
router.register(r'foods', FoodItemViewSet, basename='food-item')
router.register(r'meals', MealViewSet, basename='meal')
router.register(r'daily-meal-logs', DailyMealLogViewSet, basename='daily-meal-log')
router.register(r'exercises', ExerciseViewSet, basename='exercise')
router.register(r'workout-splits', WorkoutSplitViewSet, basename='workout-split')
router.register(r'workout-days', WorkoutDayViewSet, basename='workout-day')
router.register(r'planned-exercises', WorkoutExerciseViewSet, basename='planned-exercise')
router.register(r'workout-logs', WorkoutLogViewSet, basename='workout-log')
router.register(r'water-logs', WaterLogViewSet, basename='water-log')
router.register(r'sleep-logs', SleepLogViewSet, basename='sleep-log')

urlpatterns = [
    path('', include(router.urls)),
]