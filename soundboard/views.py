from django.shortcuts import render
from django.views.generic import TemplateView
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Soundboard, Track
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt


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


@csrf_exempt
@login_required
def save_soundboard(request):
    if request.method == "POST":
        data = json.loads(request.body)
        soundboard = Soundboard(
            title=data['title'],
            description=data['description'],
            privacy=data['privacy'],
            user=request.user  # Set the user field to the current user
        )
        soundboard.save()

        # Save tracks
        for track_data in data['tracks']:
            track = Track(
                soundboard=soundboard,
                file_url=track_data['file_url'],
                loop=track_data['loop'],
                volume=track_data['volume'],
                pan=track_data['pan'],
                loop_start=track_data['loop_start'],
                loop_end=track_data['loop_end'],
                active=track_data['active'],
                reversed=track_data['reversed'],
                pitch=track_data['pitch'],
                solo=track_data['solo'],
                mute=track_data['mute']
            )
            track.save()

        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error'}, status=400)


def load_soundboard(request, soundboard_id):
    soundboard = get_object_or_404(Soundboard, id=soundboard_id)
    tracks = Track.objects.filter(soundboard=soundboard)

    soundboard_data = {
        'title': soundboard.title,
        'description': soundboard.description,
        'privacy': soundboard.privacy,
        'tracks': [
            {
                'name': track.name,
                'file_url': track.file_url,
                'volume': track.volume,
                'pan': track.pan,
                'loop_start': track.loop_start,
                'loop_end': track.loop_end,
                'loop': track.loop,
                'active': track.active,
                'reversed': track.reversed,
                'pitch': track.pitch,
                'solo': track.solo,
                'mute': track.mute,
            }
            for track in tracks
        ]
    }

    return JsonResponse(soundboard_data)

@login_required
def get_user_soundboards(request):
    user_soundboards = Soundboard.objects.filter(user=request.user).values('id', 'title', 'description', 'privacy')
    return JsonResponse(list(user_soundboards), safe=False)


@csrf_exempt
def get_audio_files(request):
    try:
        audio_dir = os.path.join(settings.STATIC_ROOT, 'audio')
        if not os.path.exists(audio_dir):
            return JsonResponse({"error": "Audio directory not found"}, status=404)
        
        audio_files = [f for f in os.listdir(audio_dir) if f.endswith('.wav')]
        audio_urls = {f: os.path.join(settings.STATIC_URL, 'audio', f) for f in audio_files}
        return JsonResponse(audio_urls)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)