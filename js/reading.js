// ====== Reading Page JavaScript ======

let surahs = [];
let quranData = null; // سيحتوي على بيانات القرآن من JSON
let current = { surahIndex: -1, ayahIndex: -1, playlist: [] };

// Reading mode controls
let showTafsirState = true;
let showTranslationState = false; // Hidden by default

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Reading page loaded');

    // Initialize theme
    initializeTheme();

    // Load Quran data from local JSON file first
    await loadQuranData();

    // Load surahs from local data
    await loadSurahs();

    // Check if surah was selected from home page
    const selectedSurah = localStorage.getItem('qc-selected-surah');
    if (selectedSurah) {
        try {
            const surahData = JSON.parse(selectedSurah);
            console.log('Loading selected surah:', surahData);

            current.surahIndex = surahData.index;
            await loadSurahForReading(surahData.index);

            // Clear the selection after loading
            localStorage.removeItem('qc-selected-surah');
        } catch (error) {
            console.error('Error loading selected surah:', error);
            showSelectSurahMessage();
        }
    } else {
        showSelectSurahMessage();
    }

    // Initialize controls
    updateControlButtons();

    // Test font controls
    console.log('Font controls initialized. Test with:');
    console.log('- increaseFontSize()');
    console.log('- decreaseFontSize()');
    console.log('- applyFontSizeToAllAyahs(20)');
});

// Load Quran data from local JSON file
async function loadQuranData() {
    try {
        console.log('Loading Quran data from local JSON file...');
        const response = await fetch('json/quran.json');
        quranData = await response.json();
        console.log('Quran data loaded successfully from local file');
        console.log('Total surahs found:', quranData.length || 'Unknown');
    } catch (error) {
        console.error('Error loading Quran data from local file:', error);
        // Fallback to API if local file fails
        await loadQuranDataFromAPI();
    }
}

// Fallback: Load Quran data from API if local file fails
async function loadQuranDataFromAPI() {
    try {
        console.log('Falling back to API for Quran data...');
        const res = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await res.json();
        quranData = data.data;
        console.log('Quran data loaded from API as fallback');
    } catch (error) {
        console.error('Error loading Quran data from API:', error);
        quranData = [];
    }
}

// Load surahs from local data
async function loadSurahs() {
    try {
        if (quranData && quranData.length > 0) {
            // Extract surah information from local data
            surahs = quranData.map((surah, index) => ({
                number: index + 1,
                name: surah.name || `سورة ${index + 1}`,
                englishName: surah.englishName || `Surah ${index + 1}`,
                englishNameTranslation: surah.englishNameTranslation || '',
                revelationType: surah.revelationType || 'Meccan',
                ayahs: surah.ayahs || []
            }));
            console.log('Surahs loaded from local data:', surahs.length);
        } else {
            // Fallback to API
            await loadSurahsFromAPI();
        }
    } catch (error) {
        console.error('Error loading surahs from local data:', error);
        // Fallback to API
        await loadSurahsFromAPI();
    }
}

// Fallback: Load surahs from API
async function loadSurahsFromAPI() {
    try {
        const res = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await res.json();
        surahs = data.data;
        console.log('Surahs loaded from API as fallback:', surahs.length);
    } catch (error) {
        console.error('Error loading surahs from API:', error);
        surahs = [];
    }
}

// Show message to select surah
function showSelectSurahMessage() {
    const readingList = document.getElementById('readingList');
    const readingTitle = document.getElementById('readingTitle');

    if (readingTitle) {
        readingTitle.textContent = 'اختر سورة للقراءة';
    }

    if (readingList) {
        readingList.innerHTML = `
            <div class="select-surah-message">
                <div class="message-content">
                    <div class="message-icon">
                        <i class="bi bi-book"></i>
                    </div>
                    <h3>اختر سورة للقراءة</h3>
                    <p>يرجى العودة للصفحة الرئيسية واختيار سورة</p>
                    <a href="index.html" class="btn btn-primary">
                        <i class="bi bi-house me-2"></i>العودة للصفحة الرئيسية
                    </a>
                </div>
            </div>
        `;
    }
}

