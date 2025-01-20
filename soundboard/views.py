from django.shortcuts import render
from django.views.generic import TemplateView

class HomePage(TemplateView):
    """
    Displays home page
    """
    template_name = 'base.html'

# Create your views here.

class SoundboardView(TemplateView):
    """
    Displays soundboard
    """
    template_name = "soundboard_index.html"