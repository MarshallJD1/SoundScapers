from . import views
from django.urls import path

urlpatterns = [
    path('soundboard/', 
        views.SoundboardView.as_view(), name='soundboard'),
    path('save_soundboard/', 
        views.save_soundboard, name='save_soundboard'),
    path('get_audio_files/',
        views.get_audio_files, name='get_audio_files'),
    path('get_soundboards/', 
        views.get_user_soundboards, name='get_soundboards'),
    path('load_soundboard/<int:soundboard_id>/',
        views.load_soundboard, name='load_soundboard'),

    
]
