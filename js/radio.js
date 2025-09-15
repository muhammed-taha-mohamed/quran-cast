// Radio Stations Data
const radioStations = [
    {
        id: 'egypt-quran',
        name: 'إذاعة القرآن الكريم – القاهرة',
        url: 'https://stream.radiojar.com/8s5u5tpdtwzuv',
        description: 'إذاعة القرآن الكريم من القاهرة - مصر',
        icon: 'bi-broadcast-pin',
        color: '#0f766e',

    },

    {
        id: 'tarateel',
        name: 'تراتيل',
        url: 'https://backup.qurango.net/radio/tarateel',
        description: 'تراتيل - تلاوات قصيرة متميزة',
        icon: 'bi-broadcast-pin',
        color: '#0f766e'
    },

    {
        id: 'tlawat',
        name: 'تلاوات خاشعة',
        url: 'https://backup.qurango.net/radio/salma',
        description: 'تلاوات مختارة من قراء متنوعين',
        icon: 'bi-broadcast-pin',
        color: '#0f766e'
    },


    {
        id: 'mukhtasartafsir',
        name: 'تفسير',
        url: 'https://backup.qurango.net/radio/mukhtasartafsir',
        description: 'المختصر في تفسير القرآن الكريم',
        icon: 'bi-broadcast-pin',
        color: '#0f766e'
    },
    {
        id: 'almukhtasar_fi_alsiyra',
        name: 'المختصر في السيرة النبوية',
        url: 'https://backup.qurango.net/radio/almukhtasar_fi_alsiyra',
        description: 'حلقات مختصرة عن سيرة نبيّنا محمد صلى الله عليه وسلم',
        icon: 'bi-broadcast-pin',
        color: '#0f766e'
    },
    {
        id: 'fi_zilal_alsiyra',
        name: 'في ظلال السيرة النبوية',
        url: 'https://backup.qurango.net/radio/fi_zilal_alsiyra',
        description: '400 حلقة عن سيرة نبينا محمد صلى الله عليه وسلم',
        icon: 'bi-broadcast-pin',
        color: '#0f766e'
    },
    {
        id: 'sahaba-radio',
        name: 'صور من حياة الصحابة',
        url: 'https://backup.qurango.net/radio/sahabah',
        description: '',
        icon: 'bi-broadcast-pin',
        color: '#0f766e'
    },
    {
        id: 'abdulbasit_abdulsamad_moratal',
        name: 'إذاعة الشيخ عبدالباسط عبدالصمد – تلاوات خالدة',
        url: 'https://backup.qurango.net/radio/abdulbasit_abdulsamad_moratal',
        description: 'إذاعة تلاوات مرتلة خالدة للشيخ عبدالباسط عبدالصمد',
        icon: 'bi-person',
        color: '#d4af37'
    },
    {
        id: 'abdulbasit_abdulsamad_mojawwad',
        name: 'إذاعة الشيخ عبدالباسط عبدالصمد',
        url: 'https://backup.qurango.net/radio/abdulbasit_abdulsamad_mojawwad',
        description: 'إذاعة تلاوات مجودة خالدة للشيخ عبدالباسط عبدالصمد',
        icon: 'bi-person',
        color: '#0f766e'
    }
];

// Radio Player Class with PWA support
class RadioPlayer {
    constructor() {
        this.audio = new Audio();
        this.currentStation = null;
        this.isPlaying = false;
        this.volume = 0.7;
        this.audio.volume = this.volume;
        this.backgroundPlayback = false;
        this.mediaSessionSupported = 'mediaSession' in navigator;

        this.audio.addEventListener('loadstart', () => this.onLoadStart());
        this.audio.addEventListener('canplay', () => this.onCanPlay());
        this.audio.addEventListener('play', () => this.onPlay());
        this.audio.addEventListener('pause', () => this.onPause());
        this.audio.addEventListener('error', () => this.onError());
        this.audio.addEventListener('ended', () => this.onEnded());
        
        // Setup background playback
        this.setupBackgroundPlayback();
    }

