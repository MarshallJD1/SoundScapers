from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic import TemplateView
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Soundboard, Track
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
import logging

logger = logging.getLogger(__name__)

@method_decorator(login_required, name='dispatch')
class HomePage(TemplateView):
    """
    Displays home page
    """
    template_name = 'index.html'


    
    def get_context_data(self, **kwargs,):
        context = super().get_context_data(**kwargs)
        soundboards = Soundboard.objects.filter(user=self.request.user)
        logger.debug(f"fetched soundboards for user {self.request.user}: {soundboards}")
        context['soundboards'] = soundboards
        return context



   



class SoundboardView(TemplateView):
    """
    Displays soundboard
    """
    template_name = "soundboard_index.html"

    


def soundboard_view(request, soundboard_id):
    if 'from_view_button' in request.GET:
        return redirect(f'/soundboard/?soundboard_id={soundboard_id}')
    soundboard = get_object_or_404(Soundboard, id=soundboard_id, user=request.user)
    return render(request, 'soundboard_index.html', {'soundboard_id': soundboard.id, 'soundboard_title': soundboard.title})

def save_tracks(soundboard, tracks_data):
    """
    Helper function to save tracks for a given soundboard.
    """
    soundboard.tracks.all().delete()  # Clear existing tracks
    for track_data in tracks_data:
        Track.objects.create(
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

@csrf_exempt
@login_required
def save_soundboard(request):
    if request.method == "POST":
        data = json.loads(request.body)

        # Create a new soundboard
        soundboard = Soundboard.objects.create(
            id=data.get('soundboard_id'),
            title=data.get['title'],
            description=data.get['description'],
            privacy=data.get['privacy'],
            user=request.user
        )

        # Save associated tracks
        save_tracks(soundboard, data['tracks'])

        return JsonResponse({'status': 'success', 'soundboard_id': soundboard.id})
    
    return JsonResponse({'status': 'error'}, status=400)


@csrf_exempt
def load_soundboard(request, soundboard_id):
    try:
        soundboard = get_object_or_404(Soundboard, id=soundboard_id)
        tracks = Track.objects.filter(soundboard=soundboard)

        soundboard_data = {
            'id': soundboard.id,
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
    except Exception as e:
        logger.error(f"Error loading soundboard: {e}")
        return JsonResponse({'error': 'Error loading soundboard'}, status=500)


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



@csrf_exempt
@login_required
def update_soundboard(request, soundboard_id):
    if request.method == "POST":
        data = json.loads(request.body)

        # Get the soundboard to update (ensures it belongs to the current user)
        soundboard = get_object_or_404(Soundboard, id=soundboard_id, user=request.user)

        # Update soundboard fields
        soundboard.title = data.get('title', soundboard.title)
        soundboard.description = data.get('description', soundboard.description)
        soundboard.privacy = data.get('privacy', soundboard.privacy)
        soundboard.save()

        # Update associated tracks
        save_tracks(soundboard, data['tracks'])

        return JsonResponse({'status': 'success', 'soundboard_id': soundboard.id})
    
    return JsonResponse({'status': 'error'}, status=400)


@csrf_exempt
@login_required
def delete_soundboard(request, soundboard_id):
    if request.method == "DELETE":
        soundboard = get_object_or_404(Soundboard, id=soundboard_id, user=request.user)
        soundboard.delete()
        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error'}, status=400)