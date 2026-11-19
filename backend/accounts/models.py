from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]

    ACTIVITY_CHOICES = [
        (1.2, 'Sedentary'),
        (1.375, 'Lightly Active'),
        (1.55, 'Moderately Active'),
        (1.725, 'Very Active'),
        (1.9, 'Extra Active'),
    ]

    GOAL_CHOICES = [
        ('LOSE', 'Weight Loss'),
        ('MAINTAIN', 'Maintenance'),
        ('GAIN', 'Muscle Gain'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    age = models.PositiveIntegerField(default=25)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, default='M')
    height = models.FloatField(help_text="Height in centimeters", default=175.0)
    weight = models.FloatField(help_text="Weight in kilograms", default=70.0)
    activity_level = models.FloatField(choices=ACTIVITY_CHOICES, default=1.2)
    goal = models.CharField(max_length=10, choices=GOAL_CHOICES, default='MAINTAIN')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def calculate_bmi(self):
        height_m = self.height / 100
        if height_m > 0:
            return round(self.weight / (height_m ** 2), 2)
        return 0.0

    def calculate_bmr(self):
        # Mifflin-St Jeor Equation
        if self.gender == 'M':
            return (10 * self.weight) + (6.25 * self.height) - (5 * self.age) + 5
        else:
            return (10 * self.weight) + (6.25 * self.height) - (5 * self.age) - 161

    def calculate_tdee(self):
        return round(self.calculate_bmr() * self.activity_level, 2)

    def calculate_target_calories(self):
        tdee = self.calculate_tdee()
        if self.goal == 'LOSE':
            return round(tdee - 500, 2)
        elif self.goal == 'GAIN':
            return round(tdee + 400, 2)
        return round(tdee, 2)

    def __str__(self):
        return f"{self.user.username}'s Profile"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()