    play(station) {
        // Stop Quran if playing
        if (typeof quranPlayer !== 'undefined' && quranPlayer && !quranPlayer.audio.paused) {
            quranPlayer.audio.pause();
            quranPlayer.isPlaying = false;
            quranPlayer.updatePlayPauseButton();
        }

        if (this.currentStation && this.currentStation.id === station.id) {
            if (this.isPlaying) {
                this.pause();
            } else {
                this.audio.play();
            }
        } else {
            this.currentStation = station;
            this.audio.src = station.url;
            this.audio.play();

            // Show radio mini player
            this.showRadioMiniPlayer();
        }

        // Update media session for PWA
        this.updateMediaSession();
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updateUI('paused');
        this.updateRadioMiniPlayer();
        
        // Update media session for PWA
        this.updateMediaSession();
    }

    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
        this.currentStation = null;
        this.hideRadioMiniPlayer();

        // Update media session for PWA
        if (this.mediaSessionSupported && window.notificationSystem) {
            window.notificationSystem.updatePlaybackState('none');
        }

        // Hide all visualizers and remove selected class
        const cards = document.querySelectorAll('.radio-station-card');
        cards.forEach(card => {
            card.classList.remove('selected');
            const visualizer = card.querySelector('.radio-visualizer');
            if (visualizer) {
                visualizer.style.display = 'none';
            }
        });
    }

    setVolume(volume) {
        this.volume = volume;
        this.audio.volume = volume;
    }

    onLoadStart() {
        this.updateUI('loading');
    }

    onCanPlay() {
        this.updateUI('ready');
    }

    onPlay() {
        this.isPlaying = true;
        this.updateUI('playing');
        this.updateRadioMiniPlayer();
    }

    onPause() {
        this.isPlaying = false;
        this.updateUI('paused');
        this.updateRadioMiniPlayer();
    }

    onError() {
        this.isPlaying = false;
        this.updateUI('error');
        this.showError('حدث خطأ في تحميل المحطة. يرجى المحاولة مرة أخرى.');
    }

    onEnded() {
        this.isPlaying = false;
        this.updateUI('ended');
    }

    updateUI(state) {
        const playBtn = document.getElementById('radioPlayBtn');
        const statusText = document.getElementById('radioStatus');
        const stationName = document.getElementById('currentStationName');

        if (playBtn) {
            const icon = playBtn.querySelector('i');
            switch (state) {
                case 'loading':
                    icon.className = 'bi bi-hourglass-split';
                    playBtn.disabled = true;
                    break;
                case 'ready':
                case 'paused':
                    icon.className = 'bi bi-play-fill';
                    playBtn.disabled = false;
                    break;
                case 'playing':
                    icon.className = 'bi bi-pause-fill';
                    playBtn.disabled = false;
                    break;
                case 'error':
                case 'ended':
                    icon.className = 'bi bi-play-fill';
                    playBtn.disabled = false;
                    break;
            }
        }

        if (statusText) {
            switch (state) {
                case 'loading':
                    statusText.textContent = 'جاري التحميل...';
                    break;
                case 'ready':
                    statusText.textContent = 'جاهز للتشغيل';
                    break;
                case 'playing':
                    statusText.textContent = 'جاري التشغيل';
                    break;
                case 'paused':
                    statusText.textContent = 'متوقف مؤقتاً';
                    break;
                case 'error':
                    statusText.textContent = 'خطأ في التحميل';
                    break;
                case 'ended':
                    statusText.textContent = 'انتهى التشغيل';
                    break;
            }
        }

        if (this.currentStation) {
            if (stationName) stationName.textContent = this.currentStation.name;

        }
    }

    showError(message) {
        // Create a simple error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        errorDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
        errorDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(errorDiv);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    showRadioMiniPlayer() {
        const radioMiniPlayer = document.getElementById('radioMiniPlayer');
        if (radioMiniPlayer) {
            radioMiniPlayer.classList.add('show');
            this.updateRadioMiniPlayer();
        }
    }

    hideRadioMiniPlayer() {
        const radioMiniPlayer = document.getElementById('radioMiniPlayer');
        if (radioMiniPlayer) {
            radioMiniPlayer.classList.remove('show');
        }
    }

    updateRadioMiniPlayer() {
        const radioMiniPlayer = document.getElementById('radioMiniPlayer');
        const radioMiniTitle = document.getElementById('radioMiniTitle');
        const radioMiniSubtitle = document.getElementById('radioMiniSubtitle');
        const radioMiniDescription = document.getElementById('radioMiniDescription');
        const radioMiniPlayBtn = document.getElementById('radioMiniPlayBtn');
        const radioMiniThumbnail = document.querySelector('.radio-mini-player-thumbnail');

        if (!radioMiniPlayer) return;

        if (this.currentStation) {
            if (radioMiniTitle) {
                radioMiniTitle.textContent = this.currentStation.name;
            }
            if (radioMiniSubtitle) {
                radioMiniSubtitle.textContent = this.currentStation.country;
            }
            if (radioMiniDescription) {
                radioMiniDescription.textContent = this.currentStation.description;
            }
            if (radioMiniPlayBtn) {
                const icon = radioMiniPlayBtn.querySelector('i');
                if (icon) {
                    icon.className = this.isPlaying ? 'bi bi-pause-fill' : 'bi bi-play-fill';
                }
            }
            if (radioMiniThumbnail) {
                if (this.isPlaying) {
                    radioMiniThumbnail.classList.add('playing');
                } else {
                    radioMiniThumbnail.classList.remove('playing');
                }
            }
        }
    }

    // Setup background playback for PWA
    setupBackgroundPlayback() {
        // Listen for media action events
        window.addEventListener('mediaAction', (event) => {
            const { action } = event.detail;
            this.handleMediaAction(action);
        });

        // Setup visibility change handler for background playback
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isPlaying) {
                this.backgroundPlayback = true;
                this.updateMediaSession();
            } else if (!document.hidden && this.backgroundPlayback) {
                this.backgroundPlayback = false;
            }
        });
    }

    // Handle media actions from notifications
    handleMediaAction(action) {
        switch (action) {
            case 'play':
                if (this.currentStation) {
                    this.play(this.currentStation);
                }
                break;
            case 'pause':
                this.pause();
                break;
            case 'stop':
                this.stop();
                break;
            case 'next':
                this.playNextStation();
                break;
            case 'previous':
                this.playPreviousStation();
                break;
        }
    }

    // Update Media Session metadata
    updateMediaSession() {
        if (!this.mediaSessionSupported || !this.currentStation) return;

        // Update notification system with current station info
        if (window.notificationSystem) {
            window.notificationSystem.updateMediaSession({
                title: this.currentStation.name,
                artist: this.currentStation.description || 'محطة إذاعية',
                album: 'Quran Cast Radio'
            });

            // Update playback state
            window.notificationSystem.updatePlaybackState(this.isPlaying ? 'playing' : 'paused');

            // Show notification for station change
            if (this.isPlaying) {
                window.notificationSystem.showStationChanged(this.currentStation.name);
            }
        }
    }

    // Play next station
    playNextStation() {
        if (!this.currentStation) return;
        
        const currentIndex = radioStations.findIndex(s => s.id === this.currentStation.id);
        const nextIndex = (currentIndex + 1) % radioStations.length;
        const nextStation = radioStations[nextIndex];
        
        if (nextStation) {
            selectRadioStation(nextStation.id);
        }
    }

    // Play previous station
    playPreviousStation() {
        if (!this.currentStation) return;
        
        const currentIndex = radioStations.findIndex(s => s.id === this.currentStation.id);
        const prevIndex = currentIndex === 0 ? radioStations.length - 1 : currentIndex - 1;
        const prevStation = radioStations[prevIndex];
        
        if (prevStation) {
            selectRadioStation(prevStation.id);
        }
    }
}

