from . import views
from django.urls import path

urlpatterns = [
    path('', 
        views.HomePage.as_view(), name='home'),
    path('soundboard/', 
        views.SoundboardView.as_view(), name='soundboard'),
        
]
