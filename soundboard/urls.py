from . import views
from django.urls import path

urlpatterns = [
    path('soundboard/', 
        views.SoundboardView.as_view(), name='soundboard'),
    path('save_soundboard/', 
        views.save_soundboard, name='save_soundboard'),
    path('get_audio_files/',
        views.get_audio_files, name='get_audio_files'),
]
