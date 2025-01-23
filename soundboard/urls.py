from . import views
from django.urls import path

urlpatterns = [
    path('', 
        views.HomePage.as_view(), name='home'),
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
    path('update_soundboard/<int:soundboard_id>/',
        views.update_soundboard, name='update_soundboard'),
    path('delete_soundboard/<int:soundboard_id>/',
        views.delete_soundboard, name='delete_soundboard'),
    path('soundboard/<int:soundboard_id>/',
        views.soundboard_view, name='soundboard_view'),

    
]
