from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction

from .models import (
    FoodItem, Meal, MealIngredient, DailyMealLog,
    Exercise, WorkoutSplit, WorkoutDay, WorkoutExercise,
    WorkoutLog, WaterLog, SleepLog
)
from .serializers import (
    FoodItemSerializer, MealSerializer, MealIngredientSerializer, DailyMealLogSerializer,
    ExerciseSerializer, WorkoutSplitSerializer, WorkoutDaySerializer,
    WorkoutExerciseSerializer, WorkoutLogSerializer,
    WaterLogSerializer, SleepLogSerializer
)


class FoodItemViewSet(viewsets.ModelViewSet):
    serializer_class = FoodItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return FoodItem.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MealViewSet(viewsets.ModelViewSet):
    serializer_class = MealSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Meal.objects.filter(user=self.request.user).prefetch_related('ingredients__food_item')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='add-ingredient')
    def add_ingredient(self, request, pk=None):
        meal = self.get_object()
        food_item_id = request.data.get('food_item')
        amount_grams = request.data.get('amount_grams', 100.0)

        if not food_item_id:
            return Response({"error": "food_item field is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            food_item = FoodItem.objects.get(id=food_item_id, user=request.user)
        except FoodItem.DoesNotExist:
            return Response({"error": "Food item not found."}, status=status.HTTP_404_NOT_FOUND)

        MealIngredient.objects.update_or_create(
            meal=meal,
            food_item=food_item,
            defaults={'amount_grams': float(amount_grams)}
        )

        return Response(MealSerializer(meal, context={'request': request}).data, status=status.HTTP_200_OK)


class DailyMealLogViewSet(viewsets.ModelViewSet):
    serializer_class = DailyMealLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = DailyMealLog.objects.filter(user=self.request.user).select_related('meal')
        date_param = self.request.query_params.get('date')
        if date_param:
            queryset = queryset.filter(date=date_param)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ExerciseViewSet(viewsets.ModelViewSet):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class WorkoutSplitViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutSplitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutSplit.objects.filter(user=self.request.user).prefetch_related(
            'days__planned_exercises__exercise'
        )

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        split = self.get_object()
        with transaction.atomic():
            WorkoutSplit.objects.filter(user=request.user, is_active=True).update(is_active=False)
            split.is_active = True
            split.save()
        return Response({'status': f"Split '{split.name}' is now active."}, status=status.HTTP_200_OK)


class WorkoutDayViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutDaySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutDay.objects.filter(split__user=self.request.user).prefetch_related(
            'planned_exercises__exercise'
        )


class WorkoutExerciseViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutExercise.objects.filter(workout_day__split__user=self.request.user).select_related('exercise')


class WorkoutLogViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = WorkoutLog.objects.filter(user=self.request.user).prefetch_related(
            'logged_sets__workout_exercise__exercise'
        )
        date_param = self.request.query_params.get('date')
        day_param = self.request.query_params.get('workout_day')
        if date_param:
            queryset = queryset.filter(date=date_param)
        if day_param:
            queryset = queryset.filter(workout_day_id=day_param)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class WaterLogViewSet(viewsets.ModelViewSet):
    serializer_class = WaterLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = WaterLog.objects.filter(user=self.request.user)
        date_param = self.request.query_params.get('date', None)
        if date_param and date_param != 'all':
            queryset = queryset.filter(date=date_param)
        return queryset

    def create(self, request, *args, **kwargs):
        date = request.data.get('date')
        try:
            amount_ml = int(request.data.get('amount_ml', 0))
        except (ValueError, TypeError):
            return Response({"error": "Invalid amount."}, status=status.HTTP_400_BAD_REQUEST)

        if not date or amount_ml <= 0:
            return Response(
                {"error": "Valid date and amount_ml are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get existing log for this date or prepare a new one
        water_log, created = WaterLog.objects.get_or_create(
            user=request.user,
            date=date,
            defaults={'amount_ml': amount_ml}
        )

        if not created:
            # Add to the existing intake amount
            water_log.amount_ml += amount_ml
            water_log.save()

        serializer = self.get_serializer(water_log)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import SleepLog
from .serializers import SleepLogSerializer

class SleepLogViewSet(viewsets.ModelViewSet):
    serializer_class = SleepLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = SleepLog.objects.filter(user=self.request.user)
        date_param = self.request.query_params.get('date', None)
        if date_param and date_param != 'all':
            queryset = queryset.filter(date=date_param)
        return queryset

    def create(self, request, *args, **kwargs):
        date = request.data.get('date')
        hours = request.data.get('hours')
        quality = request.data.get('quality', 3)

        if not date or hours is None:
            return Response(
                {"error": "Date and hours are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            hours_val = float(hours)
            quality_val = int(quality)
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid numeric values for hours or quality."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not (0.0 <= hours_val <= 24.0) or not (1 <= quality_val <= 5):
            return Response(
                {"error": "Hours must be 0-24 and quality must be 1-5."},
                status=status.HTTP_400_BAD_REQUEST
            )

        sleep_log, created = SleepLog.objects.update_or_create(
            user=request.user,
            date=date,
            defaults={'hours': hours_val, 'quality': quality_val}
        )

        serializer = self.get_serializer(sleep_log)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )