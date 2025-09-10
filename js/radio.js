// Radio Stations Data
const radioStations = [
    {
        id: 'egypt-quran',
        name: 'إذاعة القرآن الكريم – القاهرة',
        url: 'https://stream.radiojar.com/8s5u5tpdtwzuv',
        description: 'إذاعة القرآن الكريم من القاهرة - مصر',
        icon: 'bi-broadcast',
        color: '#0f766e'
    },

    {
        id: 'tarateel',
        name: 'تراتيل',
        url: 'https://backup.qurango.net/radio/tarateel',
        description: 'تراتيل - تلاوات قصيرة متنوعة',
        icon: 'bi-broadcast',
        color: '#0f766e'
    },

    {
        id: 'tlawat',
        name: 'تلاوات خاشعة',
        url: 'https://backup.qurango.net/radio/salma',
        description: 'تلاوات خاشعة',
        icon: 'bi-broadcast',
        color: '#0f766e'
    },

    
    
    {
        id: 'tafseer',
        name: 'تفسير القرآن',
        url: 'https://backup.qurango.net/radio/tafseer',
        description: 'تفسير القرآن',
        icon: 'bi-broadcast',
        color: '#0f766e'
    },
    {
        id: 'alafasy-radio',
        name: 'إذاعة الشيخ مشاري العفاسي – الكويت',
        url: 'http://quraan.us:8000/;stream.mp3',
        description: 'إذاعة الشيخ مشاري العفاسي من الكويت',
        icon: 'bi-person-badge',
        color: '#d4af37'
    },
    {
        id: 'abdulbasit-radio',
        name: 'إذاعة الشيخ عبدالباسط عبدالصمد – تلاوات خالدة',
        url: 'http://live.mp3quran.net:9710/;stream.mp3',
        description: 'إذاعة تلاوات خالدة للشيخ عبدالباسط عبدالصمد',
        icon: 'bi-person-badge',
        color: '#d4af37'
    },
    {
        id: 'qatar-quran',
        name: 'إذاعة القرآن الكريم – قطر',
        url: 'http://qatarradio.online:8000/quran',
        description: 'إذاعة القرآن الكريم من دولة قطر',
        icon: 'bi-broadcast',
        color: '#0f766e'
    },
    {
        id: 'bahrain-quran',
        name: 'إذاعة القرآن الكريم – البحرين',
        url: 'http://radio.bh:8000/quranfm',
        description: 'إذاعة القرآن الكريم من مملكة البحرين',
        icon: 'bi-broadcast',
        color: '#0f766e'
    }
];

// Radio Player Class
class RadioPlayer {
    constructor() {
        this.audio = new Audio();
        this.currentStation = null;
        this.isPlaying = false;
        this.volume = 0.7;
        this.audio.volume = this.volume;
        
        this.audio.addEventListener('loadstart', () => this.onLoadStart());
        this.audio.addEventListener('canplay', () => this.onCanPlay());
        this.audio.addEventListener('play', () => this.onPlay());
        this.audio.addEventListener('pause', () => this.onPause());
        this.audio.addEventListener('error', () => this.onError());
        this.audio.addEventListener('ended', () => this.onEnded());
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
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updateUI('paused');
        this.updateRadioMiniPlayer();
    }

    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
        this.currentStation = null;
        this.hideRadioMiniPlayer();
        
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
}

// Initialize Radio Player
let radioPlayer = null;

// Initialize Radio Page
function initializeRadioPage() {
    console.log('Initializing Radio Page...');
    
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
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the radio page
    if (window.location.hash === '#radio' || document.getElementById('radio_section')) {
        initializeRadioPage();
    }
});
