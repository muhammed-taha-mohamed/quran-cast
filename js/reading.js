// ====== Reading Page JavaScript ======

let surahs = [];
let currentSurah = null;
let currentAyahs = [];
let showTafsirState = true;
let showTranslationState = true;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    loadSurahs();
    loadFontPreferences();
});

// Load surahs from API
async function loadSurahs() {
    try {
        const res = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await res.json();
        surahs = data.data;
        renderSurahList(surahs);
    } catch (error) {
        console.error('Error loading surahs:', error);
        showSurahListError();
    }
}

// Render surah list
function renderSurahList(list) {
    const surahList = document.getElementById('surahList');
    if (!surahList) return;

    surahList.innerHTML = '';
    list.forEach(s => {
        const row = document.createElement('div');
        row.className = 'item';
        row.innerHTML = `
            <div class="num">${s.number}</div>
            <div class="content">
                <h4>${s.name}</h4>
                <p>${s.englishName} · ${s.revelationType}</p>
            </div>
            <div class="ayah-count">${s.numberOfAyahs} آية</div>
        `;
        row.addEventListener('click', () => selectSurahForReading(s.number - 1));
        surahList.appendChild(row);
    });
}

// Show surah list error
function showSurahListError() {
    const surahList = document.getElementById('surahList');
    if (surahList) {
        surahList.innerHTML = `
            <div class="content" style="color:tomato; text-align:center; padding:20px;">
                تعذّر تحميل قائمة السور. تأكد من الاتصال بالإنترنت.
                <br><br>
                <button class="btn btn-primary" onclick="loadSurahs()">
                    <i class="bi bi-arrow-clockwise me-2"></i>إعادة المحاولة
                </button>
            </div>
        `;
    }
}

// Select surah for reading
async function selectSurahForReading(index) {
    const surah = surahs[index];
    if (!surah) return;

    currentSurah = surah;

    // Update reading section title
    const readingTitle = document.getElementById('readingTitle');
    if (readingTitle) {
        readingTitle.textContent = `${surah.number}. ${surah.name}`;
    }

    // Show loading state
    const readingList = document.getElementById('readingList');
    if (readingList) {
        readingList.innerHTML = `
            <div class="loading-state text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">جاري التحميل...</span>
                </div>
                <p class="mt-3">جاري تحميل السورة...</p>
            </div>
        `;
    }

    try {
        // Load Arabic text and English translation
        const [arRes, enRes] = await Promise.all([
            fetch(`https://api.alquran.cloud/v1/surah/${surah.number}`),
            fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/en.pickthall`)
        ]);

        const [ar, en] = await Promise.all([arRes.json(), enRes.json()]);

        // Load tafsir for each ayah
        const ayahs = await Promise.all(ar.data.ayahs.map(async (a, i) => {
            try {
                const tafsirRes = await fetch(`https://api.alquran.cloud/v1/ayah/${a.number}/ar.muyassar`);
                const tafsirData = await tafsirRes.json();
                const tafsir = tafsirData.data?.text || '';

                return {
                    aya: a.numberInSurah,
                    text: a.text,
                    en: en.data.ayahs[i]?.text || '',
                    tafsir: tafsir
                };
            } catch (tafsirError) {
                console.log(`Could not load tafsir for ayah ${a.number}:`, tafsirError);
                return {
                    aya: a.numberInSurah,
                    text: a.text,
                    en: en.data.ayahs[i]?.text || '',
                    tafsir: ''
                };
            }
        }));

        currentAyahs = ayahs;
        renderAyahsForReading(ayahs);

        // Switch to reading mode
        showReadingMode();

    } catch (error) {
        console.error('Error loading surah for reading:', error);
        const readingList = document.getElementById('readingList');
        if (readingList) {
            readingList.innerHTML = `
                <div class="content" style="color:tomato; text-align:center; padding:20px;">
                    تعذّر تحميل البيانات. تأكد من الاتصال بالإنترنت.
                    <br><br>
                    <button class="btn btn-primary" onclick="selectSurahForReading(${index})">
                        <i class="bi bi-arrow-clockwise me-2"></i>إعادة المحاولة
                    </button>
                </div>
            `;
        }
    }
}

// Render ayahs for reading
function renderAyahsForReading(ayahs) {
    const readingList = document.getElementById('readingList');
    if (!readingList) return;

    readingList.innerHTML = '';
    ayahs.forEach((a, i) => {
        const ayahItem = document.createElement('div');
        ayahItem.className = 'ayah-item';
        ayahItem.dataset.index = i;

        let content = `
            <div class="ayah-text">${a.text} (${i + 1})</div>`;

        // Show translation if enabled
        if (showTranslationState && a.en) {
            content += `
                <div class="ayah-translation">
                    <p>${a.en}</p>
                </div>`;
        }

        // Show tafsir if enabled
        if (showTafsirState && a.tafsir) {
            content += `
                <div class="ayah-tafsir">
                    <p>${a.tafsir}</p>
                </div>`;
        }

        ayahItem.innerHTML = content;
        readingList.appendChild(ayahItem);
    });
}