// Load surah for reading from local data
async function loadSurahForReading(index) {
    const surah = surahs[index];
    if (!surah) {
        console.error('Surah not found for index:', index);
        showSelectSurahMessage();
        return;
    }

    console.log('Loading surah for reading:', surah.name);

    // Update reading section title
    const readingTitle = document.getElementById('readingTitle');
    if (readingTitle) {
        readingTitle.textContent = `${surah.number}. ${surah.name}`;
    }

    try {
        // Show loading state
        const readingList = document.getElementById('readingList');
        if (readingList) {
            readingList.innerHTML = `
                <div class="loading-state">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">جاري التحميل...</span>
                    </div>
                    <p class="mt-3">جاري تحميل السورة...</p>
                </div>
            `;
        }

        // Try to load from local data first
        let ayahs = [];

        if (quranData && quranData[index] && quranData[index].ayahs) {
            console.log('Loading ayahs from local JSON data...');
            ayahs = await loadAyahsFromLocalData(index);
        } else {
            console.log('Local data not available, falling back to API...');
            ayahs = await loadAyahsFromAPI(surah.number);
        }

        if (ayahs.length === 0) {
            throw new Error('No ayahs loaded');
        }

        current.playlist = ayahs;
        renderAyahsForReading(ayahs);

    } catch (error) {
        console.error('Error loading surah for reading:', error);
        const readingList = document.getElementById('readingList');
        if (readingList) {
            readingList.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">
                        <i class="bi bi-exclamation-triangle text-danger"></i>
                    </div>
                    <h4>خطأ في التحميل</h4>
                    <p>تعذّر تحميل السورة. تأكد من وجود ملف القرآن المحلي أو الاتصال بالإنترنت.</p>
                    <button class="btn btn-primary" onclick="loadSurahForReading(${index})">
                        <i class="bi bi-arrow-clockwise me-2"></i>إعادة المحاولة
                    </button>
                </div>
            `;
        }
    }
}

// Load ayahs from local JSON data
async function loadAyahsFromLocalData(surahIndex) {
    try {
        const surah = quranData[surahIndex];
        if (!surah || !surah.ayahs) {
            throw new Error('Surah data not found in local file');
        }

        const ayahs = surah.ayahs.map((ayah, index) => {
            // Extract text from different possible field names
            let text = '';
            if (ayah.text) {
                text = ayah.text;
            } else if (ayah.arabic) {
                text = ayah.arabic;
            } else if (ayah.arabicText) {
                text = ayah.arabicText;
            } else {
                text = `آية ${index + 1}`; // Fallback
            }

            // Extract translation if available
            let translation = '';
            if (ayah.translation) {
                translation = ayah.translation;
            } else if (ayah.english) {
                translation = ayah.english;
            } else if (ayah.englishText) {
                translation = ayah.englishText;
            }

            // Extract tafsir if available
            let tafsir = '';
            if (ayah.tafsir) {
                tafsir = ayah.tafsir;
            } else if (ayah.tafsirAr) {
                tafsir = ayah.tafsirAr;
            }

            return {
                aya: index + 1,
                text: text,
                en: translation,
                tafsir: tafsir
            };
        });

        console.log(`Loaded ${ayahs.length} ayahs from local data for surah ${surah.name}`);
        return ayahs;

    } catch (error) {
        console.error('Error loading ayahs from local data:', error);
        return [];
    }
}

// Fallback: Load ayahs from API
async function loadAyahsFromAPI(surahNumber) {
    try {
        console.log('Loading ayahs from API...');

        // Load Arabic text and English translation
        const [arRes, enRes] = await Promise.all([
            fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`),
            fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/en.pickthall`)
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

        console.log(`Loaded ${ayahs.length} ayahs from API for surah ${surahNumber}`);
        return ayahs;

    } catch (error) {
        console.error('Error loading ayahs from API:', error);
        return [];
    }
}

// Render ayahs for reading
function renderAyahsForReading(ayahs) {
    const readingList = document.getElementById('readingList');
    if (!readingList) return;

    readingList.innerHTML = '';

    ayahs.forEach((ayah, i) => {
        const ayahItem = document.createElement('div');
        ayahItem.className = 'ayah-item';
        ayahItem.dataset.index = i;

        let content = `
            <div class="ayah-text">${ayah.text} (${ayah.aya})</div>
        `;

        // Show translation if enabled
        if (showTranslationState && ayah.en) {
            content += `
                <div class="ayah-translation show">
                    <p>${ayah.en}</p>
                </div>
            `;
        } else if (ayah.en) {
            content += `
                <div class="ayah-translation hide">
                    <p>${ayah.en}</p>
                </div>
            `;
        }

        // Show tafsir if enabled
        if (showTafsirState && ayah.tafsir) {
            content += `
                <div class="ayah-tafsir show">
                    <p>${ayah.tafsir}</p>
                </div>
            `;
        } else if (ayah.tafsir) {
            content += `
                <div class="ayah-tafsir hide">
                    <p>${ayah.tafsir}</p>
                </div>
            `;
        }

        ayahItem.innerHTML = content;
        readingList.appendChild(ayahItem);
    });

    // Apply current font size to newly rendered ayahs
    const savedSize = localStorage.getItem('qc-font-size');
    if (savedSize) {
        const ayahTexts = readingList.querySelectorAll('.ayah-text');
        ayahTexts.forEach(ayah => {
            ayah.style.fontSize = savedSize + 'px';
        });
    }
}

// Toggle tafsir
function toggleTafsir() {
    showTafsirState = !showTafsirState;
    updateControlButtons();

    const tafsirElements = document.querySelectorAll('.ayah-tafsir');
    tafsirElements.forEach(element => {
        if (showTafsirState) {
            element.classList.remove('hide');
            element.classList.add('show');
        } else {
            element.classList.remove('show');
            element.classList.add('hide');
        }
    });
}

// Toggle translation
function toggleTranslation() {
    showTranslationState = !showTranslationState;
    updateControlButtons();

    const translationElements = document.querySelectorAll('.ayah-translation');
    translationElements.forEach(element => {
        if (showTranslationState) {
            element.classList.remove('hide');
            element.classList.add('show');
        } else {
            element.classList.remove('show');
            element.classList.add('hide');
        }
    });
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

// Simple font size controls
function increaseFontSize() {
    const readingList = document.getElementById('readingList');
    if (!readingList) return;

    // Get current font size from CSS or default to 18
    let currentSize = parseInt(getComputedStyle(readingList).fontSize) || 18;
    const newSize = Math.min(currentSize + 2, 32); // Max size 32px

    // Apply font size using the helper function
    applyFontSizeToAllAyahs(newSize);
    localStorage.setItem('qc-font-size', newSize);
    console.log('Font size increased to:', newSize);
}

function decreaseFontSize() {
    const readingList = document.getElementById('readingList');
    if (!readingList) return;

    // Get current font size from CSS or default to 18
    let currentSize = parseInt(getComputedStyle(readingList).fontSize) || 18;
    const newSize = Math.max(currentSize - 2, 12); // Min size 12px

    // Apply font size using the helper function
    applyFontSizeToAllAyahs(newSize);
    localStorage.setItem('qc-font-size', newSize);
    console.log('Font size decreased to:', newSize);
}

// Load saved font size
function loadFontPreferences() {
    const savedSize = localStorage.getItem('qc-font-size');
    if (savedSize) {
        const readingList = document.getElementById('readingList');
        if (readingList) {
            // Apply saved font size to readingList
            readingList.style.fontSize = savedSize + 'px';

            // Also apply to all existing ayah-text elements
            const ayahTexts = readingList.querySelectorAll('.ayah-text');
            ayahTexts.forEach(ayah => {
                ayah.style.fontSize = savedSize + 'px';
            });
        }
    }
}

// Apply font size to all ayah-text elements
function applyFontSizeToAllAyahs(size) {
    const readingList = document.getElementById('readingList');
    if (!readingList) return;

    // Apply to readingList
    readingList.style.fontSize = size + 'px';

    // Apply to all ayah-text elements
    const ayahTexts = readingList.querySelectorAll('.ayah-text');
    ayahTexts.forEach(ayah => {
        ayah.style.fontSize = size + 'px';
    });
}

// Initialize theme
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme === 'auto' ? (prefersDark ? 'dark' : 'light') : savedTheme;

    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
}

// Theme toggle
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

// Go back to home
function goToHome() {
    window.location.href = 'index.html';
}

// Go back to main page
function goToMainPage() {
    window.location.href = 'index.html';
}
