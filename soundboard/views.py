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
        try:
            # Parse the JSON data from the request body
            data = json.loads(request.body)
            
            # Extract soundboard data
            title = data.get("title", "Untitled soundboard")
            description = data.get("description", "")
            privacy = data.get("privacy", "private")  # Default to private
            
            # Validate required fields
            if not title:
                return JsonResponse({"error": "Title is required"}, status=400)
            
            # Create the Soundboard
            soundboard = Soundboard.objects.create(
                user=request.user,
                title=title,
                description=description,
                privacy=privacy
            )
            
            # Extract track data
            tracks = data.get("tracks", [])
            for track_data in tracks:
                # Create Track objects linked to the soundboard
                Track.objects.create(
                    soundboard=soundboard,
                    name=track_data.get("name", "Unnamed Track"),
                    file_url=track_data["file_url"],  # Required field
                    volume=track_data.get("volume", 1.0),
                    pan=track_data.get("pan", 0.0),
                    loop_start=track_data.get("loop_start", 0.0),
                    loop_end=track_data.get("loop_end"),
                    loop=track_data.get("loop", False),
                    active=track_data.get("active", True),
                    reversed=track_data.get("reversed", False),
                    pitch=track_data.get("pitch", 1.0),
                    solo=track_data.get("solo", False),
                    mute=track_data.get("mute", False)
                )
            
            # Return success response
            return JsonResponse({"message": "Soundboard saved successfully", "soundboard_id": soundboard.id}, status=201)
        
        except KeyError as e:
            return JsonResponse({"error": f"Missing key: {str(e)}"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    
    # If not POST request, return method not allowed
    return JsonResponse({"error": "Invalid request method"}, status=405)


def load_soundboard(request, soundboard_id):
    soundboard = Soundboard.objects.get(id=soundboard_id)
    tracks = soundboard.tracks.all()

    response_data = {
        "title": soundboard.title,
        "description": soundboard.description,
        "privacy": soundboard.privacy,
        "tracks:": [
            {
                "audio_file_id" : track.audio_file.id,
                "audio_file_name" : track.audio_file.name,
                "file_url": track.audio_file.file_url,
                "volume": track.volume,
                "pan": track.pan,
                "loop_start": track.loop_start,
                "loop_end": track.loop_end,
                "loop": track.loop,
                "active": track.active,
                "reversed": track.reversed,
            }
            for track in tracks
        ]
    }
    return JsonResponse(response_data)

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