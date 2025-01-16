from django.db import models
from django.contrib.auth.models import User

# Create your models here.
# Soundboard model
class Soundboard(models.Model):
    PRIVACY_CHOICES = [
        ('public', 'Public'),
        ('private', 'Private'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='soundboards')  # Owner of the soundboard
    title = models.CharField(max_length=255)  # Title of the soundboard
    description = models.TextField(blank=True, null=True)  # Optional description
    created_at = models.DateTimeField(auto_now_add=True)  # Timestamp for when the soundboard is created
    updated_at = models.DateTimeField(auto_now=True)  # Timestamp for when the soundboard is last updated
    privacy = models.CharField(max_length=7, choices=PRIVACY_CHOICES, default='private')  # Public or private

    def __str__(self):
        return self.title

# Track model
class Track(models.Model):
    soundboard = models.ForeignKey(Soundboard, on_delete=models.CASCADE, related_name="tracks")
    name = models.CharField(max_length=100, default="Unnamed Track")
    file_url = models.URLField()  # URL for the audio file
    volume = models.FloatField(default=1.0)  # Range: 0.0 (silent) to 1.0 (full volume)
    pan = models.FloatField(default=0.0)  # Range: -1.0 (left) to 1.0 (right)
    loop_start = models.FloatField(default=0.0)  # Start of the loop in seconds
    loop_end = models.FloatField(null=True, blank=True)  # End of the loop in seconds
    loop = models.BooleanField(default=False)  # Whether the track is looping
    active = models.BooleanField(default=True)  # Whether the track is active
    reversed = models.BooleanField(default=False)  # Whether the track plays in reverse
    pitch = models.FloatField(default=1.0)  # Pitch adjustment (1.0 = normal)
    solo = models.BooleanField(default=False)  # Whether the track is solo
    mute = models.BooleanField(default=False)  # Whether the track is muted

    def __str__(self):
        return f"Track: {self.name} (Soundboard: {self.soundboard.title})"

