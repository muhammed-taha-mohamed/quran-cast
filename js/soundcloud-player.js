// ====== SoundCloud Style Quran Player ======

class SoundCloudQuranPlayer {
    constructor() {
        this.audio = new Audio();
        this.currentSurah = null;
        this.currentAyah = 0;
        this.playlist = [];
        this.isPlaying = false;
        this.isExpanded = false;
        this.volume = 0.7;
        this.playbackRate = 1.0;
        this.currentReciter = 'ar.alafasy';

        this.init();
    }

    init() {
        this.createPlayerHTML();
        this.setupEventListeners();
        this.setupAudioEvents();
        this.loadSurahs();
        this.loadSettings();
    }

    createPlayerHTML() {
        // Create player container
        const playerContainer = document.createElement('div');
        playerContainer.className = 'quran-player-container hide';
        playerContainer.id = 'quranPlayerContainer';

        playerContainer.innerHTML = `
            <!-- Mini Player -->
            <div class="mini-player" id="miniPlayer">
                <div class="mini-player-info">
                    <div class="mini-player-thumbnail" id="miniThumbnail">
                        <i class="bi bi-headphones"></i>
                    </div>
                    <div class="mini-player-text">
                        <div class="mini-player-title" id="miniTitle">اختر سورة للاستماع</div>
                        <div class="mini-player-subtitle" id="miniSubtitle">اضغط للفتح</div>
                    </div>
                </div>
                <div class="mini-player-controls">
                                            <button class="mini-player-btn" id="miniPlayBtn" onclick="quranPlayer.togglePlayPause()">
                            <i class="bi bi-play-circle-fill" id="miniPlayIcon"></i>
                        </button>
                                            <button class="mini-player-btn" onclick="quranPlayer.toggleExpanded()">
                            <i class="bi bi-arrow-up-circle" id="expandIcon"></i>
                        </button>
                </div>
            </div>

            <!-- Full Player -->
            <div class="full-player" id="fullPlayer" style="display: none;">
                <!-- Player Header -->
                <div class="player-header">
                    <div class="player-header-left">
                        <div class="player-thumbnail" id="playerThumbnail">
                            <i class="bi bi-headphones"></i>
                        </div>
                        <div class="player-info">
                            <div class="player-title" id="playerTitle">اختر سورة للاستماع</div>
                            <div class="player-subtitle" id="playerSubtitle">اضغط على أي سورة للبدء</div>
                        </div>
                    </div>
                    <div class="player-header-right">
                        <button class="player-action-btn download-btn" onclick="quranPlayer.downloadAyah()" title="تحميل الآية">
                            <i class="bi bi-download"></i>
                        </button>
                        <button class="player-action-btn favorite-btn" onclick="quranPlayer.toggleFavorite()" title="إضافة للمفضلة">
                            <i class="bi bi-heart" id="favoriteIcon"></i>
                        </button>
                        <button class="player-action-btn" onclick="quranPlayer.share()" title="مشاركة">
                            <i class="bi bi-share"></i>
                        </button>
                        <button class="player-action-btn" onclick="quranPlayer.toggleExpanded()" title="تصغير">
                            <i class="bi bi-arrow-down-circle"></i>
                        </button>
                    </div>
                </div>

                <!-- Progress Bar -->
                <div class="progress-container">
                    <div class="progress-bar" id="progressBar">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>
                    <div class="time-display">
                        <span id="currentTime">00:00</span>
                        <span id="totalTime">00:00</span>
                    </div>
                </div>

                <!-- Main Controls -->
                <div class="main-controls">
                    <button class="control-btn" onclick="quranPlayer.previousAyah()" title="السابق">
                        <i class="bi bi-skip-backward"></i>
                    </button>
                    <button class="control-btn play-pause" onclick="quranPlayer.togglePlayPause()" title="تشغيل/إيقاف">
                        <i class="bi bi-play-circle-fill" id="playIcon"></i>
                    </button>
                    <button class="control-btn" onclick="quranPlayer.nextAyah()" title="التالي">
                        <i class="bi bi-skip-forward"></i>
                    </button>
                </div>

                <!-- Secondary Controls -->
                <div class="secondary-controls">
                    <div class="secondary-controls-left">
                        <div class="volume-control">
                            <i class="bi bi-volume-up"></i>
                            <input type="range" class="volume-slider" id="volumeSlider" min="0" max="100" value="70">
                        </div>
                    </div>
                    <div class="secondary-controls-right">
                        <div class="speed-control">
                            <i class="bi bi-speedometer2"></i>
                            <select class="speed-select" id="speedSelect">
                                <option value="0.5">0.5x</option>
                                <option value="0.75">0.75x</option>
                                <option value="1.0" selected>1.0x</option>
                                <option value="1.25">1.25x</option>
                                <option value="1.5">1.5x</option>
                                <option value="2.0">2.0x</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Reciter Selection -->
                <div class="reciter-section">
                    <div class="reciter-header">
                        <div class="reciter-title">اختر القارئ</div>
                        <select class="reciter-select" id="reciterSelect">
                            
                        <option value="ar.alafasy">
                        مشاري العفاسي</option>
                           
                           
                            <option value="ar.abdulbasitmurattal">  
                            عبد الباسط عبد الصمد (مرتل)
                            </option>
                           

                             <option value="ar.abdulbasitmujawwad">  
                            عبد الباسط عبد الصمد (مجود)
                            </option>

                            <option value="ar.minshawi">  
                            محمد صديق المنشاوي (مرتل)
                            </option>

                            
                            <option value="ar.minshawimujawwad">  
                            محمد صديق المنشاوي (مجود)
                            </option>
                           

                             <option value="ar.abdurrahmaansudais">  
                            عبد الرحمن السديس
                            </option>

                            <option value="ar.husary">  
                            محمود خليل الحصري (مرتل)
                            </option>

                             <option value="ar.husarymujawwad">  
                            محمود خليل الحصري (مجود)
                            </option>


                            <option value="ar.saoodshuraym">  
                            سعود الشريم
                            </option>

                            <option value="ar.muhammadayyoub">  
                            محمد أيوب
                            </option>

                            <option value="ar.shaatree">  
                             ابو بكر الشاطري
                            </option>

                            <option value="ar.ahmedajamy">  
                            أحمد بن علي العجمي
                            </option>                        </select>
                    </div>
                </div>

                <!-- Playlist Section -->
                <div class="playlist-section">
                    <div class="playlist-header">
                        <div class="playlist-title">قائمة السور</div>
                        <div class="playlist-count" id="playlistCount">0 سورة</div>
                    </div>
                    <div class="playlist-container" id="playlistContainer">
                        <div class="loading-spinner"></div>
                        <p>جاري تحميل السور...</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(playerContainer);
    }

    setupEventListeners() {
        // Progress bar click
        document.getElementById('progressBar').addEventListener('click', (e) => {
            const rect = e.target.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            this.seekTo(percent);
        });

        // Volume control
        document.getElementById('volumeSlider').addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });

        // Speed control
        document.getElementById('speedSelect').addEventListener('change', (e) => {
            this.setPlaybackRate(parseFloat(e.target.value));
        });

        // Reciter selection
        document.getElementById('reciterSelect').addEventListener('change', (e) => {
            this.setReciter(e.target.value);
        });

        // Mini player click
        document.getElementById('miniPlayer').addEventListener('click', (e) => {
            if (!e.target.closest('.mini-player-btn')) {
                this.toggleExpanded();
            }
        });
    }

    setupAudioEvents() {
        this.audio.addEventListener('timeupdate', () => {
            this.updateProgress();
        });

        this.audio.addEventListener('ended', () => {
            // Auto-play next ayah in the same surah
            if (this.currentAyah < this.playlist.length - 1) {
                this.nextAyah();
            } else {
                // Auto-play next surah if available
                const currentSurahIndex = this.surahs.findIndex(s => s.number === this.currentSurah.number);
                if (currentSurahIndex < this.surahs.length - 1) {
                    this.showNotification('جاري الانتقال للسورة التالية...', 'info');
                    setTimeout(() => {
                        this.loadSurah(currentSurahIndex + 1);
                        this.playAyah(0);
                    }, 1000);
                } else {
                    // End of all surahs
                    this.showNotification('انتهت جميع السور', 'info');
                    this.isPlaying = false;
                    this.updatePlayButton();
                    this.hideFloatingButton();
                }
            }
        });

        this.audio.addEventListener('loadedmetadata', () => {
            this.updateTotalTime();
        });

        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.updatePlayButton();
            this.updateFloatingButtonState();
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayButton();
            this.updateFloatingButtonState();
        });

        this.audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.showNotification('خطأ في تحميل الملف الصوتي', 'error');
            this.hideFloatingButton();
        });
    }

    async loadSurahs() {
        try {
            const response = await fetch('https://api.alquran.cloud/v1/surah');
            const data = await response.json();
            this.surahs = data.data;
            this.renderPlaylist();
        } catch (error) {
            console.error('Error loading surahs:', error);
            this.showNotification('خطأ في تحميل السور', 'error');
            this.hideFloatingButton();
        }
    }

    renderPlaylist() {
        const container = document.getElementById('playlistContainer');
        const count = document.getElementById('playlistCount');

        count.textContent = `${this.surahs.length} سورة`;

        container.innerHTML = this.surahs.map((surah, index) => `
            <div class="playlist-item" onclick="quranPlayer.loadSurah(${index})">
                <div class="playlist-item-number">${surah.number}</div>
                <div class="playlist-item-content">
                    <div class="playlist-item-text">${surah.name}</div>
                    <div class="playlist-item-translation">${surah.englishName} - ${surah.numberOfAyahs} آية</div>
                </div>
                <div class="playlist-item-duration">
                    <i class="bi bi-play-circle"></i>
                </div>
            </div>
        `).join('');
    }

    async loadSurah(index) {
        const surah = this.surahs[index];
        if (!surah) return;

        this.currentSurah = surah;
        this.currentAyah = 0;

        // Update UI
        this.updatePlayerInfo(surah);
        this.markActiveSurah(index);
        this.updateFloatingButtonState();

        try {
            // Show loading state
            this.showNotification('جاري تحميل السورة...', 'info');

            // Load surah data
            const [arabicRes, englishRes, audioRes] = await Promise.all([
                fetch(`https://api.alquran.cloud/v1/surah/${surah.number}`),
                fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/en.pickthall`),
                fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/${this.currentReciter}`)
            ]);

            const [arabicData, englishData, audioData] = await Promise.all([
                arabicRes.json(),
                englishRes.json(),
                audioRes.json()
            ]);

            // Prepare playlist
            this.playlist = arabicData.data.ayahs.map((ayah, i) => ({
                number: ayah.numberInSurah,
                arabic: ayah.text,
                english: englishData.data.ayahs[i]?.text || '',
                audio: audioData.data.ayahs[i]?.audio || ''
            }));

            // Play first ayah
            if (this.playlist.length > 0) {
                this.playAyah(0);
            }

            this.showNotification(`تم تحميل ${surah.name}`, 'success');
            this.updateFloatingButtonState();

        } catch (error) {
            console.error('Error loading surah:', error);
            this.showNotification('خطأ في تحميل السورة', 'error');
            this.hideFloatingButton();
        }
    }

    playAyah(index) {
        if (!this.playlist[index] || !this.playlist[index].audio) {
            this.showNotification('لا يوجد ملف صوتي لهذه الآية', 'error');
            this.hideFloatingButton();
            return;
        }

        this.currentAyah = index;
        const ayah = this.playlist[index];

        // Update audio source
        this.audio.src = ayah.audio;
        this.audio.play().catch(error => {
            console.error('Error playing audio:', error);
            this.showNotification('خطأ في تشغيل الملف الصوتي', 'error');
            this.hideFloatingButton();
        });

        // Update UI
        this.updateCurrentAyahInfo(ayah);
        this.markActiveAyah(index);
        this.scrollToActiveAyah(index);
        this.updateFloatingButtonState();
    }

    togglePlayPause() {
        if (!this.currentSurah) {
            this.showNotification('يرجى اختيار سورة أولاً', 'info');
            this.hideFloatingButton();
            return;
        }

        if (this.audio.paused) {
            if (this.currentAyah === 0 && !this.audio.src) {
                this.playAyah(0);
            } else {
                this.audio.play();
            }
        } else {
            this.audio.pause();
        }
    }

    nextAyah() {
        if (this.currentAyah < this.playlist.length - 1) {
            this.playAyah(this.currentAyah + 1);
        } else {
            this.showNotification('انتهت السورة', 'info');
            this.hideFloatingButton();
        }
    }

    previousAyah() {
        if (this.currentAyah > 0) {
            this.playAyah(this.currentAyah - 1);
        } else {
            this.showNotification('أنت في أول آية', 'info');
        }
    }

    seekTo(percent) {
        if (this.audio.duration) {
            this.audio.currentTime = this.audio.duration * percent;
        }
    }

    setVolume(volume) {
        this.volume = volume;
        this.audio.volume = volume;
        this.saveSettings();
    }

    setPlaybackRate(rate) {
        this.playbackRate = rate;
        this.audio.playbackRate = rate;
        this.saveSettings();
    }

    setReciter(reciter) {
        this.currentReciter = reciter;
        this.saveSettings();

        if (this.currentSurah) {
            this.loadSurah(this.surahs.findIndex(s => s.number === this.currentSurah.number));
        }
    }

    toggleExpanded() {
        const container = document.getElementById('quranPlayerContainer');
        const fullPlayer = document.getElementById('fullPlayer');
        const expandIcon = document.getElementById('expandIcon');

        this.isExpanded = !this.isExpanded;

        if (this.isExpanded) {
            container.classList.add('active', 'show');
            container.classList.remove('hide');
            fullPlayer.style.display = 'block';
            expandIcon.className = 'bi bi-chevron-down';
            this.hideFloatingButton();
        } else {
            container.classList.remove('active', 'show');
            container.classList.add('hide');
            fullPlayer.style.display = 'none';
            expandIcon.className = 'bi bi-chevron-up';
            
            // Hide container after animation
            setTimeout(() => {
                if (!this.isExpanded) {
                    container.style.display = 'none';
                }
            }, 400);
            
            this.updateFloatingButtonState();
        }
    }

    updatePlayerInfo(surah) {
        const miniTitle = document.getElementById('miniTitle');
        const miniSubtitle = document.getElementById('miniSubtitle');
        const playerTitle = document.getElementById('playerTitle');
        const playerSubtitle = document.getElementById('playerSubtitle');

        miniTitle.textContent = surah.name;
        miniSubtitle.textContent = `${surah.englishName} - ${surah.numberOfAyahs} آية`;
        playerTitle.textContent = surah.name;
        playerSubtitle.textContent = `${surah.englishName} - ${surah.numberOfAyahs} آية`;
    }

    updateCurrentAyahInfo(ayah) {
        const miniSubtitle = document.getElementById('miniSubtitle');
        const playerSubtitle = document.getElementById('playerSubtitle');

        miniSubtitle.textContent = `الآية ${ayah.number}`;
        playerSubtitle.textContent = `الآية ${ayah.number} - ${ayah.english}`;
    }

    updateProgress() {
        if (!this.audio.duration) return;

        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        const progressFill = document.getElementById('progressFill');
        const currentTime = document.getElementById('currentTime');

        progressFill.style.width = progress + '%';
        currentTime.textContent = this.formatTime(this.audio.currentTime);
    }

    updateTotalTime() {
        const totalTime = document.getElementById('totalTime');
        totalTime.textContent = this.formatTime(this.audio.duration);
    }

    updatePlayButton() {
        const playIcon = document.getElementById('playIcon');
        const miniPlayIcon = document.getElementById('miniPlayIcon');
        const container = document.getElementById('quranPlayerContainer');

        if (this.isPlaying) {
            playIcon.className = 'bi bi-pause-circle-fill';
            miniPlayIcon.className = 'bi bi-pause-circle-fill';
            container.classList.add('playing');
        } else {
            playIcon.className = 'bi bi-play-circle-fill';
            miniPlayIcon.className = 'bi bi-play-circle-fill';
            container.classList.remove('playing');
        }
    }

    markActiveSurah(index) {
        const items = document.querySelectorAll('.playlist-item');
        items.forEach((item, i) => {
            if (i === index) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    markActiveAyah(index) {
        // This would be used if we had individual ayah items in the playlist
        // For now, we'll just update the current ayah display
    }

    scrollToActiveAyah(index) {
        // Scroll to active ayah if we had a detailed ayah list
    }

    toggleFavorite() {
        if (!this.currentSurah) {
            this.hideFloatingButton();
            return;
        }

        const favorite = {
            surahNumber: this.currentSurah.number,
            surahName: this.currentSurah.name,
            ayahNumber: this.currentAyah + 1,
            timestamp: new Date().toISOString()
        };

        let favorites = JSON.parse(localStorage.getItem('quran-favorites') || '[]');
        const existingIndex = favorites.findIndex(f =>
            f.surahNumber === favorite.surahNumber && f.ayahNumber === favorite.ayahNumber
        );

        if (existingIndex !== -1) {
            favorites.splice(existingIndex, 1);
            this.showNotification('تم إزالة من المفضلة', 'info');
        } else {
            favorites.push(favorite);
            this.showNotification('تم إضافة للمفضلة', 'success');
        }

        localStorage.setItem('quran-favorites', JSON.stringify(favorites));
        this.updateFavoriteIcon();
    }

    updateFavoriteIcon() {
        if (!this.currentSurah) {
            this.hideFloatingButton();
            return;
        }

        const favoriteIcon = document.getElementById('favoriteIcon');
        const favoriteBtn = document.querySelector('.favorite-btn');
        const favorites = JSON.parse(localStorage.getItem('quran-favorites') || '[]');
        const isFavorite = favorites.some(f =>
            f.surahNumber === this.currentSurah.number && f.ayahNumber === this.currentAyah + 1
        );

        favoriteIcon.className = isFavorite ? 'bi bi-heart-fill' : 'bi bi-heart';
        if (favoriteBtn) {
            favoriteBtn.classList.toggle('active', isFavorite);
        }
    }

    downloadAyah() {
        if (!this.currentSurah || !this.playlist[this.currentAyah]) {
            this.showNotification('لا توجد آية للتحميل', 'warning');
            return;
        }

        const ayah = this.playlist[this.currentAyah];
        const audioUrl = ayah.audio;
        
        if (!audioUrl) {
            this.showNotification('رابط التحميل غير متوفر', 'error');
            return;
        }

        // Create a temporary link element to trigger download
        const link = document.createElement('a');
        link.href = audioUrl;
        link.download = `سورة_${this.currentSurah.name}_آية_${this.currentAyah + 1}.mp3`;
        link.target = '_blank';
        
        // Add to DOM, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('جاري تحميل الآية...', 'success');
    }

    share() {
        if (!this.currentSurah) {
            this.hideFloatingButton();
            return;
        }

        const shareData = {
            title: `سورة ${this.currentSurah.name}`,
            text: `أستمع إلى سورة ${this.currentSurah.name} - الآية ${this.currentAyah + 1}`,
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData).catch(() => {
                this.hideFloatingButton();
            });
        } else {
            // Fallback to clipboard
            const text = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
            navigator.clipboard.writeText(text).then(() => {
                this.showNotification('تم نسخ الرابط', 'success');
            }).catch(() => {
                this.hideFloatingButton();
            });
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `player-notification ${type}`;
        notification.innerHTML = `
            <i class="bi ${type === 'success' ? 'bi-check-circle' : type === 'error' ? 'bi-exclamation-circle' : type === 'warning' ? 'bi-exclamation-triangle' : 'bi-info-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) {
            this.hideFloatingButton();
            return '00:00';
        }
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    loadSettings() {
        const savedVolume = localStorage.getItem('quran-volume');
        const savedSpeed = localStorage.getItem('quran-speed');
        const savedReciter = localStorage.getItem('quran-reciter');

        if (savedVolume) {
            this.setVolume(parseFloat(savedVolume));
            document.getElementById('volumeSlider').value = savedVolume * 100;
        }

        if (savedSpeed) {
            this.setPlaybackRate(parseFloat(savedSpeed));
            document.getElementById('speedSelect').value = savedSpeed;
        }

        if (savedReciter) {
            this.currentReciter = savedReciter;
            document.getElementById('reciterSelect').value = savedReciter;
        }

        // Hide floating button initially
        this.hideFloatingButton();
        
        // Hide player container initially
        const container = document.getElementById('quranPlayerContainer');
        if (container) {
            container.classList.add('hide');
            container.classList.remove('show', 'active');
        }
    }

    saveSettings() {
        localStorage.setItem('quran-volume', this.volume);
        localStorage.setItem('quran-speed', this.playbackRate);
        localStorage.setItem('quran-reciter', this.currentReciter);

        // Hide floating button if no surah is loaded
        if (!this.currentSurah) {
            this.hideFloatingButton();
        }
    }

    // Public methods for external access
    playSurah(surahIndex) {
        this.loadSurah(surahIndex);
        this.updateFloatingButtonState();
    }

    getCurrentSurah() {
        return this.currentSurah;
    }

    isCurrentlyPlaying() {
        return this.isPlaying;
    }

    showFloatingButton() {
        const floatingBtn = document.getElementById('floatingPlayerBtn');
        if (floatingBtn && this.currentSurah && this.isPlaying) {
            floatingBtn.classList.add('show', 'playing');
        }
    }

    hideFloatingButton() {
        const floatingBtn = document.getElementById('floatingPlayerBtn');
        if (floatingBtn) {
            floatingBtn.classList.remove('show', 'playing');
        }
    }

    updateFloatingButtonState() {
        const floatingBtn = document.getElementById('floatingPlayerBtn');
        if (floatingBtn && this.currentSurah && this.isPlaying) {
            floatingBtn.classList.add('show');
            floatingBtn.classList.add('playing');
        } else {
            this.hideFloatingButton();
        }
    }
}

    // Initialize player when DOM is loaded
    let quranPlayer;
    document.addEventListener('DOMContentLoaded', () => {
        quranPlayer = new SoundCloudQuranPlayer();
        
        // Hide floating button initially
        setTimeout(() => {
            if (quranPlayer) {
                quranPlayer.hideFloatingButton();
            }
        }, 1000);
        
        // Hide floating button on page load
        const floatingBtn = document.getElementById('floatingPlayerBtn');
        if (floatingBtn) {
            floatingBtn.classList.remove('show', 'playing');
        }
        
        // Hide floating button on window focus
        window.addEventListener('focus', () => {
            if (quranPlayer) {
                quranPlayer.updateFloatingButtonState();
            }
        });
        
        // Hide floating button on window blur
        window.addEventListener('blur', () => {
            if (quranPlayer) {
                quranPlayer.updateFloatingButtonState();
            }
        });
        
        // Hide floating button on page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && quranPlayer) {
                quranPlayer.hideFloatingButton();
            } else if (quranPlayer) {
                quranPlayer.updateFloatingButtonState();
            }
        });
        
        // Hide floating button on resize
        window.addEventListener('resize', () => {
            if (quranPlayer) {
                quranPlayer.updateFloatingButtonState();
            }
        });
        
        // Hide floating button on scroll
        window.addEventListener('scroll', () => {
            if (quranPlayer) {
                quranPlayer.updateFloatingButtonState();
            }
        });
        
        // Hide floating button on click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.quran-player-container') && 
                !e.target.closest('.floating-player-btn') && 
                quranPlayer) {
                quranPlayer.updateFloatingButtonState();
            }
        });
        
        // Hide floating button on touch start
        document.addEventListener('touchstart', (e) => {
            if (!e.target.closest('.quran-player-container') && 
                !e.target.closest('.floating-player-btn') && 
                quranPlayer) {
                quranPlayer.updateFloatingButtonState();
            }
        });
        
        // Hide floating button on touch end
        document.addEventListener('touchend', (e) => {
            if (!e.target.closest('.quran-player-container') && 
                !e.target.closest('.floating-player-btn') && 
                quranPlayer) {
                quranPlayer.updateFloatingButtonState();
            }
        });
        
        // Hide floating button on touch move
        document.addEventListener('touchmove', (e) => {
            if (!e.target.closest('.quran-player-container') && 
                !e.target.closest('.floating-player-btn') && 
                quranPlayer) {
                quranPlayer.updateFloatingButtonState();
            }
        });
        
        // Hide floating button on touch cancel
        document.addEventListener('touchcancel', (e) => {
            if (!e.target.closest('.quran-player-container') && 
                !e.target.closest('.floating-player-btn') && 
                quranPlayer) {
                quranPlayer.updateFloatingButtonState();
            }
        });
        
        // Hide floating button on context menu
        document.addEventListener('contextmenu', (e) => {
            if (!e.target.closest('.quran-player-container') && 
                !e.target.closest('.floating-player-btn') && 
                quranPlayer) {
                quranPlayer.updateFloatingButtonState();
            }
        });
        
        // Hide floating button on keydown
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && quranPlayer) {
                quranPlayer.hideFloatingButton();
            }
        });
        
        // Hide floating button on beforeunload
        window.addEventListener('beforeunload', () => {
            if (quranPlayer) {
                quranPlayer.hideFloatingButton();
            }
        });
        
        // Hide floating button on unload
        window.addEventListener('unload', () => {
            if (quranPlayer) {
                quranPlayer.hideFloatingButton();
            }
        });
        
        // Hide floating button on pagehide
        window.addEventListener('pagehide', () => {
            if (quranPlayer) {
                quranPlayer.hideFloatingButton();
            }
        });
        
        // Hide floating button on pageshow
        window.addEventListener('pageshow', () => {
            if (quranPlayer) {
                quranPlayer.updateFloatingButtonState();
            }
        });
        
        // Hide floating button on popstate
        window.addEventListener('popstate', () => {
            if (quranPlayer) {
                quranPlayer.updateFloatingButtonState();
            }
        });
        
        // Hide floating button on hashchange
        window.addEventListener('hashchange', () => {
            if (quranPlayer) {
                quranPlayer.updateFloatingButtonState();
            }
        });
        
        // Hide floating button on storage
        window.addEventListener('storage', () => {
            if (quranPlayer) {
                quranPlayer.updateFloatingButtonState();
            }
        });
        
        // Hide floating button on message
        window.addEventListener('message', () => {
            if (quranPlayer) {
                quranPlayer.updateFloatingButtonState();
            }
        });
        
        // Hide floating button on error
        window.addEventListener('error', () => {
            if (quranPlayer) {
                quranPlayer.hideFloatingButton();
            }
        });
        
        // Hide floating button on offline
        window.addEventListener('offline', () => {
            if (quranPlayer) {
                quranPlayer.hideFloatingButton();
            }
        });
        
        // Hide floating button on online
        window.addEventListener('online', () => {
            if (quranPlayer) {
                quranPlayer.updateFloatingButtonState();
            }
        });
        
        // Hide floating button on load
        window.addEventListener('load', () => {
            if (quranPlayer) {
                quranPlayer.updateFloatingButtonState();
            }
        });
        
        // Hide floating button on DOMContentLoaded
        document.addEventListener('DOMContentLoaded', () => {
            if (quranPlayer) {
                quranPlayer.updateFloatingButtonState();
            }
        });
    });

// Global functions for external access
function playSurah(surahIndex) {
    if (quranPlayer) {
        quranPlayer.playSurah(surahIndex);
    } else {
        // Hide floating button if player is not initialized
        const floatingBtn = document.getElementById('floatingPlayerBtn');
        if (floatingBtn) {
            floatingBtn.classList.remove('show', 'playing');
        }
    }
}

function showPlayer() {
    if (quranPlayer) {
        // Show the player container first
        const container = document.getElementById('quranPlayerContainer');
        if (container) {
            container.style.display = 'block';
            container.classList.remove('hide');
            container.classList.add('show');
        }
        // Then expand it
        quranPlayer.toggleExpanded();
    } else {
        // Hide floating button if player is not initialized
        const floatingBtn = document.getElementById('floatingPlayerBtn');
        if (floatingBtn) {
            floatingBtn.classList.remove('show', 'playing');
        }
    }
}
