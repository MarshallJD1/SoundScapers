
document.addEventListener('DOMContentLoaded', async () => {
    const workspace = document.getElementById('workspace');
    const cards = document.querySelectorAll('.card');
    let soundboardsFetched = false;



    if (!workspace) {
        console.error("Workspace element not found");
        return;
    }

    cards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
    });

    workspace.addEventListener('dragover', handleDragOver);
    workspace.addEventListener('drop', handleDrop);

    // Add a start button for Tone.js interaction
    const startButton = document.getElementById('start-audio-btn');



    startButton.addEventListener('click', async () => {
        // Start Tone.js only when the button is clicked
        if (!Tone.context.state || Tone.context.state !== 'running') {
            await Tone.start();
            console.log('Tone.js audio context started');
            startButton.style.display = 'none';  // Hide the start button after starting
        }
        Tone.start();
    });

    const masterChannel = new Tone.Channel().toDestination(); // Master channel
    const busChannel = new Tone.Channel().connect(masterChannel); // Bus channel for routing
    const tracks = []; // To store active tracks

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
            console.log('Tone.js audio context started');
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
        mixer.classList.add('mixer', 'bg-light', 'p-3', 'mb-3', 'rounded');
        mixer.innerHTML = `
            <h5>Mixer</h5>
            <div class="master-controls bg-dark p-3 rounded mb-2">
                <label>Master Volume</label>
                <input type="range" class="master-volume" min="-48" max="5" step="0.01" value="0.5">
                <label>Master Pan</label>
                <input type="range" class="master-pan" min="-1" max="1" step="0.01" value="0">
                <label>Master Timeline (1 - 180 seconds)</label>
                <input type="range" class="master-timeline" min="1" max="180" step="1" value="60">
                <button class="btn btn-success play-pause-btn">Play</button>
            </div>
        `;

        mixer.querySelector('.master-volume').addEventListener('input', (e) => {
            const masterVolume = parseFloat(e.target.value);
            masterChannel.volume.value = masterVolume;
            console.log(`Master volume set to: ${masterVolume}`);

            // Update all tracks' effective volume
            tracks.forEach(({ trackChannel, trackElement }) => {
                const volumeSlider = trackElement.querySelector('.volume-slider');
                trackChannel.volume.value = parseFloat(volumeSlider.value) + masterVolume;
            });
        });



        mixer.querySelector('.master-pan').addEventListener('input', (e) => {
            const pan = parseFloat(e.target.value);
            masterChannel.pan.value = pan;
            console.log(`Master pan set to: ${pan}`);
        });


        // Master timeline controls
        const playPauseButton = mixer.querySelector('.play-pause-btn');
        let isPlaying = false;

        playPauseButton.addEventListener('click', () => {
            isPlaying = !isPlaying;
            playPauseButton.textContent = isPlaying ? 'Pause' : 'Play';

            if (isPlaying) {
                // Start all active tracks
                tracks.forEach(({ player, trackElement }) => {
                    const activeCheckbox = trackElement.querySelector('.active-checkbox');
                    if (activeCheckbox.checked) {
                        player.start();
                    }
                });

                Tone.Transport.start(); // Start global transport
            } else {
                // Stop all tracks when master is paused
                tracks.forEach(({ player }) => {
                    player.stop();
                });

                Tone.Transport.pause(); // Pause global transport
            }
        });
        return mixer;
    }

    // Start the master timeline with loop
    function startMasterTimeline(duration) {
        Tone.Transport.loopStart = 0;
        Tone.Transport.loopEnd = duration;
        Tone.Transport.loop = true;
        console.log(`Master timeline set to loop for ${duration} seconds`);
    }


    // Create the track element
    function createTrackElement(audioFile, player, trackChannel) {
        const trackElement = document.createElement('div');
        trackElement.classList.add('track','audio-track', 'bg-secondary', 'p-3', 'mb-2', 'rounded');
        trackElement.dataset.fileUrl = audioFile;
        trackElement.innerHTML = `
        <h6 class="track-name">${audioFile.split('/').pop()}</h6>
        <button class="btn btn-primary btn-sm play-btn">Play</button>
        <button class="btn btn-danger btn-sm stop-btn">Stop</button>

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
            const duration = player.buffer.duration;
            const timeAtX = (x / waveformCanvas.width) * duration;

            // Display the time in the tooltip
            timeTooltip.textContent = `${timeAtX.toFixed(2)}s`;
            timeTooltip.style.left = `${x + 10}px`;  // Position tooltip just beside the cursor
            timeTooltip.style.top = `${rect.top - 30}px`;  // Position above the waveform
        });

        waveformCanvas.addEventListener('mouseleave', () => {
            timeTooltip.textContent = ''; // Hide the tooltip when mouse leaves
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
            console.log(`Track volume set to: ${trackChannel.volume.value}`);
        });

        // Play button functionality
        trackElement.querySelector('.play-btn').addEventListener('click', () => {
            // Apply settings
            player.loopStart = parseFloat(trackElement.querySelector('.loop-start').value);
            player.loopEnd = parseFloat(trackElement.querySelector('.loop-end').value);
            player.reverse = trackElement.querySelector('.reverse-checkbox').checked;
            trackChannel.mute = trackElement.querySelector('.mute-checkbox').checked;

            const volume = parseFloat(trackElement.querySelector('.volume-slider').value);
            trackChannel.volume.value = volume;

            // Start playing
            player.start();
        });

        trackElement.querySelector('.active-checkbox').addEventListener('change', (e) => {
            trackChannel.mute = !e.target.checked;
        });

        // Stop button functionality
        trackElement.querySelector('.stop-btn').addEventListener('click', () => {
            player.stop();
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

        return trackElement;

    }




    document.getElementById('save-soundboard-btn').addEventListener('click', () => {
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const privacy = document.getElementById('privacy-toggle').value;
        const tracks = []; // Collect track data

            // Verify that the .track query selector is correctly identifying the track elements
           const trackElements = document.querySelectorAll('.track');
           console.log('Track elements:', trackElements);
    
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

        console.log('Collected tracks data:', tracks);
    
        const soundboardData = {
            title,
            description,
            privacy,
            tracks
        };
    
        fetch('/save_soundboard/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify(soundboardData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('Soundboard saved successfully!');
            } else {
                alert('Failed to save soundboard.');
            }
        })
        .catch(error => console.error('Error saving soundboard:', error));
    });




    document.getElementById('save-draft-btn').addEventListener('click', () => {
        alert('Save as Draft functionality will be implemented here.');
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
        const selectedSoundboardId = dropdown.value;

        if (!selectedSoundboardId) {
            alert('Please select a soundboard to load.');
            return;
        }

        // Fetch the selected soundboard
        fetch(`/load_soundboard/${selectedSoundboardId}/`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load soundboard.');
                }
                return response.json();
            })
            .then(soundboardData => {
                // Update the UI with the loaded soundboard
                updateUIWithSoundboard(soundboardData);
            })
            .catch(error => console.error('Error loading soundboard:', error));
    });

    




    document.getElementById('post-to-feed-btn').addEventListener('click', () => {
        alert('Post to Feed functionality will be implemented here.');
    });




    // Function to get CSRF token from cookies (required for Django POST requests)
    function getCSRFToken() {
        const csrfTokenMatch = document.cookie.match(/csrftoken=([\w-]+)/);
        return csrfTokenMatch ? csrfTokenMatch[1] : '';
    }

    // Function to update the UI with the loaded soundboard data
    function updateUIWithSoundboard(soundboardData) {
        console.log('Soundboard data:', soundboardData); // Log the soundboard data for debugging
       
        const workspace = document.getElementById('workspace');
        workspace.innerHTML = ''; // Clear the workspace
    
        // Create mixer if it doesn't exist
        let mixer = document.querySelector('.mixer');
        if (!mixer) {
            mixer = createMixer();
            workspace.appendChild(mixer);
        }
    
        // Update the title and description
        document.getElementById('title').value = soundboardData.title;
        document.getElementById('description').value = soundboardData.description;
        document.getElementById('privacy-toggle').value = soundboardData.privacy;
    
        // Add tracks to the workspace
        if (Array.isArray(soundboardData.tracks)) {
        soundboardData.tracks.forEach(trackData => {
            const player = new Tone.Player({
                url: trackData.file_url,
                loop: trackData.loop,
                volume: trackData.volume,
            });
    
            const trackChannel = new Tone.Channel().connect(busChannel); // route to bus channel
            player.connect(trackChannel); // Connect the player to the track channel
    
            const trackElement = createTrackElement(trackData.file_url, player, trackChannel);
            mixer.appendChild(trackElement);
    
            // Set track properties
            trackElement.querySelector('.track-name').textContent = trackData.name;
            trackElement.querySelector('.volume-slider').value = trackData.volume;
            trackElement.querySelector('.pan-slider').value = trackData.pan;
            trackElement.querySelector('.loop-start').value = trackData.loop_start;
            trackElement.querySelector('.loop-end').value = trackData.loop_end;
            trackElement.querySelector('.loop-checkbox').checked = trackData.loop;
            trackElement.querySelector('.active-checkbox').checked = trackData.active;
            trackElement.querySelector('.reverse-checkbox').checked = trackData.reversed;
            trackElement.querySelector('.pitch-slider').value = trackData.pitch;
            trackElement.querySelector('.solo-checkbox').checked = trackData.solo;
            trackElement.querySelector('.mute-checkbox').checked = trackData.mute;
        });
    } else {
        console.log('No tracks to display');
        // Optionally, display a message in the UI
        const noTracksMessage = document.createElement('p');
        noTracksMessage.textContent = 'No tracks available in this soundboard.';
        workspace.appendChild(noTracksMessage);
    }
}});

