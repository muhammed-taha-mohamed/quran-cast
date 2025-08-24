// ====== Player Page JavaScript ======

let surahs = [];
let current = { surahIndex: -1, ayahIndex: -1, playlist: [] };
let audioPlayer = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Player page loaded');

    // Initialize theme
    initializeTheme();

    // Initialize audio player
    initializeAudioPlayer();

    // Load surahs first
    await loadSurahs();

    // Check if surah was selected from home page
    const selectedSurah = localStorage.getItem('qc-selected-surah');
    if (selectedSurah) {
        try {
            const surahData = JSON.parse(selectedSurah);
            console.log('Loading selected surah:', surahData);

            current.surahIndex = surahData.index;
            await loadSurahForPlayer(surahData.index);

            // Clear the selection after loading
            localStorage.removeItem('qc-selected-surah');
        } catch (error) {
            console.error('Error loading selected surah:', error);
            showSelectSurahMessage();
        }
    } else {
        showSelectSurahMessage();
    }

    // Initialize additional controls
    initializeAdditionalControls();
});

// Load surahs from API
async function loadSurahs() {
    try {
        const res = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await res.json();
        surahs = data.data;
        console.log('Surahs loaded:', surahs.length);
    } catch (error) {
        console.error('Error loading surahs:', error);
    }
}

// Show message to select surah
function showSelectSurahMessage() {
    const playerList = document.getElementById('playerList');
    const currentSurahName = document.getElementById('currentSurahName');

    if (currentSurahName) {
        currentSurahName.textContent = 'اختر سورة للاستماع';
    }

    // Update current ayah display
    updateCurrentAyahDisplay('', '--', 'اختر سورة للبدء في الاستماع', 'يرجى العودة للصفحة الرئيسية واختيار سورة');

    if (playerList) {
        playerList.innerHTML = `
            <div class="select-surah-message">
                <div class="message-content">
                    <div class="message-icon">
                        <i class="bi bi-music-note"></i>
                    </div>
                    <h3>اختر سورة للاستماع</h3>
                    <p>يرجى العودة للصفحة الرئيسية واختيار سورة</p>
                    <a href="index.html" class="btn btn-primary">
                        <i class="bi bi-house me-2"></i>العودة للصفحة الرئيسية
                    </a>
                </div>
            </div>
        `;
    }
}

