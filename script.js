const searchForm = document.getElementById('search-form');
const searchQueryInput = document.getElementById('search-query');
const resultsContainer = document.getElementById('results');

// Tu clave API
const API_KEY = "AIzaSyCtfOZXvitHJZIx5Ejp6Dw08acra7fhHzc";

// Objeto para almacenar referencias al reproductor, intervalos y duración por videoId
const players = {};

searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchQueryInput.value.trim();
    if (query) {
        buscarVideos(query);
    }
});

function buscarVideos(query) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&key=${API_KEY}&maxResults=5`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            mostrarResultados(data.items);
        })
        .catch(error => {
            console.error("Error al buscar videos:", error);
        });
}

function mostrarResultados(videos) {
    resultsContainer.innerHTML = '';
    videos.forEach(video => {
        const videoId = video.id.videoId;
        const title = video.snippet.title;
        const thumbnailUrl = video.snippet.thumbnails.default.url;

        const item = document.createElement('div');
        item.classList.add('result-item');

        const thumbnail = document.createElement('img');
        thumbnail.src = thumbnailUrl;
        thumbnail.alt = title;

        const infoContainer = document.createElement('div');
        infoContainer.classList.add('result-info');

        const titleElement = document.createElement('div');
        titleElement.classList.add('result-title');
        titleElement.textContent = title;
        
        const playButton = document.createElement('button');
        playButton.classList.add('play-button');
        playButton.textContent = 'Reproducir Audio';

        const timeline = document.createElement('input');
        timeline.type = 'range';
        timeline.min = 0;
        timeline.value = 0;
        timeline.classList.add('timeline');
        timeline.style.display = 'none'; // Oculto hasta que se empiece a reproducir

        timeline.addEventListener('input', () => {
            const playerData = players[videoId];
            if (playerData && playerData.player) {
                playerData.player.seekTo(Number(timeline.value), true);
            }
        });

        playButton.addEventListener('click', () => {
            reproducirAudio(videoId, item, timeline, playButton);
        });

        infoContainer.appendChild(titleElement);
        infoContainer.appendChild(playButton);
        infoContainer.appendChild(timeline);

        item.appendChild(thumbnail);
        item.appendChild(infoContainer);

        resultsContainer.appendChild(item);
    });
}

// Esta función es llamada por la API de YouTube cuando está lista
window.onYouTubeIframeAPIReady = function() {
    // No necesitamos hacer nada aquí directamente.
};

function reproducirAudio(videoId, container, timeline, playButton) {
    const playerData = players[videoId];

    // Si el reproductor ya existe, al pulsar se detiene.
    if (playerData && playerData.player) {
        clearInterval(playerData.interval);
        const existingContainer = container.querySelector('#player-' + videoId);
        if (existingContainer) existingContainer.remove();
        players[videoId] = null;
        timeline.style.display = 'none';
        playButton.textContent = 'Reproducir Audio';
        return;
    }

    // Crear contenedor para el reproductor, ya oculto
    const playerContainer = document.createElement('div');
    playerContainer.id = 'player-' + videoId;
    playerContainer.classList.add('hidden-player');
    container.appendChild(playerContainer);

    // Crear el reproductor usando la IFrame Player API
    // Iniciamos en silencio (mute:1) para que el autoplay funcione sin interacción del usuario.
    const player = new YT.Player(playerContainer.id, {
        videoId: videoId,
        playerVars: {
            autoplay: 1,
            controls: 0,
            modestbranding: 1, 
            disablekb: 1,
            mute: 1 // inicia silenciado para asegurar autoplay
        },
        events: {
            'onReady': (event) => {
                // Una vez listo, desmuteamos para escuchar el audio
                event.target.unMute();

                const duration = event.target.getDuration();
                timeline.max = duration;
                timeline.style.display = 'block';
                playButton.textContent = 'Detener Audio';

                // Actualizamos el slider cada 500 ms
                const interval = setInterval(() => {
                    if (event.target && event.target.getCurrentTime) {
                        const currentTime = event.target.getCurrentTime();
                        timeline.value = currentTime;
                    }
                }, 500);

                players[videoId] = {
                    player: event.target,
                    interval: interval,
                    duration: duration
                };
            }
        }
    });
}