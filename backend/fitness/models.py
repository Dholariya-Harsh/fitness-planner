from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator


# ==========================================
# FOOD & NUTRITION SYSTEM
# ==========================================

class FoodItem(models.Model):
    """Base single food ingredient (Stores values per 1 gram / 1 ml standard)."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='food_items')
    name = models.CharField(max_length=255)
    calories = models.FloatField(default=0.0, help_text="Calories per gram")
    protein = models.FloatField(default=0.0, help_text="Protein in grams per gram")
    carbs = models.FloatField(default=0.0, help_text="Carbohydrates in grams per gram")
    fat = models.FloatField(default=0.0, help_text="Fat in grams per gram")
    fiber = models.FloatField(default=0.0, help_text="Fiber in grams per gram")
    serving_unit = models.CharField(max_length=50, default='g')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(fields=['user', 'name'], name='unique_user_food_item_name')
        ]

    def clean(self):
        super().clean()
        clean_name = self.name.strip() if self.name else ""
        user = getattr(self, 'user', None)
        if user and Meal.objects.filter(user=user, name__iexact=clean_name).exists():
            raise ValidationError("A meal with this name already exists.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.user.username})"


class Meal(models.Model):
    """Composite recipe meal built from referenced FoodItems or direct macro definitions."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='meals')
    name = models.CharField(max_length=255)
    calories = models.FloatField(default=0.0)
    protein = models.FloatField(default=0.0)
    carbs = models.FloatField(default=0.0)
    fat = models.FloatField(default=0.0)
    fiber = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(fields=['user', 'name'], name='unique_user_meal_name')
        ]

    def recalculate_macros(self):
        """Helper to calculate total macros from linked MealIngredients."""
        ingredients = self.ingredients.select_related('food_item').all()
        if ingredients.exists():
            self.calories = sum(ing.amount_grams * ing.food_item.calories for ing in ingredients)
            self.protein = sum(ing.amount_grams * ing.food_item.protein for ing in ingredients)
            self.carbs = sum(ing.amount_grams * ing.food_item.carbs for ing in ingredients)
            self.fat = sum(ing.amount_grams * ing.food_item.fat for ing in ingredients)
            self.fiber = sum(ing.amount_grams * ing.food_item.fiber for ing in ingredients)

    def clean(self):
        super().clean()
        if self.name:
            clean_name = self.name.strip()
            user = getattr(self, 'user', None)
            if user and FoodItem.objects.filter(user=user, name__iexact=clean_name).exists():
                raise ValidationError({"name": f"An ingredient named '{clean_name}' already exists in your library."})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.user.username})"


class MealIngredient(models.Model):
    """Intermediate link defining ingredient quantity in a composite Meal."""
    meal = models.ForeignKey(Meal, on_delete=models.CASCADE, related_name='ingredients')
    food_item = models.ForeignKey(FoodItem, on_delete=models.CASCADE)
    amount_grams = models.FloatField(default=100.0)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Automatically update parent meal total macros when ingredients are added or updated
        self.meal.recalculate_macros()
        self.meal.save()

    def __str__(self):
        return f"{self.amount_grams}g of {self.food_item.name} in {self.meal.name}"