// Load surah for player
async function loadSurahForPlayer(index) {
    const surah = surahs[index];
    if (!surah) {
        console.error('Surah not found for index:', index);
        showSelectSurahMessage();
        return;
    }

    console.log('Loading surah for player:', surah.name);

    // Update player info
    const currentSurahName = document.getElementById('currentSurahName');
    if (currentSurahName) {
        currentSurahName.textContent = surah.name;
    }

    // Update current ayah display
    updateCurrentAyahDisplay(surah.name, 'عدد الآيات: ' + surah.numberOfAyahs, 'اختر آية للاستماع');

    try {
        // Show loading state
        const playerList = document.getElementById('playerList');
        if (playerList) {
            playerList.innerHTML = `
                <div class="loading-state">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">جاري التحميل...</span>
                    </div>
                    <p class="mt-3">جاري تحميل السورة والملفات الصوتية...</p>
                </div>
            `;
        }

        // Get current reciter
        const currentReciter = getCurrentReciter();
        console.log('Loading with reciter:', currentReciter);

        // Load Arabic text, English translation, and audio
        const [arRes, enRes, audioRes] = await Promise.all([
            fetch(`https://api.alquran.cloud/v1/surah/${surah.number}`),
            fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/en.pickthall`),
            fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/${currentReciter}`)
        ]);

        if (!audioRes.ok) {
            throw new Error(`Audio API error: ${audioRes.status}`);
        }

        const [ar, en, au] = await Promise.all([arRes.json(), enRes.json(), audioRes.json()]);

        if (!au.data || !au.data.ayahs || au.data.ayahs.length === 0) {
            throw new Error('No audio data available for this reciter');
        }

        console.log('Audio data loaded successfully:', au.data.ayahs.length, 'ayahs');

        // Prepare ayahs with audio
        const ayahs = ar.data.ayahs.map((a, i) => ({
            aya: a.numberInSurah,
            text: a.text,
            en: en.data.ayahs[i]?.text || '',
            audio: au.data.ayahs[i]?.audio
        }));

        current.playlist = ayahs;
        current.ayahIndex = 0;
        renderAyahsForPlayer(ayahs);

        // Play first ayah automatically
        if (ayahs.length > 0 && ayahs[0].audio) {
            // Small delay to ensure UI is ready
            setTimeout(() => {
                current.ayahIndex = 0;
                playAyah(0);
            }, 500);
        }

    } catch (error) {
        console.error('Error loading surah for player:', error);

        // Try fallback to default reciter
        if (getCurrentReciter() !== 'ar.alafasy') {
            console.log('Falling back to default reciter...');
            const reciterSelect = document.getElementById('reciterSelect');
            if (reciterSelect) {
                reciterSelect.value = 'ar.alafasy';
            }
            await loadSurahForPlayer(index);
            return;
        }

        const playerList = document.getElementById('playerList');
        if (playerList) {
            playerList.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">
                        <i class="bi bi-exclamation-triangle text-danger"></i>
                    </div>
                    <h4>خطأ في التحميل</h4>
                    <p>تعذّر تحميل الملفات الصوتية. جرب قارئ آخر أو تأكد من الاتصال بالإنترنت.</p>
                    <button class="btn btn-primary" onclick="loadSurahForPlayer(${index})">
                        <i class="bi bi-arrow-clockwise me-2"></i>إعادة المحاولة
                    </button>
                </div>
            `;
        }
    }
}

// Render ayahs for player
function renderAyahsForPlayer(ayahs) {
    const playerList = document.getElementById('playerList');
    if (!playerList) return;

    playerList.innerHTML = '';

    ayahs.forEach((ayah, i) => {
        const ayahItem = document.createElement('div');
        ayahItem.className = 'ayah-item';
        ayahItem.dataset.index = i;

        ayahItem.innerHTML = `
            <div class="ayah-content" onclick="playAyah(${i})">
                <div class="ayah-number">${ayah.aya}</div>
                <div class="ayah-texts">
                    <div class="ayah-text">${ayah.text}</div>
                    <div class="ayah-translation">${ayah.en}</div>
                </div>
                <div class="ayah-controls">
                    <button class="play-btn" onclick="event.stopPropagation(); playAyah(${i})" title="تشغيل">
                        <i class="bi bi-play-fill"></i>
                    </button>
                </div>
            </div>
        `;

        playerList.appendChild(ayahItem);
    });
}

// Initialize audio player
function initializeAudioPlayer() {
    if (!audioPlayer) {
        audioPlayer = new Audio();
        audioPlayer.preload = 'none';

        // Add event listeners
        audioPlayer.addEventListener('timeupdate', updateProgress);
        audioPlayer.addEventListener('ended', onAudioEnded);
        audioPlayer.addEventListener('loadedmetadata', onAudioLoaded);
        audioPlayer.addEventListener('error', onAudioError);
    }
}

// Update current ayah display
function updateCurrentAyahDisplay(surahName, ayahNumber, ayahText, translation = '') {
    const ayahNumberBadge = document.getElementById('ayahNumberBadge');
    const currentAyahText = document.getElementById('currentAyahText');
    const currentAyahTranslation = document.getElementById('currentAyahTranslation');

    if (ayahNumberBadge) {
        ayahNumberBadge.textContent = ayahNumber || '--';
    }

    if (currentAyahText) {
        currentAyahText.textContent = ayahText || 'اختر سورة للبدء في الاستماع';
    }

    if (currentAyahTranslation) {
        currentAyahTranslation.textContent = translation || '--';
    }
}

// Play ayah
function playAyah(index) {
    const ayah = current.playlist[index];
    if (!ayah || !ayah.audio) {
        console.error('No audio available for ayah:', index);
        return;
    }

    console.log('Playing ayah:', index, 'Audio URL:', ayah.audio);

    current.ayahIndex = index;

    // Update current ayah display
    updateCurrentAyahDisplay(
        surahs[current.surahIndex]?.name,
        ayah.aya,
        ayah.text,
        ayah.en
    );

    // Update UI
    markActiveAyah(index);
    updatePlayButtonIcon(true);

    // Auto-scroll to active ayah
    scrollToActiveAyah(index);

    // Load and play audio
    audioPlayer.src = ayah.audio;
    audioPlayer.play().catch(error => {
        console.error('Error playing audio:', error);
        updatePlayButtonIcon(false);
    });
}

// Mark active ayah
function markActiveAyah(index) {
    const playerList = document.getElementById('playerList');
    if (!playerList) return;

    // Remove active class from all items
    const items = playerList.querySelectorAll('.ayah-item');
    items.forEach((item, i) => {
        if (i === index) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Auto-scroll to active ayah
function scrollToActiveAyah(index) {
    const playerList = document.getElementById('playerList');
    if (!playerList) return;

    const activeItem = playerList.querySelector(`[data-index="${index}"]`);
    if (activeItem) {
        // Calculate scroll position to center the ayah
        const containerHeight = playerList.clientHeight;
        const itemHeight = activeItem.offsetHeight;
        const itemTop = activeItem.offsetTop;
        const scrollTop = itemTop - (containerHeight / 2) + (itemHeight / 2);

        playerList.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
        });
    }
}

// Audio event handlers
function updateProgress() {
    if (!audioPlayer || !audioPlayer.duration) return;

    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = progress + '%';
    }

    // Update time display
    const currentTimeEl = document.getElementById('currentTime');
    const totalTimeEl = document.getElementById('totalTime');
    if (currentTimeEl) currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    if (totalTimeEl) totalTimeEl.textContent = formatTime(audioPlayer.duration);
}

function onAudioEnded() {
    console.log('Audio ended, moving to next ayah...');

    // Auto-play next ayah
    if (current.ayahIndex < current.playlist.length - 1) {
        nextAyah();
    } else if (repeatMode) {
        // If repeat is enabled, start from beginning
        current.ayahIndex = -1;
        nextAyah();
    } else {
        // End of surah
        updatePlayButtonIcon(false);
        markActiveAyah(-1);
        showNotification('انتهت السورة', 'info');
    }
}

function onAudioLoaded() {
    updateProgress();
}

function onAudioError() {
    console.error('Audio error occurred');
    updatePlayButtonIcon(false);
}

// Player controls
function togglePlayPause() {
    if (!audioPlayer) return;

    if (audioPlayer.paused) {
        // If no ayah is currently selected, start from the beginning
        if (current.ayahIndex === -1 && current.playlist.length > 0) {
            current.ayahIndex = 0;
            playAyah(0);
        } else {
            audioPlayer.play().catch(error => {
                console.error('Error playing audio:', error);
            });
            updatePlayButtonIcon(true);
        }
    } else {
        audioPlayer.pause();
        updatePlayButtonIcon(false);
    }
}

function nextAyah() {
    const nextIndex = current.ayahIndex + 1;
    if (nextIndex < current.playlist.length) {
        playAyah(nextIndex);
    } else {
        // End of surah
        current.ayahIndex = 0;
        updatePlayButtonIcon(false);
        markActiveAyah(-1); // Remove active state
    }
}

function previousAyah() {
    const prevIndex = current.ayahIndex - 1;
    if (prevIndex >= 0) {
        playAyah(prevIndex);
    }
}

// Update play button icon
function updatePlayButtonIcon(isPlaying) {
    const playIcon = document.getElementById('playIcon');
    if (playIcon) {
        if (isPlaying) {
            playIcon.className = 'bi bi-pause-fill';
        } else {
            playIcon.className = 'bi bi-play-fill';
        }
    }
}

// Get current reciter
function getCurrentReciter() {
    const reciterSelect = document.getElementById('reciterSelect');
    if (!reciterSelect) return 'ar.alafasy';

    const reciterMap = {
        'mishary': 'ar.alafasy',
        'sudais': 'ar.abdul_rahman_sudais',
        'ghamdi': 'ar.saad_al_ghamdi'
    };

    return reciterMap[reciterSelect.value] || 'ar.alafasy';
}

// Change reciter
async function changeReciter() {
    const newReciter = getCurrentReciter();
    localStorage.setItem('qc-reciter', newReciter);

    // Update reciter display
    const currentReciterEl = document.getElementById('currentReciter');
    const reciterNames = {
        'ar.alafasy': 'مشاري العفاسي',
        'ar.abdul_rahman_sudais': 'عبد الرحمن السديس',
        'ar.saad_al_ghamdi': 'سعد الغامدي'
    };

    if (currentReciterEl) {
        currentReciterEl.textContent = reciterNames[newReciter] || newReciter;
    }

    // Reload current surah with new reciter
    if (current.surahIndex !== -1) {
        await loadSurahForPlayer(current.surahIndex);
        // Auto-play the first ayah after changing reciter
        setTimeout(() => {
            if (current.playlist.length > 0) {
                playAyah(0);
            }
        }, 1000);
    }
}

// Player action functions
function downloadAyah() {
    if (current.ayahIndex < 0 || !current.playlist[current.ayahIndex]) {
        console.log('No ayah selected for download');
        return;
    }

    const ayah = current.playlist[current.ayahIndex];
    if (!ayah.audio) {
        console.log('No audio available for download');
        return;
    }

    const surah = surahs[current.surahIndex];
    const surahName = surah ? surah.name : 'surah';
    const reciter = getCurrentReciter();
    const reciterName = reciter === 'ar.alafasy' ? 'mishary' : 'abdul_rahman';

    const downloadLink = document.createElement('a');
    downloadLink.href = ayah.audio;
    downloadLink.download = `${surahName}_${ayah.aya}_${reciterName}.mp3`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

function shareAyah() {
    if (current.ayahIndex < 0 || !current.playlist[current.ayahIndex]) {
        return;
    }

    const ayah = current.playlist[current.ayahIndex];
    const surah = surahs[current.surahIndex];

    if (!surah) return;

    const shareText = `سورة ${surah.name} - الآية ${ayah.aya}\n\n${ayah.text}\n\n${ayah.en}`;

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification('تم نسخ النص بنجاح!', 'success');
        }).catch(() => {
            fallbackCopyTextToClipboard(shareText);
        });
    } else {
        fallbackCopyTextToClipboard(shareText);
    }
}

function addToFavorites() {
    if (current.ayahIndex < 0 || !current.playlist[current.ayahIndex]) {
        return;
    }

    const ayah = current.playlist[current.ayahIndex];
    const surah = surahs[current.surahIndex];

    if (!surah) return;

    const favorite = {
        surahNumber: surah.number,
        surahName: surah.name,
        ayahNumber: ayah.aya,
        ayahText: ayah.text,
        ayahTranslation: ayah.en,
        reciter: getCurrentReciter(),
        timestamp: new Date().toISOString()
    };

    let favorites = JSON.parse(localStorage.getItem('quran-favorites') || '[]');

    const existingIndex = favorites.findIndex(fav =>
        fav.surahNumber === favorite.surahNumber &&
        fav.ayahNumber === favorite.ayahNumber
    );

    if (existingIndex !== -1) {
        favorites.splice(existingIndex, 1);
        localStorage.setItem('quran-favorites', JSON.stringify(favorites));
        showNotification('تم إزالة الآية من المفضلة', 'info');
    } else {
        favorites.push(favorite);
        localStorage.setItem('quran-favorites', JSON.stringify(favorites));
        showNotification('تم إضافة الآية للمفضلة', 'success');
    }
}

// Utility functions
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
        showNotification('تم نسخ النص بنجاح!', 'success');
    } catch (err) {
        showNotification('فشل في نسخ النص', 'error');
    }

    document.body.removeChild(textArea);
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="bi ${type === 'success' ? 'bi-check-circle-fill' : type === 'error' ? 'bi-exclamation-circle-fill' : 'bi-info-circle-fill'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Initialize theme
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// Theme toggle
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        if (newTheme === 'dark') {
            themeIcon.className = 'bi bi-sun-fill';
        } else {
            themeIcon.className = 'bi bi-moon-fill';
        }
    }
}

// Go back to home
function goToHome() {
    window.location.href = 'index.html';
}

// Initialize additional controls
function initializeAdditionalControls() {
    // Set default volume
    const volumeControl = document.getElementById('volumeControl');
    if (volumeControl && audioPlayer) {
        audioPlayer.volume = volumeControl.value / 100;
    }

    // Set default playback speed
    const playbackSpeed = document.getElementById('playbackSpeed');
    if (playbackSpeed && audioPlayer) {
        audioPlayer.playbackRate = parseFloat(playbackSpeed.value);
    }

    // Auto-start playing when controls are initialized
    if (current.playlist.length > 0 && current.ayahIndex === -1) {
        setTimeout(() => {
            current.ayahIndex = 0;
            playAyah(0);
        }, 1000);
    }

    // Auto-start playing if surah is already loaded
    if (current.playlist.length > 0 && current.ayahIndex >= 0) {
        setTimeout(() => {
            playAyah(current.ayahIndex);
        }, 500);
    }
}

// Change volume
function changeVolume() {
    const volumeControl = document.getElementById('volumeControl');
    if (volumeControl && audioPlayer) {
        audioPlayer.volume = volumeControl.value / 100;
        showNotification(`مستوى الصوت: ${volumeControl.value}%`, 'info');
    }
}

// Change playback speed
function changePlaybackSpeed() {
    const playbackSpeed = document.getElementById('playbackSpeed');
    if (playbackSpeed && audioPlayer) {
        audioPlayer.playbackRate = parseFloat(playbackSpeed.value);
        showNotification(`سرعة التشغيل: ${playbackSpeed.value}x`, 'info');
    }
}

// Stop audio
function stopAudio() {
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        updatePlayButtonIcon(false);
        markActiveAyah(-1);
        showNotification('تم إيقاف التشغيل', 'info');

        // Reset progress bar
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = '0%';
        }

        // Reset time display
        const currentTimeEl = document.getElementById('currentTime');
        const totalTimeEl = document.getElementById('totalTime');
        if (currentTimeEl) currentTimeEl.textContent = '00:00';
        if (totalTimeEl) totalTimeEl.textContent = '00:00';

        // Reset current ayah display
        if (current.playlist.length > 0 && current.ayahIndex >= 0) {
            const ayah = current.playlist[current.ayahIndex];
            updateCurrentAyahDisplay(
                surahs[current.surahIndex]?.name,
                ayah.aya,
                ayah.text,
                ayah.en
            );
        }
    }
}

// Toggle repeat
let repeatMode = false;
function toggleRepeat() {
    repeatMode = !repeatMode;
    const repeatBtn = document.getElementById('repeatBtn');

    if (repeatBtn) {
        if (repeatMode) {
            repeatBtn.classList.add('active');
            repeatBtn.style.background = 'var(--primary)';
            repeatBtn.style.color = 'white';
            showNotification('وضع التكرار مفعل', 'success');
        } else {
            repeatBtn.classList.remove('active');
            repeatBtn.style.background = 'var(--bg-elevated)';
            repeatBtn.style.color = 'var(--text)';
            showNotification('وضع التكرار معطل', 'info');
        }
    }
}

// Enhanced next ayah with repeat support
function nextAyah() {
    if (current.playlist.length === 0) return;

    current.ayahIndex++;

    if (current.ayahIndex >= current.playlist.length) {
        if (repeatMode) {
            // Repeat the surah
            current.ayahIndex = 0;
            showNotification('إعادة تشغيل السورة', 'info');
            // Auto-play the first ayah
            setTimeout(() => {
                playAyah(0);
            }, 1000);
        } else {
            // End of surah
            current.ayahIndex = current.playlist.length - 1;
            showNotification('انتهت السورة', 'info');
            updatePlayButtonIcon(false);
            markActiveAyah(-1);
            return;
        }
    }

    playAyah(current.ayahIndex);
}

// Enhanced previous ayah
function previousAyah() {
    if (current.playlist.length === 0) return;

    current.ayahIndex--;

    if (current.ayahIndex < 0) {
        if (repeatMode) {
            // Go to last ayah
            current.ayahIndex = current.playlist.length - 1;
            showNotification('الانتقال لآخر آية', 'info');
            // Auto-play the last ayah
            setTimeout(() => {
                playAyah(current.ayahIndex);
            }, 1000);
        } else {
            // Stay at first ayah
            current.ayahIndex = 0;
            showNotification('أنت في أول آية', 'info');
            return;
        }
    }

    playAyah(current.ayahIndex);
}