// Initialize Radio Player
let radioPlayer = null;

// Initialize Radio Page
function initializeRadioPage() {
    console.log('Initializing Radio Page...');

    // Scroll to top when entering radio page
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
    });

    // Initialize radio player
    if (!radioPlayer) {
        radioPlayer = new RadioPlayer();
    }

    // Render radio stations
    renderRadioStations();

    // Setup event listeners
    setupRadioEventListeners();
}

// Render Radio Stations
function renderRadioStations() {
    const container = document.getElementById('radio_section');
    if (!container) return;

    container.innerHTML = `
        <div class="radio-hero-section">
            <div class="radio-hero-content">
                <div class="radio-hero-text">
                    <h1 class="radio-hero-title">
                        <i class="bi bi-broadcast"></i>
                        الإذاعات الإسلامية
                    </h1>
                    <p class="radio-hero-subtitle">
                        استمع إلى أفضل الإذاعات الإسلامية من مختلف الدول العربية
                    </p>
                </div>
                <div class="radio-hero-image">
                    <i class="bi bi-radio"></i>
                </div>
            </div>
        </div>

       

        <div class="radio-stations-grid">
            ${radioStations.map(station => `
                <div class="radio-station-card" onclick="selectRadioStation('${station.id}')" data-station-id="${station.id}">
                    <div class="radio-station-icon" style="background: ${station.color}">
                        <i class="bi ${station.icon}"></i>
                    </div>
                    <div class="radio-station-info">
                        <h4 class="radio-station-name">${station.name}</h4>
                        <p class="radio-station-description">${station.description}</p>
                    </div>
                    <div class="radio-station-controls" id="controls-${station.id}">
                        <div class="radio-visualizer" id="visualizer-${station.id}" style="display: none;">
                            <div class="radio-bar"></div>
                            <div class="radio-bar"></div>
                            <div class="radio-bar"></div>
                            <div class="radio-bar"></div>
                            <div class="radio-bar"></div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Setup Event Listeners
function setupRadioEventListeners() {
    // Volume control
    const volumeSlider = document.getElementById('radioVolumeSlider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            if (radioPlayer) {
                radioPlayer.setVolume(parseFloat(e.target.value));
            }
        });
    }
}

