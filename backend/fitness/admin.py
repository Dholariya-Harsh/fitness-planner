from django.contrib import admin
from .models import (
    FoodItem, Meal, MealIngredient, DailyMealLog,
    Exercise, WorkoutSplit, WorkoutDay, WorkoutExercise,
    WorkoutLog, WorkoutLogSet, WaterLog, SleepLog
)


class MealIngredientInline(admin.TabularInline):
    model = MealIngredient
    extra = 1


class WorkoutDayInline(admin.TabularInline):
    model = WorkoutDay
    extra = 0
    max_num = 7


class WorkoutExerciseInline(admin.TabularInline):
    model = WorkoutExercise
    extra = 1


class WorkoutLogSetInline(admin.TabularInline):
    model = WorkoutLogSet
    extra = 0


@admin.register(FoodItem)
class FoodItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'calories', 'protein', 'carbs', 'fat', 'fiber')
    search_fields = ('name', 'user__username')


@admin.register(Meal)
class MealAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'calories', 'protein', 'carbs', 'fat', 'fiber')
    search_fields = ('name', 'user__username')
    inlines = [MealIngredientInline]


@admin.register(DailyMealLog)
class DailyMealLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'meal', 'servings', 'date', 'created_at')
    list_filter = ('date',)
    search_fields = ('user__username', 'meal__name')


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ('name', 'category')
    list_filter = ('category',)
    search_fields = ('name',)


@admin.register(WorkoutSplit)
class WorkoutSplitAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'is_active', 'created_at')
    list_filter = ('is_active',)
    inlines = [WorkoutDayInline]


@admin.register(WorkoutDay)
class WorkoutDayAdmin(admin.ModelAdmin):
    list_display = ('title', 'split', 'day_number', 'is_rest_day')
    inlines = [WorkoutExerciseInline]


@admin.register(WorkoutLog)
class WorkoutLogAdmin(admin.ModelAdmin):
    list_display = ('date', 'user', 'workout_day')
    inlines = [WorkoutLogSetInline]


@admin.register(WaterLog)
class WaterLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'amount_ml')


@admin.register(SleepLog)
class SleepLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'hours', 'quality')