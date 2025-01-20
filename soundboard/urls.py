from . import views
from django.urls import path

urlpatterns = [
    path('soundboard/', 
        views.SoundboardView.as_view(), name='soundboard'),
        
]
