document.addEventListener('DOMContentLoaded', async () => {
    const workspace = document.getElementById('workspace');
    const cards = document.querySelectorAll('.card');
    const statusText = document.getElementById('status-text'); // Status message element
    let soundboardsFetched = false;
    let currentSoundboardId = document.getElementById('soundboard_id').value;
    let tracks = [];

    // Start Tone.js audio context on first user interaction
    function startAudioContextOnInteraction() {
        const startAudioContext = async () => {
            if (!Tone.context.state || Tone.context.state !== 'running') {
                await Tone.start();
                //console.log('Tone.js audio context started');
            }
            document.removeEventListener('click', startAudioContext);
            document.removeEventListener('keydown', startAudioContext);
            document.removeEventListener('touchstart', startAudioContext);
            cards.forEach(card => card.removeEventListener('click', startAudioContext));
        };

        document.addEventListener('click', startAudioContext);
        document.addEventListener('keydown', startAudioContext);
        document.addEventListener('touchstart', startAudioContext);
        cards.forEach(card => card.addEventListener('click', startAudioContext));
    }

    // Call the function to start the audio context on interaction
    startAudioContextOnInteraction();


    // Function to get CSRF token from cookies (required for Django POST requests)
    function getCSRFToken() {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, 10) === 'csrftoken=') {
                    cookieValue = decodeURIComponent(cookie.substring(10));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Check if soundboard_id is present in the URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const soundboardId = urlParams.get('soundboard_id') || currentSoundboardId;
    if (soundboardId) {
        // Make an AJAX call to load the soundboard
        fetch(`/load_soundboard/${soundboardId}/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            }
        })
            .then(response => response.json())
            .then(data => {
                // Update the UI with the loaded soundboard data
                updateUIWithSoundboard(data);
            })
            .catch(error => {
                console.error('Error loading soundboard:', error);
            });
    }



    if (!workspace) {
        console.error("Workspace element not found");
        return;
    }

    cards.forEach(card => {
        // Mouse drag events
        card.addEventListener('dragstart', handleDragStart);

        // Touch drag events
        card.addEventListener('touchstart', handleTouchStart);
    });

    workspace.addEventListener('dragover', handleDragOver); // Mouse
    workspace.addEventListener('drop', handleDrop); // Mouse

    // Touch equivalents for dragover and drop
    workspace.addEventListener('touchmove', handleTouchMove);
    workspace.addEventListener('touchend', handleTouchEnd);

    // Add a start button for Tone.js interaction






    const masterChannel = new Tone.Channel().toDestination(); // Master channel
    const busChannel = new Tone.Channel().connect(masterChannel); // Bus channel for routing

    // Function to handle touch start event
    let draggedAudio = null; // Store the dragged card's audio
    let ghostElement = null; // Visual cue for touch dragging

    function handleTouchStart(e) {
        e.preventDefault(); // Prevent default browser behavior
        const target = e.target.closest('.card'); // Ensure the event targets a card
        if (!target) return;

        // clean up any previous ghost element
        if (ghostElement) {
            ghostElement.remove();
            ghostElement = null;
        }

        // Store the dragged card's audio data
        draggedAudio = target.dataset.audio;
        audioFileName = draggedAudio.split('/').pop().split('.')[0];
        updateStatusMessage(audioFileName);

        // Create a ghost element as a visual cue
        ghostElement = target.cloneNode(true);
        ghostElement.style.position = 'absolute';
        ghostElement.style.pointerEvents = 'none';
        ghostElement.style.opacity = '0.7';
        ghostElement.style.zIndex = '1000';
        document.body.appendChild(ghostElement);

        // Position the ghost element at the touch point
        const touch = e.touches[0];
        ghostElement.style.left = `${touch.clientX}px`;
        ghostElement.style.top = `${touch.clientY}px`;
    }

    // Function to handle touch move event

    function handleTouchMove(e) {
        if (!ghostElement) return;

        e.preventDefault(); // Prevent scrolling while dragging
        const touch = e.touches[0];

        // Move the ghost element with the user's finger
        ghostElement.style.left = `${touch.clientX}px`;
        ghostElement.style.top = `${touch.clientY}px`;

        // Add a visual cue to the workspace
        workspace.classList.add('drag-over');
    }

    // Function to handle touch end event

    async function handleTouchEnd(e) {
        if (!draggedAudio || !ghostElement) return;

        e.preventDefault(); // Prevent default behavior
        workspace.classList.remove('drag-over'); // Remove visual cue

        const touch = e.changedTouches[0];
        const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);

        // Check if the drop target is the workspace
        if (dropTarget === workspace || workspace.contains(dropTarget)) {
            // Simulate drop functionality
            handleDrop({
                preventDefault: () => { }, // Mock preventDefault
                dataTransfer: {
                    getData: () => draggedAudio, // Provide the dragged audio data
                },
            });

            // Update the status message
            updateStatusMessage();
        }

        // Clean up
        ghostElement.remove();
        ghostElement = null;
        draggedAudio = null;
    }

    //update the status text

    function updateStatusMessage(audioFileName = null) {
        if (audioFileName) {
            statusText.innerHTML = `
                You have currently selected <strong>${audioFileName}</strong>.
                Tap the workspace to add the track to the mixer - or <span class="clear-selection">tap here</span> to clear your selection!
            `;
        } else {
            statusText.innerHTML = `
                Tap your choice of audio card and then tap the workspace to add the track! - 
                <span class="clear-selection">Tap here</span> if you need to clear your selection!
            `;
        }
    }




    function handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.audio);
    }

    function handleDragOver(e) {
        e.preventDefault();
        workspace.classList.add('drag-over'); // Optional: Add a visual cue
    }

    async function handleDrop(e) {
        e.preventDefault();
        workspace.classList.remove('drag-over');

        // Start the Tone.js context if it hasn't already started
        if (!Tone.context.state || Tone.context.state !== 'running') {
            await Tone.start();
            //console.log('Tone.js audio context started');
        }

        const audioFile = e.dataTransfer.getData('text/plain');

        // Create mixer if it doesn't exist
        let mixer = document.querySelector('.mixer');
        if (!mixer) {
            mixer = createMixer();
            workspace.appendChild(mixer);
        }

        // Load audio and create track
        const player = new Tone.Player({
            url: audioFile,
            loop: false,
            volume: 0,  // Set initial volume to 0 (normal level)
        });


        const trackChannel = new Tone.Channel().connect(busChannel); // route to bus channel
        player.connect(trackChannel); // Connect the player to the track channel



        const trackElement = createTrackElement(audioFile, player, trackChannel);
        mixer.appendChild(trackElement);

        tracks.push({ player, trackChannel, trackElement });
    }
    // Create the mixer with master controls
    function createMixer() {
        const mixer = document.createElement('div');
        mixer.classList.add('mixer', 'bg-light', 'p-3', 'mb-3', 'rounded', 'row');
        mixer.innerHTML = `
            <h5>Mixer</h5>
            <div class="master-controls bg-dark p-3 rounded mb-2">
                <label>Master Volume</label>
                <input type="range" class="master-volume" min="-20" max="5" step="0.01" value="0.5">
                <label>Master Pan</label>
                <input type="range" class="master-pan" min="-1" max="1" step="0.01" value="0">
                <label>Record Duration (1 - 180 seconds)</label>
                <input type="number" class="record-duration" min="1" max="30" step="1" value="15">
                <button class="btn btn-success play-pause-btn">Play</button>
                <button class="btn btn-danger record-btn">Record</button>
                <div class="recording-notification" style="display: none;">
                <div class="loading-bar">
                    <div class="progress" style="width: 0%;"></div>
                </div>
                <p>Recording...</p>
            </div>
            </div>
        `;

        mixer.querySelector('.master-volume').addEventListener('input', (e) => {
            const masterVolume = parseFloat(e.target.value);
            masterChannel.volume.value = masterVolume;
            //console.log(`Master volume set to: ${masterVolume}`);

            // Update all tracks' effective volume
            tracks.forEach(({ trackChannel, trackElement }) => {
                const volumeSlider = trackElement.querySelector('.volume-slider');
                trackChannel.volume.value = parseFloat(volumeSlider.value) + masterVolume;
            });
        });



        mixer.querySelector('.master-pan').addEventListener('input', (e) => {
            const pan = parseFloat(e.target.value);
            masterChannel.pan.value = pan;
            //console.log(`Master pan set to: ${pan}`);
        });


        const playPauseButton = mixer.querySelector('.play-pause-btn');
        let isPlaying = false;

        playPauseButton.addEventListener('click', () => {
            isPlaying = !isPlaying;
            playPauseButton.textContent = isPlaying ? 'Pause' : 'Play';

            if (isPlaying) {
                const duration = parseFloat(mixer.querySelector('.record-duration').value);
                startMasterTimeline(duration);

                // Start all active tracks
                tracks.forEach(async ({ player, trackElement }) => {
                    const activeCheckbox = trackElement.querySelector('.active-checkbox');
                    if (activeCheckbox.checked) {
                        if (player) {
                            try {
                                const url = trackElement.getAttribute('data-file-url');
                                if (url) {
                                    //console.log(`Loading player with URL: ${url}`);
                                    const buffer = new Tone.Buffer(url, () => {
                                        //console.log('Buffer loaded successfully:', buffer);
                                        player.buffer = buffer;
                                        player.start();
                                    }, (error) => {
                                        console.error('Error loading buffer:', error);
                                    });
                                } else {
                                    console.error('Player URL is undefined for track:', trackElement);
                                }
                            } catch (error) {
                                console.error('Error starting player:', error);
                            }
                        } else {
                            console.error('Player is undefined for track:', trackElement);
                        }
                    }
                });

                Tone.Transport.start(); // Start global transport
            } else {
                // Stop all tracks when master is paused
                tracks.forEach(({ player }) => {
                    if (player) {
                        try {
                            player.stop();
                        } catch (error) {
                            console.error('Error stopping player:', error);
                        }
                    } else {
                        console.error('Player is undefined for track');
                    }
                });

                Tone.Transport.pause(); // Pause global transport
            }
        });

        const recordButton = mixer.querySelector('.record-btn');
        recordButton.addEventListener('click', () => {
            const duration = parseFloat(mixer.querySelector('.record-duration').value);
            startRecording(duration);
        });

        return mixer;
    }

    // Start the master timeline with loop
    function startMasterTimeline(duration) {
        Tone.Transport.loopStart = 0;
        Tone.Transport.loopEnd = duration;
        Tone.Transport.loop = true;
        //console.log(`Master timeline set to loop for ${duration} seconds`);
    }


    // Create the track element
    function createTrackElement(audioFile, player, trackChannel) {
        const trackElement = document.createElement('div');
        trackElement.classList.add('track', 'audio-track', 'bg-secondary', 'p-3', 'mb-2', 'rounded', 'col-4');
        trackElement.dataset.fileUrl = audioFile;

        // extract file name from the url
        const fileName = audioFile.split('/').pop().split('.')[0];

        trackElement.innerHTML = `
        <h6 class="track-name">${fileName}</h6>
        <button class="btn btn-primary btn-sm play-btn">Play</button>
        <button class="btn btn-danger btn-sm stop-btn">Stop</button>
         <div class="loading-indicator" style="display: none;">Loading...</div>

        <label>Active</label>
        <input type="checkbox" class="active-checkbox" checked>

        <label>Volume</label>
        <input type="range" class="volume-slider" min="-48" max="5" step="0.01" value="${trackChannel.volume.value}">
        <label>Panning</label>
        <input type="range" class="pan-slider" min="-1" max="1" step="0.01" value="${trackChannel.pan.value}">
        
        <label>Pitch</label>
        <input type="range" class="pitch-slider" min="0" max="2" step="0.01" value="1.0">
        <label>Reverse</label>
        <input type="checkbox" class="reverse-checkbox">

        <label>Solo</label>
        <input type="checkbox" class="solo-checkbox">

        <label>Mute</label>
        <input type="checkbox" class="mute-checkbox">
        <br>

        <button class="btn btn-info btn-sm lock-unlock-btn">Lock Loop Points</button>
        <label>Loop Start (seconds)</label>
        <input type="number" class="loop-start" min="0" step="0.1" value="0">

        <label>Loop End (seconds)</label>
        <input type="number" class="loop-end" min="0" step="0.1" value="${player.buffer.duration}">

        <label>Loop</label>
        <input type="checkbox" class="loop-checkbox">

        <button class="btn btn-outline-dark btn-sm remove-btn">Remove</button>

        <!-- Waveform Canvas -->
        <canvas class="waveform-canvas" width="400" height="100"></canvas>
        <div class="time-tooltip"></div>    
        `;

        // Initialize the waveform
        const waveformCanvas = trackElement.querySelector('.waveform-canvas');
        const timeTooltip = trackElement.querySelector('.time-tooltip');
        const waveform = new Tone.Waveform(2048);
        player.connect(waveform);

        // Draw the waveform on the canvas
        function drawWaveform() {
            const ctx = waveformCanvas.getContext('2d');
            const width = waveformCanvas.width;
            const height = waveformCanvas.height;
            const waveformData = waveform.getValue();
            ctx.clearRect(0, 0, width, height);
            ctx.beginPath();
            ctx.moveTo(0, height / 2);
            waveformData.forEach((value, index) => {
                const x = (index / waveformData.length) * width;
                const y = (value * height) / 2 + height / 2;
                ctx.lineTo(x, y);
            });
            ctx.stroke();
        }

        drawWaveform();

        // Hover effect to show current time at mouse position
        waveformCanvas.addEventListener('mousemove', (e) => {
            const rect = waveformCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const duration = player.buffer.duration;
            const timeAtX = (x / waveformCanvas.width) * duration;

            // Display the time in the tooltip
            timeTooltip.textContent = `${timeAtX.toFixed(2)}s`;
            timeTooltip.style.left = `${e.pageX + 10}px`;  // Position tooltip just beside the cursor
            timeTooltip.style.top = `${e.pageY + 10}px`;  // Position below the cursor
            timeTooltip.style.display = 'block';  // Ensure the tooltip is visible
        });

        waveformCanvas.addEventListener('mouseleave', () => {
            timeTooltip.style.display = 'none'; // Hide the tooltip when mouse leaves
        });

        // Lock/Unlock button functionality
        let isLocked = false;
        let loopStartSet = false;

        trackElement.querySelector('.lock-unlock-btn').addEventListener('click', () => {
            isLocked = !isLocked; // Toggle lock state
            trackElement.querySelector('.lock-unlock-btn').textContent = isLocked ? 'Unlock Loop Points' : 'Lock Loop Points';
        });

        // Handle click on the waveform to set loop points
        waveformCanvas.addEventListener('click', (e) => {
            if (isLocked) return;  // If locked, do nothing

            const rect = waveformCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const duration = player.buffer.duration;
            const timeAtX = (x / waveformCanvas.width) * duration;

            if (!loopStartSet) {
                // Set loop start time
                trackElement.querySelector('.loop-start').value = timeAtX.toFixed(2);
                loopStartSet = true;
            } else {
                // Set loop end time
                trackElement.querySelector('.loop-end').value = timeAtX.toFixed(2);
                loopStartSet = false;
            }
        });

        // Volume slider functionality
        const volumeSlider = trackElement.querySelector('.volume-slider');
        volumeSlider.addEventListener('input', (e) => {
            const masterVolume = masterChannel.volume.value; // Get current master volume
            const trackVolume = parseFloat(e.target.value); // Track slider value
            trackChannel.volume.value = trackVolume + masterVolume; // Combine volumes
            //console.log(`Track volume set to: ${trackChannel.volume.value}`);
        });

        // Play button functionality
        trackElement.querySelector('.play-btn').addEventListener('click', () => {
            if (player.loaded) {
                // Apply settings
                player.loopStart = parseFloat(trackElement.querySelector('.loop-start').value);
                player.loopEnd = parseFloat(trackElement.querySelector('.loop-end').value);
                player.reverse = trackElement.querySelector('.reverse-checkbox').checked;
                trackChannel.mute = trackElement.querySelector('.mute-checkbox').checked;

                const volume = parseFloat(trackElement.querySelector('.volume-slider').value);
                trackChannel.volume.value = volume;

                // Start playing
                player.start();
            }
            else {
                console.warn('Track is not fully loaded yet.');
            }
        });

        trackElement.querySelector('.active-checkbox').addEventListener('change', (e) => {
            trackChannel.mute = !e.target.checked;
        });

        // Stop button functionality
        trackElement.querySelector('.stop-btn').addEventListener('click', () => {
            if (player.state === 'started') {
                player.stop();
            }
            else {
                console.warn('Track is not playing.');
            }
        });

        // Pan slider functionality
        trackElement.querySelector('.pan-slider').addEventListener('input', (e) => {
            trackChannel.pan.value = e.target.value;
        });

        // Pitch slider functionality
        trackElement.querySelector('.pitch-slider').addEventListener('input', (e) => {
            player.playbackRate = e.target.value;
        });

        // Loop start/end functionality
        trackElement.querySelector('.loop-start').addEventListener('input', (e) => {
            player.loopStart = parseFloat(e.target.value);
        });

        trackElement.querySelector('.loop-end').addEventListener('input', (e) => {
            player.loopEnd = parseFloat(e.target.value);
        });

        trackElement.querySelector('.loop-checkbox').addEventListener('change', (e) => {
            player.loop = e.target.checked;
        });

        // Remove button functionality
        trackElement.querySelector('.remove-btn').addEventListener('click', () => {
            player.stop();
            trackChannel.dispose();
            trackElement.remove();
        });

        const loadingIndicator = trackElement.querySelector('.loading-indicator');
        const playButton = trackElement.querySelector('.play-btn');
        const stopButton = trackElement.querySelector('.stop-btn');

        // Show loading indicator while the track is being loaded
        loadingIndicator.style.display = 'block';
        player.load(audioFile).then(() => {
            loadingIndicator.style.display = 'none';
            playButton.disabled = false;
            stopButton.disabled = false;
        }).catch(error => {
            console.error('Error loading track:', error);
            loadingIndicator.textContent = 'Error loading track';
        });

        return trackElement;

    }

    document.getElementById('clear_workspace').addEventListener('click', () => {
        // Clear the workspace
        document.getElementById('workspace').innerHTML = '';

        // Reset the tracks array
        tracks = [];

        // Reset other UI elements or state variables as needed
        document.getElementById('title').value = '';
        document.getElementById('description').value = '';
        document.getElementById('privacy-toggle').value = 'private';

        // Reset the mixer
        const mixerContainer = document.getElementById('mixer-container');
        if (mixerContainer) {
            mixerContainer.innerHTML = '';
            const mixer = createMixer();
            mixerContainer.appendChild(mixer);
        }

        // Reset Tone.Transport
        Tone.Transport.stop();
        Tone.Transport.cancel();
    });









    document.getElementById('save-soundboard-btn').addEventListener('click', () => {
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const privacy = document.getElementById('privacy-toggle').value;
        const soundboardId = document.getElementById('soundboard_id').value;
        
        const tracks = [];

        document.querySelectorAll('.track').forEach(trackElement => {
            const trackData = {
                name: trackElement.querySelector('.track-name').textContent,
                file_url: trackElement.dataset.fileUrl,
                loop: trackElement.querySelector('.loop-checkbox').checked,
                volume: parseFloat(trackElement.querySelector('.volume-slider').value),
                pan: parseFloat(trackElement.querySelector('.pan-slider').value),
                loop_start: parseFloat(trackElement.querySelector('.loop-start').value),
                loop_end: parseFloat(trackElement.querySelector('.loop-end').value),
                active: trackElement.querySelector('.active-checkbox').checked,
                reversed: trackElement.querySelector('.reverse-checkbox').checked,
                pitch: parseFloat(trackElement.querySelector('.pitch-slider').value),
                solo: trackElement.querySelector('.solo-checkbox').checked,
                mute: trackElement.querySelector('.mute-checkbox').checked,
            };
            tracks.push(trackData);
        });

        //console.log('Collected tracks data:', tracks);



        const soundboardData = {
            id: soundboardId,
            title,
            description,
            privacy,
            tracks,
        };

        const url = soundboardId ? `/update_soundboard/${soundboardId}/` : '/save_soundboard/';

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken(),
            },
            body: JSON.stringify(soundboardData),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to save soundboard.');
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    alert('Soundboard saved successfully!');
                    if (!soundboardId) {
                        document.getElementById('soundboard_id').value = data.soundboard_id;
                        currentSoundboardId = data.soundboard_id;
                    }
                    location.reload(); // Force page refresh to update soundboard dropdown
                } else {
                    alert('Failed to save soundboard.');
                }
            })
            .catch(error => console.error('Error saving soundboard:', error));
    });









    const dropdown = document.getElementById('soundboard_dropdown');

    // Clear existing options to avoid duplication
    dropdown.innerHTML = '<option value="">Select a soundboard</option>';

    // fetch the soundboards from the server

    fetch('/get_soundboards/')
        .then(response => response.json())
        .then(soundboards => {
            soundboards.forEach(soundboard => {
                const option = document.createElement('option');
                option.value = soundboard.id;
                option.textContent = soundboard.title;
                dropdown.appendChild(option);
            });
            soundboardsFetched = true;
        })
        .catch(error => console.error('Error fetching soundboards:', error));


    document.getElementById('load-soundboard-btn').addEventListener('click', () => {
        const soundboardId = document.getElementById('soundboard_dropdown').value;

        if (!soundboardId) {
            alert('Please select a soundboard to load.');
            return;
        }

        // Fetch the selected soundboard data
        fetch(`/load_soundboard/${soundboardId}/`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load soundboard.');
                }
                return response.json();
            })
            .then(soundboardData => {
                // Update the UI with the loaded soundboard
                updateUIWithSoundboard(soundboardData);
                document.getElementById('soundboard_id').value = soundboardData.id; // Store the soundboard ID
            })
            .catch(error => {
                console.error('Error loading soundboard:', error);
                alert('An error occurred while loading the soundboard.');
            });
    });












    /**
  * Updates the UI with the loaded soundboard data.
  * @param {Object} soundboardData - The soundboard data from the backend.
  */

    // Function to update the UI with the loaded soundboard data
    function updateUIWithSoundboard(soundboardData) {
        //console.log('Soundboard data:', soundboardData);

        if (!soundboardData) {
            alert('No soundboard data available.');
            return;
        }

        // Set the soundboard ID
        document.getElementById('soundboard_id').value = soundboardData.id;
        currentSoundboardId = soundboardData.id;
        //console.log('Current soundboard ID set to:', currentSoundboardId);

        // Clear the workspace and dispose of any existing players/channels
        const workspace = document.getElementById('workspace');
        workspace.innerHTML = ''; // Clear previous content

        // Create mixer if it doesn't exist
        let mixer = document.querySelector('.mixer');
        if (!mixer) {
            mixer = createMixer();
            workspace.appendChild(mixer);
        }

        // Update title, description, and privacy
        document.getElementById('title').value = soundboardData.title || '';
        document.getElementById('description').value = soundboardData.description || '';
        document.getElementById('privacy-toggle').value = soundboardData.privacy || 'public';

        tracks = []; // Reset tracks array
        // Add tracks to the mixer
        if (Array.isArray(soundboardData.tracks) && soundboardData.tracks.length > 0) {
            soundboardData.tracks.forEach(trackData => {
                const player = new Tone.Player({
                    url: trackData.file_url || '',
                    loop: !!trackData.loop,
                    volume: parseFloat(trackData.volume) || 0,
                });

                const trackChannel = new Tone.Channel().connect(busChannel);
                player.connect(trackChannel);

                const trackElement = createTrackElement(trackData.file_url, player, trackChannel);
                mixer.appendChild(trackElement);

                // Set track properties
                trackElement.querySelector('.track-name').value = trackData.name || '';
                trackElement.querySelector('.volume-slider').value = parseFloat(trackData.volume) || 0;
                trackElement.querySelector('.pan-slider').value = parseFloat(trackData.pan) || 0;
                trackElement.querySelector('.loop-start').value = parseFloat(trackData.loop_start) || 0;
                trackElement.querySelector('.loop-end').value = parseFloat(trackData.loop_end) || 0;
                trackElement.querySelector('.loop-checkbox').checked = !!trackData.loop;
                trackElement.querySelector('.active-checkbox').checked = !!trackData.active;
                trackElement.querySelector('.reverse-checkbox').checked = !!trackData.reversed;
                trackElement.querySelector('.pitch-slider').value = parseFloat(trackData.pitch) || 1;
                trackElement.querySelector('.solo-checkbox').checked = !!trackData.solo;
                trackElement.querySelector('.mute-checkbox').checked = !!trackData.mute;

                // Load the player buffer
                player.load(trackData.file_url).then(() => {
                    //console.log('Buffer loaded for track: ${trackData.name}');
                }).catch(error => {
                    console.error('Error loading bufferfor track: ${trackData.name}', error);
                });
                tracks.push({ player, trackChannel, trackElement });
            });
        } else {
            //console.log('No tracks to display.');
            const noTracksMessage = document.createElement('p');
            noTracksMessage.textContent = 'No tracks available in this soundboard.';
            workspace.appendChild(noTracksMessage);
        }
    }

    // functionality for user to delete a soundboard
    document.getElementById('delete-soundboard-btn').addEventListener('click', () => {
        const soundboardId = document.getElementById('soundboard_dropdown').value;
        //console.log('Deleting soundboard:', soundboardId);

        if (!soundboardId) {
            alert('No soundboard to delete');
            return;
        }

        // Show confirmation dialog
        const userConfirmed = confirm('Are you sure you want to delete this soundboard? This action cannot be undone.');

        if (userConfirmed) {
            fetch(`/delete_soundboard/${soundboardId}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCSRFToken()
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        alert('Soundboard deleted successfully');
                        document.getElementById('soundboard_id').value = '';
                        currentSoundboardId = null;
                        // Clear the UI
                        document.getElementById('workspace').innerHTML = '';
                        document.getElementById('title').value = '';
                        document.getElementById('description').value = '';
                        document.getElementById('privacy-toggle').value = 'private';
                    } else {
                        alert('Failed to delete soundboard');
                    }
                })
                .catch(error => console.error('Error deleting soundboard:', error));
        }
    });


    // Function to start recording audio
    async function startRecording(duration) {
        const recorder = new Tone.Recorder();
        masterChannel.connect(recorder);

        // Show the recording notification
        const notification = document.querySelector('.recording-notification');
        notification.style.display = 'block';

        // Update the loading bar progress
        const progressBar = notification.querySelector('.progress');
        let elapsed = 0;
        const interval = setInterval(() => {
            elapsed += 100;
            const progress = (elapsed / (duration * 1000)) * 100;
            progressBar.style.width = `${progress}%`;
        }, 100);

        // Start recording
        recorder.start();

        // Start all active tracks
        tracks.forEach(async ({ player, trackElement }) => {
            const activeCheckbox = trackElement.querySelector('.active-checkbox');
            if (activeCheckbox.checked) {
                if (player) {
                    try {
                        const url = trackElement.getAttribute('data-file-url');
                        if (url) {
                            //console.log(`Loading player with URL: ${url}`);
                            const buffer = new Tone.Buffer(url, () => {
                                //console.log('Buffer loaded successfully:', buffer);
                                player.buffer = buffer;
                                player.start();
                            }, (error) => {
                                console.error('Error loading buffer:', error);
                            });
                        } else {
                            console.error('Player URL is undefined for track:', trackElement);
                        }
                    } catch (error) {
                        console.error('Error starting player:', error);
                    }
                } else {
                    console.error('Player is undefined for track:', trackElement);
                }
            }
        });

        Tone.Transport.start(); // Start global transport

        // Stop recording after the specified duration
        setTimeout(async () => {
            const recording = await recorder.stop();
            Tone.Transport.stop(); // Stop global transport

            // Stop all active tracks
            tracks.forEach(({ player }) => {
                if (player) {
                    try {
                        player.stop();
                    } catch (error) {
                        console.error('Error stopping player:', error);
                    }
                } else {
                    console.error('Player is undefined for track');
                }
            });

            // Create a download link for the recording
            const url = URL.createObjectURL(recording);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = 'recording.wav';
            anchor.click();

            // Disconnect the recorder
            masterChannel.disconnect(recorder);

            // Remove the notification
            clearInterval(interval);
            notification.style.display = 'none';
            progressBar.style.width = '0%'; // Reset progress bar
        }, duration * 1000);
    }

    document.addEventListener('touchstart', (e) => {
        const target = e.target;
    
        // If the touch is not on a valid card or the workspace, clean up the ghost element
        if (!target.closest('.card') && target !== workspace && !workspace.contains(target)) {
            if (ghostElement) {
                ghostElement.remove();
                ghostElement = null;
                draggedAudio = null;
            }
        }
    });

    statusText.addEventListener('click', (e) => {
        if (e.target.classList.contains('clear-selection')) {
            // Clear the selection and update the status message
            draggedAudio = null;
            if (ghostElement) {
                ghostElement.remove();
                ghostElement = null;
            }
            updateStatusMessage(); // Reset the status message
        }
    });
    


    

});

