from rest_framework import serializers
from django.db import transaction
from .models import (
    FoodItem, Meal, MealIngredient, DailyMealLog,
    Exercise, WorkoutSplit, WorkoutDay, WorkoutExercise,
    WorkoutLog, WorkoutLogSet, WaterLog, SleepLog
)


# ==========================================
# FOOD & NUTRITION SERIALIZERS
# ==========================================

class FoodItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodItem
        fields = ['id', 'name', 'calories', 'protein', 'carbs', 'fat', 'fiber', 'serving_unit', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_name(self, value):
        user = self.context['request'].user
        clean_name = value.strip()
        qs = FoodItem.objects.filter(user=user, name__iexact=clean_name)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists() or Meal.objects.filter(user=user, name__iexact=clean_name).exists():
            raise serializers.ValidationError(f"An ingredient or meal named '{clean_name}' already exists.")
        return clean_name


class MealIngredientSerializer(serializers.ModelSerializer):
    food_item_details = FoodItemSerializer(source='food_item', read_only=True)

    class Meta:
        model = MealIngredient
        fields = ['id', 'meal', 'food_item', 'food_item_details', 'amount_grams']
        read_only_fields = ['id']
        extra_kwargs = {'meal': {'required': False}}


class MealSerializer(serializers.ModelSerializer):
    ingredients = MealIngredientSerializer(many=True, read_only=True)

    class Meta:
        model = Meal
        fields = ['id', 'name', 'calories', 'protein', 'carbs', 'fat', 'fiber', 'ingredients', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_name(self, value):
        user = self.context['request'].user
        clean_name = value.strip()
        qs = Meal.objects.filter(user=user, name__iexact=clean_name)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists() or FoodItem.objects.filter(user=user, name__iexact=clean_name).exists():
            raise serializers.ValidationError(f"An ingredient or meal named '{clean_name}' already exists.")
        return clean_name


class DailyMealLogSerializer(serializers.ModelSerializer):
    meal_details = MealSerializer(source='meal', read_only=True)
    meal_name = serializers.CharField(source='meal.name', read_only=True)

    total_calories = serializers.SerializerMethodField()
    total_protein = serializers.SerializerMethodField()
    total_carbs = serializers.SerializerMethodField()
    total_fat = serializers.SerializerMethodField()
    total_fiber = serializers.SerializerMethodField()

    class Meta:
        model = DailyMealLog
        fields = [
            'id', 'meal', 'meal_details', 'meal_name', 'servings',
            'date', 'total_calories', 'total_protein', 'total_carbs',
            'total_fat', 'total_fiber', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_total_calories(self, obj):
        return round(obj.meal.calories * obj.servings, 2)

    def get_total_protein(self, obj):
        return round(obj.meal.protein * obj.servings, 2)

    def get_total_carbs(self, obj):
        return round(obj.meal.carbs * obj.servings, 2)

    def get_total_fat(self, obj):
        return round(obj.meal.fat * obj.servings, 2)

    def get_total_fiber(self, obj):
        return round(obj.meal.fiber * obj.servings, 2)


# ==========================================
# EXERCISE & WORKOUT SERIALIZERS
# ==========================================

class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ['id', 'name', 'category', 'description']


class WorkoutExerciseSerializer(serializers.ModelSerializer):
    exercise_detail = ExerciseSerializer(source='exercise', read_only=True)

    class Meta:
        model = WorkoutExercise
        fields = ['id', 'workout_day', 'exercise', 'exercise_detail', 'set_number', 'target_reps', 'order']


class WorkoutDaySerializer(serializers.ModelSerializer):
    planned_exercises = WorkoutExerciseSerializer(many=True, read_only=True)

    class Meta:
        model = WorkoutDay
        fields = ['id', 'day_number', 'title', 'is_rest_day', 'planned_exercises']


class WorkoutSplitSerializer(serializers.ModelSerializer):
    days = WorkoutDaySerializer(many=True, read_only=True)

    class Meta:
        model = WorkoutSplit
        fields = ['id', 'name', 'is_active', 'created_at', 'days']
        read_only_fields = ['id', 'created_at']

    def validate_name(self, value):
        user = self.context['request'].user
        clean_name = value.strip()
        qs = WorkoutSplit.objects.filter(user=user, name__iexact=clean_name)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(f"You already have a split named '{clean_name}'.")
        return clean_name

    @transaction.atomic
    def create(self, validated_data):
        user = self.context['request'].user
        if validated_data.get('is_active', False):
            WorkoutSplit.objects.filter(user=user, is_active=True).update(is_active=False)

        split = WorkoutSplit.objects.create(user=user, **validated_data)

        default_days = [
            (1, "Day 1 - Push"), (2, "Day 2 - Pull"), (3, "Day 3 - Legs"),
            (4, "Day 4 - Rest"), (5, "Day 5 - Upper"), (6, "Day 6 - Lower"),
            (7, "Day 7 - Rest")
        ]
        for day_num, title in default_days:
            WorkoutDay.objects.create(
                split=split,
                day_number=day_num,
                title=title,
                is_rest_day=("Rest" in title)
            )
        return split


class WorkoutLogSetSerializer(serializers.ModelSerializer):
    exercise_name = serializers.CharField(source='workout_exercise.exercise.name', read_only=True)
    exercise_category = serializers.CharField(source='workout_exercise.exercise.category', read_only=True)

    class Meta:
        model = WorkoutLogSet
        fields = ['id', 'workout_exercise', 'exercise_name', 'exercise_category', 'actual_reps', 'actual_weight', 'completed']


class WorkoutLogSerializer(serializers.ModelSerializer):
    logged_sets = WorkoutLogSetSerializer(many=True, required=False)

    class Meta:
        model = WorkoutLog
        fields = ['id', 'workout_day', 'workout_split', 'date', 'completed_at', 'notes', 'logged_sets']
        read_only_fields = ['id', 'completed_at']

    @transaction.atomic
    def create(self, validated_data):
        user = self.context['request'].user
        sets_data = validated_data.pop('logged_sets', [])

        workout_day = validated_data.get('workout_day')
        if workout_day and 'workout_split' not in validated_data:
            validated_data['workout_split'] = workout_day.split

        log_date = validated_data.get('date')

        workout_log, created = WorkoutLog.objects.update_or_create(
            user=user,
            workout_day=workout_day,
            date=log_date,
            defaults=validated_data
        )

        if not created:
            workout_log.logged_sets.all().delete()

        for set_data in sets_data:
            WorkoutLogSet.objects.create(workout_log=workout_log, **set_data)

        return workout_log


# ==========================================
# WATER & SLEEP LOG SERIALIZERS
# ==========================================
from rest_framework import serializers
from .models import WaterLog

class WaterLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WaterLog
        fields = ['id', 'user', 'date', 'amount_ml']
        read_only_fields = ['id', 'user']
        # Clear automatic unique validation checks on date
        extra_kwargs = {
            'date': {'validators': []}
        }

from rest_framework import serializers
from .models import SleepLog

class SleepLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SleepLog
        fields = ['id', 'user', 'date', 'hours', 'quality']
        read_only_fields = ['id', 'user']
        extra_kwargs = {
            'date': {'validators': []}
        }