// Search in surahs
function searchInSurahs(query) {
    if (!query.trim()) {
        renderSurahList(surahs);
        return;
    }

    const filtered = surahs.filter(s =>
        `${s.number}`.includes(query) ||
        s.name.includes(query) ||
        s.englishName.toLowerCase().includes(query.toLowerCase())
    );

    renderSurahList(filtered);
}

// Toggle tafsir display
function toggleTafsir() {
    showTafsirState = !showTafsirState;
    const btn = document.getElementById('showTafsir');
    if (btn) {
        if (showTafsirState) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }

    // Update reading list
    if (currentAyahs.length > 0) {
        renderAyahsForReading(currentAyahs);
    }
}

// Toggle translation display
function toggleTranslation() {
    showTranslationState = !showTranslationState;
    const btn = document.getElementById('showTranslation');
    if (btn) {
        if (showTranslationState) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }

    // Update reading list
    if (currentAyahs.length > 0) {
        renderAyahsForReading(currentAyahs);
    }
}

// Update control buttons
function updateControlButtons() {
    const tafsirBtn = document.getElementById('showTafsir');
    const translationBtn = document.getElementById('showTranslation');

    if (tafsirBtn) {
        if (showTafsirState) {
            tafsirBtn.classList.add('active');
        } else {
            tafsirBtn.classList.remove('active');
        }
    }

    if (translationBtn) {
        if (showTranslationState) {
            translationBtn.classList.add('active');
        } else {
            translationBtn.classList.remove('active');
        }
    }
}

// Font size controls
function increaseFontSize() {
    const readingSection = document.getElementById('readingSection');
    if (!readingSection) return;

    const currentSize = parseInt(window.getComputedStyle(readingSection).fontSize) || 16;
    const newSize = Math.min(currentSize + 2, 24);
    readingSection.style.fontSize = newSize + 'px';

    // Save to localStorage
    localStorage.setItem('qc-font-size', newSize);
}

function decreaseFontSize() {
    const readingSection = document.getElementById('readingSection');
    if (!readingSection) return;

    const currentSize = parseInt(window.getComputedStyle(readingSection).fontSize) || 16;
    const newSize = Math.max(currentSize - 2, 12);
    readingSection.style.fontSize = newSize + 'px';

    // Save to localStorage
    localStorage.setItem('qc-font-size', newSize);
}

// Load font preferences
function loadFontPreferences() {
    const readingSection = document.getElementById('readingSection');
    if (!readingSection) return;

    const savedSize = localStorage.getItem('qc-font-size');
    if (savedSize) {
        readingSection.style.fontSize = savedSize + 'px';
    }

    // Load other preferences
    const savedTafsir = localStorage.getItem('qc-show-tafsir');
    if (savedTafsir !== null) {
        showTafsirState = savedTafsir === 'true';
    }

    const savedTranslation = localStorage.getItem('qc-show-translation');
    if (savedTranslation !== null) {
        showTranslationState = savedTranslation === 'true';
    }

    updateControlButtons();
}

// Apply font size to all ayahs
function applyFontSizeToAllAyahs(size) {
    const ayahItems = document.querySelectorAll('.ayah-item');
    ayahItems.forEach(item => {
        item.style.fontSize = size + 'px';
    });
}

// Theme functions
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        if (theme === 'dark') {
            themeIcon.className = 'bi bi-sun-fill';
            themeIcon.title = 'الوضع النهاري';
        } else {
            themeIcon.className = 'bi bi-moon-fill';
            themeIcon.title = 'الوضع المظلم';
        }
    }
}

// Navigation functions
function goToHome() {
    window.location.href = 'index.html';
}

function goToMainPage() {
    window.location.href = 'index.html';
}

// Show surah list
function showSurahList() {
    document.getElementById('surahListSection').style.display = 'block';
    document.getElementById('readingSection').style.display = 'none';
}

// Show reading mode
function showReadingMode() {
    document.getElementById('surahListSection').style.display = 'none';
    document.getElementById('readingSection').style.display = 'block';
}

// Setup search functionality
document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('surahSearch');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            const query = searchInput.value.trim();

            searchTimeout = setTimeout(() => {
                searchInSurahs(query);
            }, 300);
        });
    }
});