class DailyMealLog(models.Model):
    """Tracks saved meals logged by a user on a specific date (allows repeating entries)."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_meal_logs')
    meal = models.ForeignKey(Meal, on_delete=models.CASCADE, related_name='logged_instances')
    servings = models.FloatField(default=1.0, validators=[MinValueValidator(0.1)])
    date = models.DateField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.meal.name} x{self.servings} on {self.date}"


# ==========================================
# EXERCISE LIBRARY
# ==========================================

class Exercise(models.Model):
    CATEGORY_CHOICES = [
        ('CHEST', 'Chest'),
        ('BACK', 'Back'),
        ('LEGS', 'Legs'),
        ('SHOULDERS', 'Shoulders'),
        ('ARMS', 'Arms'),
        ('CORE', 'Core'),
        ('CARDIO', 'Cardio'),
    ]

    name = models.CharField(max_length=150, unique=True, db_index=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, db_index=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


# ==========================================
# WORKOUT SPLIT SYSTEM (TEMPLATE)
# ==========================================

class WorkoutSplit(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workout_splits')
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'name'],
                name='unique_user_split_name'
            ),
            models.UniqueConstraint(
                fields=['user'],
                condition=models.Q(is_active=True),
                name='unique_active_split_per_user'
            )
        ]

    def clean(self):
        super().clean()
        if self.is_active:
            qs = WorkoutSplit.objects.filter(user=self.user, is_active=True)
            if self.pk:
                qs = qs.exclude(pk=self.pk)
            if qs.exists():
                raise ValidationError({"is_active": "Only one workout split can be active at a time."})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.user.username} {'(Active)' if self.is_active else ''}"


class WorkoutDay(models.Model):
    split = models.ForeignKey(WorkoutSplit, on_delete=models.CASCADE, related_name='days')
    day_number = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(7)]
    )
    title = models.CharField(max_length=255)
    is_rest_day = models.BooleanField(default=False)

    class Meta:
        ordering = ['day_number']
        constraints = [
            models.UniqueConstraint(
                fields=['split', 'day_number'],
                name='unique_day_number_per_split'
            )
        ]

    def clean(self):
        super().clean()
        if not (1 <= self.day_number <= 7):
            raise ValidationError({'day_number': 'Day number must be between 1 and 7.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Day {self.day_number}: {self.title} ({self.split.name})"


class WorkoutExercise(models.Model):
    """Planned set details attached to a WorkoutDay."""
    workout_day = models.ForeignKey(WorkoutDay, on_delete=models.CASCADE, related_name='planned_exercises')
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name='planned_instances')
    set_number = models.PositiveSmallIntegerField(default=1)
    target_reps = models.PositiveIntegerField(default=10)
    order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['order', 'set_number']

    def __str__(self):
        return f"{self.workout_day.title} | {self.exercise.name} - Set {self.set_number} (Target: {self.target_reps})"


# ==========================================
# WORKOUT LOG SYSTEM (PERFORMANCE)
# ==========================================

class WorkoutLog(models.Model):
    """Logged workout instance performed on a specific date."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workout_logs')
    workout_day = models.ForeignKey(WorkoutDay, on_delete=models.SET_NULL, null=True, related_name='executed_logs')
    workout_split = models.ForeignKey(WorkoutSplit, on_delete=models.SET_NULL, null=True, related_name='executed_logs')
    date = models.DateField(db_index=True)
    completed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-date', '-completed_at']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'workout_day', 'date'],
                name='unique_user_workout_day_per_date'
            )
        ]

    def __str__(self):
        day_title = self.workout_day.title if self.workout_day else 'Custom'
        return f"Log {self.date} - {day_title} ({self.user.username})"


class WorkoutLogSet(models.Model):
    """Actual weights and reps executed per set."""
    workout_log = models.ForeignKey(WorkoutLog, on_delete=models.CASCADE, related_name='logged_sets')
    workout_exercise = models.ForeignKey(WorkoutExercise, on_delete=models.SET_NULL, null=True, related_name='logged_performances')
    actual_reps = models.PositiveIntegerField(default=0)
    actual_weight = models.FloatField(default=0.0)
    completed = models.BooleanField(default=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        ex_name = self.workout_exercise.exercise.name if self.workout_exercise else 'Exercise'
        return f"{ex_name}: {self.actual_weight}kg x {self.actual_reps} reps"


# ==========================================
# WATER & SLEEP LOGS
# ==========================================

class WaterLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='water_logs')
    date = models.DateField(db_index=True)
    amount_ml = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-date']
        
    def __str__(self):
        return f"{self.user.username} - {self.date}: {self.amount_ml}ml"


class SleepLog(models.Model):
    """Simplified sleep tracking model directly taking total hours."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sleep_logs')
    date = models.DateField(db_index=True)
    hours = models.FloatField(validators=[MinValueValidator(0.0), MaxValueValidator(24.0)])
    quality = models.PositiveSmallIntegerField(
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating 1-5"
    )

    class Meta:
        ordering = ['-date']
        constraints = [
            models.UniqueConstraint(fields=['user', 'date'], name='unique_sleep_log_per_user_date')
        ]

    def __str__(self):
        return f"{self.user.username} - {self.date}: {self.hours} hrs (Quality: {self.quality}/5)"