// Select Radio Station
function selectRadioStation(stationId) {
    const station = radioStations.find(s => s.id === stationId);
    if (!station || !radioPlayer) return;

    // Update UI - remove selected from all cards
    const cards = document.querySelectorAll('.radio-station-card');
    cards.forEach(card => {
        card.classList.remove('selected');
        const visualizer = card.querySelector('.radio-visualizer');
        if (visualizer) {
            visualizer.style.display = 'none';
        }
    });

    // Add selected to current card and show visualizer
    const selectedCard = document.querySelector(`[data-station-id="${stationId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
        const visualizer = selectedCard.querySelector('.radio-visualizer');
        if (visualizer) {
            visualizer.style.display = 'flex';
        }
    }

    // Play station
    radioPlayer.play(station);
}

// Toggle Radio Play
function toggleRadioPlay() {
    if (!radioPlayer) return;

    if (radioPlayer.currentStation) {
        radioPlayer.play(radioPlayer.currentStation);
    } else {
        // If no station selected, play first station
        selectRadioStation(radioStations[0].id);
    }
}

// Stop Radio
function stopRadio() {
    if (radioPlayer) {
        radioPlayer.stop();
    }
}

// Toggle Radio Mini Player Play/Pause
function toggleRadioMiniPlay() {
    if (radioPlayer && radioPlayer.currentStation) {
        if (radioPlayer.isPlaying) {
            radioPlayer.pause();
        } else {
            radioPlayer.play(radioPlayer.currentStation);
        }
    }
}

// Open Radio Page
function openRadioPage() {
    // Navigate to radio page
    location.hash = '#radio';

    // Scroll to radio player section
    setTimeout(() => {
        const radioPlayerSection = document.querySelector('.radio-player-section');
        if (radioPlayerSection) {
            radioPlayerSection.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, 100);
}

// Close Radio Mini Player and Stop Radio
function closeRadioMiniPlayer() {
    // Stop radio if playing
    if (radioPlayer && radioPlayer.isPlaying) {
        radioPlayer.stop();
    }

    // Hide radio mini player
    const radioMiniPlayer = document.getElementById('radioMiniPlayer');
    if (radioMiniPlayer) {
        radioMiniPlayer.classList.remove('show');
    }
}

// Stop radio when Quran starts playing
function stopRadioForQuran() {
    if (radioPlayer && radioPlayer.isPlaying) {
        radioPlayer.stop();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Check if we're on the radio page
    if (window.location.hash === '#radio' || document.getElementById('radio_section')) {
        initializeRadioPage();
    }
});
