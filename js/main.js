
const t = {
    ar: {
        searchPlaceholder: "ابحث برقم او اسم السورة",
        notSelected: "لم يتم اختيار سورة بعد",
        currentSurah: s => `السورة: ${s.name} (${s.englishName}) — آيات: ${s.numberOfAyahs}`,
        reciter: "القارئ: مشاري العفاسي",
        player: "المشغل",
        light: "وضع نهاري",
        tafsir: "التفسير",
        noTafsir: "لا يوجد تفسير متاح",
        searchResults: "نتائج البحث",
        noResults: "لا توجد نتائج",
        searchInAyahs: "البحث في الآيات"
    },
    en: {
        searchPlaceholder: "Search by surah name, number, or word in ayah (no tashkeel needed)…",
        notSelected: "No surah selected yet",
        currentSurah: s => `Surah: ${s.englishName} (${s.name}) — Ayahs: ${s.numberOfAyahs}`,
        reciter: "Reciter: Mishary Alafasy",
        player: "Player",
        light: "Light mode",
        tafsir: "Tafsir",
        noTafsir: "No tafsir available",
        searchResults: "Search Results",
        noResults: "No results found",
        searchInAyahs: "Search in Ayahs"
    }
};

// ====== Global Variables ======
let lang = localStorage.getItem('qc-lang') || 'ar';
let surahs = [];
let current = { surahIndex: -1, ayahIndex: -1, playlist: [], mode: null };
let searchResults = [];
let isSearchMode = false;

// ====== DOM Elements ======
const el = id => document.getElementById(id);

// ====== Helper Functions ======
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// دالة لإزالة التشكيل من النص العربي
// هذه الدالة تزيل جميع علامات التشكيل (الحركات) من النص العربي
// مما يسمح بالبحث بدون الحاجة لكتابة التشكيل
function removeTashkeel(text) {
    if (!text) return '';

    // إزالة جميع علامات التشكيل والحركات
    let cleanText = text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u08D4-\u08FE]/g, '');

    // إزالة علامات التوقف والوقف
    cleanText = cleanText.replace(/[\u06D6-\u06ED]/g, '');

    // إزالة علامات الإعراب الإضافية
    cleanText = cleanText.replace(/[\u08D4-\u08FE]/g, '');

    return cleanText;
}

// دالة بحث محسنة تعمل بدون تشكيل
// هذه الدالة تبحث في النص بعدة طرق:
// 1. البحث في النص الأصلي (مع التشكيل)
// 2. البحث في النص بدون تشكيل
// 3. البحث بدون تشكيل مع تجاهل حالة الأحرف
// 4. البحث في النص المقسم إلى كلمات
function searchText(text, query) {
    if (!text || !query) return false;

    const cleanText = removeTashkeel(text);
    const cleanQuery = removeTashkeel(query);

    // البحث في النص الأصلي
    if (text.includes(query)) return true;

    // البحث في النص بدون تشكيل
    if (cleanText.includes(cleanQuery)) return true;

    // البحث بدون تشكيل مع تجاهل حالة الأحرف
    if (cleanText.toLowerCase().includes(cleanQuery.toLowerCase())) return true;

    // البحث في الكلمات الفردية (مفيد للبحث في أجزاء من الآية)
    const words = cleanText.split(/\s+/);
    const queryWords = cleanQuery.split(/\s+/);

    for (const queryWord of queryWords) {
        if (queryWord.length < 2) continue; // تجاهل الكلمات القصيرة جداً

        for (const word of words) {
            if (word.includes(queryWord) || queryWord.includes(word)) {
                return true;
            }
        }
    }

    return false;
}

function setLang(next) {
    lang = next;
    localStorage.setItem('qc-lang', lang);
    document.documentElement.lang = lang === 'ar' ? 'ar' : 'en';
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    const search = el('search');
    if (search) {
        search.placeholder = t[lang].searchPlaceholder;
    }

    const npTitle = el('npTitle');
    const npAyah = el('npAyah');

    if (current.surahIndex === -1) {
        if (npTitle) npTitle.textContent = t[lang].notSelected;
        if (npAyah) npAyah.style.display = 'none';
    } else {
        updateNowPlaying();
        updateCurrentAyah();
    }
}

function getCurrentReciter() {
    const reciterSelect = document.getElementById('reciterSelect');
    if (!reciterSelect) return 'ar.alafasy';

    const value = reciterSelect.value;
    console.log('Current reciter value:', value);

    // Map the select values to actual API values
    const reciterMap = {
        'mishary': 'ar.alafasy',
        'sudais': 'ar.abdul_rahman_sudais',
        'ghamdi': 'ar.saad_al_ghamdi',
        'shuraim': 'ar.abdul_rahman_sudais'
    };

    return reciterMap[value] || 'ar.alafasy';
}

async function changeReciter() {
    const newReciter = getCurrentReciter();
    localStorage.setItem('qc-reciter', newReciter);

    // تحديث اسم القارئ المعروض
    updateReciterName();

    // إذا كانت هناك سورة محملة، أعد تحميلها مع القارئ الجديد
    if (current.surahIndex !== -1) {
        try {
            await loadSurah(current.surahIndex);
        } catch (error) {
            console.error('Error changing reciter:', error);
        }
    }
}

function updateReciterName() {
    const reciterValue = getCurrentReciter();
    const reciterNames = {
        'ar.alafasy': 'مشاري العفاسي',
        'ar.abdul_basit': 'عبد الباسط عبد الصمد',
        'ar.abdul_rahman_sudais': 'عبد الرحمن السديس',
        'ar.saad_al_ghamdi': 'سعد الغامدي',
        'ar.mahmoud_khalil': 'محمود خليل الحصري',
        'ar.mohammad_siddiq': 'محمد صديق المنشاوي',
        'ar.ahmed_al_ajmi': 'أحمد العجمي',
        'ar.ali_hudhaify': 'علي الحذيفي'
    };
}

function updatePlayButtonIcon(isPlaying) {
    const playBtn = document.getElementById('playPauseBtn');
    if (!playBtn) return;

    const playIcon = document.getElementById('playIcon');
    if (playIcon) {
        if (isPlaying) {
            // أيقونة إيقاف
            playIcon.className = 'bi bi-pause-fill';
        } else {
            // أيقونة تشغيل
            playIcon.className = 'bi bi-play-fill';
        }
    }
}

function updateNowPlaying() {
    const s = surahs[current.surahIndex];
    if (!s) return;

    const npTitle = el('npTitle');
    if (npTitle) {
        npTitle.textContent = `${s.number}. ${lang === 'ar' ? s.name : s.englishName}`;
    }
}

function updateCurrentAyah() {
    if (current.ayahIndex >= 0 && current.playlist[current.ayahIndex]) {
        const ayah = current.playlist[current.ayahIndex];
        const ayahText = el('ayahText');
        const ayahTextEn = el('ayahTextEn');
        const npAyah = el('npAyah');

        if (ayahText) ayahText.textContent = ayah.text;
        if (ayahTextEn) ayahTextEn.textContent = ayah.en;

        // Show/hide tafsir
        const ayahTafsir = el('ayahTafsir');
        if (ayahTafsir) {
            if (ayah.tafsir && ayah.tafsir.trim()) {
                ayahTafsir.textContent = ayah.tafsir;
                ayahTafsir.style.display = 'block';
            } else {
                ayahTafsir.style.display = 'none';
            }
        }

        if (npAyah) npAyah.style.display = 'block';
    } else {
        const npAyah = el('npAyah');
        if (npAyah) npAyah.style.display = 'none';
    }
}

// ====== Mode Management Functions ======

function selectListeningMode() {
    current.mode = 'listening';

    // Close modal
    closeModeModal();

    // Redirect to player page with surah info
    const surah = surahs[current.surahIndex];
    if (surah) {
        // Store surah info in localStorage to load it in player page
        localStorage.setItem('qc-selected-surah', JSON.stringify({
            index: current.surahIndex,
            number: surah.number,
            name: surah.name,
            englishName: surah.englishName
        }));

        // Redirect to player page
        window.location.href = 'player.html';
    }
}

function showSurahList() {
    // Reset current state
    current.surahIndex = -1;
    current.ayahIndex = -1;
    current.playlist = [];
    current.mode = null;

    // Hide all sections and show surah list
    const modeSelection = document.getElementById('modeSelection');
    const readingSection = document.getElementById('readingSection');
    const listeningSection = document.getElementById('listeningSection');
    const surahListCard = document.getElementById('surahList').closest('.card');

    if (modeSelection) modeSelection.style.display = 'none';
    if (readingSection) readingSection.style.display = 'none';
    if (listeningSection) listeningSection.style.display = 'none';
    if (surahListCard) surahListCard.style.display = 'block';

    // Clear any loaded content
    const readingList = document.getElementById('readingList');
    const listeningList = document.getElementById('listeningList');
    if (readingList) readingList.innerHTML = '';
    if (listeningList) listeningList.innerHTML = '';

    // Reset search
    const search = document.getElementById('search');
    if (search) {
        search.value = '';
        isSearchMode = false;
    }

    // Show all surahs
    renderSurahList(surahs);
}

async function loadSurahForReading(index) {
    const surah = surahs[index];
    if (!surah) return;

    // Update reading section title
    const readingTitle = el('readingTitle');
    if (readingTitle) {
        readingTitle.textContent = `${surah.number}. ${lang === 'ar' ? surah.name : surah.englishName}`;
    }

    try {
        // Load Arabic text and English translation only (no audio)
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

        current.playlist = ayahs;
        renderAyahsForReading(ayahs);

    } catch (error) {
        console.error('Error loading surah for reading:', error);
        const readingList = el('readingList');
        if (readingList) {
            readingList.innerHTML = `<div class="content" style="color:tomato; text-align:center; padding:20px;">
                تعذّر تحميل البيانات. تأكد من الاتصال بالإنترنت.
            </div>`;
        }
    }
}

function renderAyahsForReading(ayahs) {
    const readingList = el('readingList');
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

// ====== Rendering Functions ======
function renderSurahList(list) {
    const surahList = el('surahList');
    if (!surahList) return;

    surahList.innerHTML = '';
    list.forEach(s => {
        const row = document.createElement('div');
        row.className = 'item';
        row.innerHTML = `
            <div class="num">${s.number}</div>
            <div class="content">
                <h4>${lang === 'ar' ? s.name : s.englishName}</h4>
                <p>${lang === 'ar' ? s.englishName : s.name} · ${s.revelationType}</p>
            </div>
            <div class="ayah-count">${s.numberOfAyahs} آية</div>
        `;
        row.addEventListener('click', () => selectSurah(s.number - 1));
        surahList.appendChild(row);
    });
}

function renderAyahs(ayahs) {
    const listeningList = el('listeningList');
    if (!listeningList) return;

    // Update listening section title and description
    const listeningTitle = el('listeningTitle');
    const listeningDesc = el('listeningDesc');
    if (listeningTitle && listeningDesc) {
        listeningTitle.textContent = 'الآيات (وضع الاستماع)';
        listeningDesc.textContent = 'عرض الآيات مع إمكانية التشغيل الصوتي.';
    }

    listeningList.innerHTML = '';
    ayahs.forEach((a, i) => {
        const row = document.createElement('div');
        row.className = 'item';
        row.dataset.index = i;
        row.innerHTML = `
            <div style="display:flex; align-items:flex-start; gap:10px; width:100%">
                <div class="num">${i + 1}</div>
                <div style="flex:1">
                    <div style="font-family:'Amiri', serif; font-size:20px">${a.text}</div>
                    <small class="rtl-en">${a.en}</small>
                    ${a.tafsir ? `<div class="tafsir-text">${a.tafsir}</div>` : ''}
                </div>
            </div>`;
        row.addEventListener('click', () => playAyah(i));
        listeningList.appendChild(row);
    });
}

function renderSearchResults(results) {
    // Determine which list to use based on current mode
    let targetList;
    let targetTitle;

    if (current.mode === 'reading') {
        targetList = el('readingList');
        targetTitle = el('readingTitle');
    } else if (current.mode === 'listening') {
        targetList = el('listeningList');
        targetTitle = el('listeningTitle');
    } else {
        // If no mode selected, show in reading section
        targetList = el('readingList');
        targetTitle = el('readingTitle');
        if (targetList) targetList.style.display = 'block';
    }

    if (isSearchMode) {
        if (targetTitle) targetTitle.textContent = t[lang].searchResults;
    } else {
        if (targetTitle) targetTitle.textContent = 'الآيات (نتائج البحث)';
    }

    if (!targetList) return;

    targetList.innerHTML = '';
    if (results.length === 0) {
        targetList.innerHTML = `<div class="content" style="color:var(--muted); text-align:center; padding:20px;">
            ${t[lang].noResults}
        </div>`;
        return;
    }

    results.forEach((result, i) => {
        const row = document.createElement('div');
        row.className = 'item';

        let content = `
            <div class="num">${result.surahNumber}:${result.ayahNumber}</div>
            <div class="content">
                <h4 style="color:var(--brand); margin-bottom:4px;">${result.surahName}</h4>
                <div style="font-family:'Amiri', serif; font-size:18px; margin-bottom:8px;">${result.text}</div>`;

        // Show translation if enabled (for reading mode)
        if (current.mode === 'reading' && true) { // Always show translation
            content += `<small class="rtl-en">${result.en}</small>`;
        } else if (current.mode === 'listening') {
            // Always show translation in listening mode
            content += `<small class="rtl-en">${result.en}</small>`;
        }

        // Show tafsir if enabled (for reading mode)
        if (current.mode === 'reading' && showTafsirState && result.tafsir) {
            content += `<div class="tafsir-text">${result.tafsir}</div>`;
        } else if (current.mode === 'listening' && result.tafsir) {
            // Always show tafsir in listening mode
            content += `<div class="tafsir-text">${result.tafsir}</div>`;
        }

        content += `
            </div>
            <div class="ayah-count">آية ${result.ayahNumber}</div>`;

        row.innerHTML = content;

        if (current.mode === 'listening') {
            row.addEventListener('click', () => loadSurahAndPlay(result.surahIndex, result.ayahIndex));
        } else {
            row.addEventListener('click', () => loadSurahForReadingAndShow(result.surahIndex, result.ayahIndex));
        }

        targetList.appendChild(row);
    });
}

function loadSurahForReadingAndShow(surahIndex, ayahIndex) {
    if (surahIndex !== current.surahIndex) {
        current.mode = 'reading';
        loadSurahForReading(surahIndex).then(() => {
            // Scroll to the specific ayah
            setTimeout(() => {
                const readingList = el('readingList');
                if (readingList && readingList.children[ayahIndex]) {
                    readingList.children[ayahIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
                    readingList.children[ayahIndex].style.background = 'rgba(45,212,191,.12)';
                    readingList.children[ayahIndex].style.borderLeft = '4px solid var(--brand)';
                }
            }, 500);
        });
    }
}

function markActiveAyah(i) {
    let targetList;
    if (current.mode === 'reading') {
        targetList = el('readingList');
    } else if (current.mode === 'listening') {
        targetList = el('listeningList');
    } else {
        targetList = el('readingList'); // Default to reading
    }

    if (!targetList) return;

    [...targetList.children].forEach((el, idx) => {
        el.style.background = idx === i ? 'rgba(45,212,191,.12)' : '';
        el.style.borderLeft = idx === i ? '4px solid var(--brand)' : '';
    });
}

// ====== API Functions ======
async function init() {
    // Initialize theme
    initializeTheme();

    // Light mode state
    const savedMode = localStorage.getItem('qc-mode');

    // Load saved reciter
    const reciterSelect = el('reciterSelect');
    if (reciterSelect) {
        const savedReciter = localStorage.getItem('qc-reciter');
        if (savedReciter) {
            reciterSelect.value = savedReciter;
        }
    }

    // تحديث اسم القارئ المعروض
    updateReciterName();

    // تهيئة أزرار التفسير والترجمة
    const showTafsirBtn = el('showTafsir');
    const showTranslationBtn = el('showTranslation');
    if (showTafsirBtn) showTafsirBtn.classList.add('active');
    if (showTranslationBtn) showTranslationBtn.classList.add('active');

    // load surahs
    try {
        const res = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await res.json();
        surahs = data.data;
        renderSurahList(surahs);
        setLang(lang);
    } catch (error) {
        console.error('Error loading surahs:', error);
        const surahList = el('surahList');
        if (surahList) {
            surahList.innerHTML = `<div class="content" style="color:tomato">تعذّر تحميل البيانات. تأكد من الاتصال بالإنترنت.</div>`;
        }
    }

    // Initialize new features
    await getCurrentLocation();
    await getRandomHadith();
}

async function loadSurah(index) {
    // index is 0-based; API expects 1-based
    const surah = surahs[index];
    if (!surah) return;

    current.surahIndex = index;
    updateNowPlaying();

    // Show listening section when surah is loaded for listening
    const listeningSection = document.getElementById('listeningSection');
    if (listeningSection) {
        listeningSection.style.display = 'block';
    }

    try {
        // Arabic text (uthmani) + English (Pickthall) + audio (selected reciter)
        const currentReciter = getCurrentReciter();
        console.log('Loading surah with reciter:', currentReciter);

        const [arRes, enRes, audioRes] = await Promise.all([
            fetch(`https://api.alquran.cloud/v1/surah/${surah.number}`),
            fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/en.pickthall`),
            fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/${currentReciter}`)
        ]);

        // Check if audio API response is successful
        if (!audioRes.ok) {
            throw new Error(`Audio API error: ${audioRes.status}`);
        }

        const [ar, en, au] = await Promise.all([arRes.json(), enRes.json(), audioRes.json()]);

        // Check if audio data is available
        if (!au.data || !au.data.ayahs || au.data.ayahs.length === 0) {
            throw new Error('No audio data available for this reciter');
        }

        console.log('Audio data loaded successfully:', au.data.ayahs.length, 'ayahs');

        // Load tafsir for each ayah
        const ayahs = await Promise.all(ar.data.ayahs.map(async (a, i) => {
            try {
                // Fetch tafsir for this specific ayah
                const tafsirRes = await fetch(`https://api.alquran.cloud/v1/ayah/${a.number}/ar.muyassar`);
                const tafsirData = await tafsirRes.json();
                const tafsir = tafsirData.data?.text || '';

                return {
                    aya: a.numberInSurah,
                    text: a.text,
                    en: en.data.ayahs[i]?.text || '',
                    audio: au.data.ayahs[i]?.audio,
                    tafsir: tafsir
                };
            } catch (tafsirError) {
                console.log(`Could not load tafsir for ayah ${a.number}:`, tafsirError);
                return {
                    aya: a.numberInSurah,
                    text: a.text,
                    en: en.data.ayahs[i]?.text || '',
                    audio: au.data.ayahs[i]?.audio,
                    tafsir: ''
                };
            }
        }));

        current.playlist = ayahs;
        current.ayahIndex = 0;
        renderAyahs(ayahs);

        // Initialize audio player
        initializeAudioPlayer();

        // Play first ayah
        playAyah(0);
        updateCurrentAyah();

    } catch (error) {
        console.error('Error loading surah:', error);
        // Try to fallback to Alafasy if the selected reciter fails
        if (getCurrentReciter() !== 'ar.alafasy') {
            console.log('Falling back to Alafasy reciter...');
            const reciterSelect = document.getElementById('reciterSelect');
            if (reciterSelect) {
                reciterSelect.value = 'ar.alafasy';
            }
            await loadSurah(index);
        } else {
            // Show error message
            const listeningList = document.getElementById('listeningList');
            if (listeningList) {
                listeningList.innerHTML = `<div class="content" style="color:tomato; text-align:center; padding:20px;">
                    تعذّر تحميل الصوت للقارئ المختار. جرب قارئ آخر.
                </div>`;
            }
        }
    }
}

function searchInQuran(query) {
    if (!query.trim()) {
        isSearchMode = false;
        if (current.surahIndex !== -1 && current.mode) {
            if (current.mode === 'reading') {
                renderAyahsForReading(current.playlist);
            } else if (current.mode === 'listening') {
                renderAyahs(current.playlist);
            }
        }
        return;
    }

    // إزالة التشكيل من query للبحث
    const cleanQuery = removeTashkeel(query);
    console.log(`البحث عن: "${query}" (بدون تشكيل: "${cleanQuery}")`);

    isSearchMode = true;

    // Search in current surah if available
    if (current.surahIndex !== -1 && current.playlist) {
        const localResults = current.playlist.filter((ayah, index) =>
            searchText(ayah.text, cleanQuery) ||
            searchText(ayah.en, cleanQuery) ||
            (ayah.tafsir && searchText(ayah.tafsir, cleanQuery))
        ).map((ayah, index) => ({
            surahNumber: current.surahIndex + 1,
            ayahNumber: index + 1,
            surahName: surahs[current.surahIndex].name,
            text: ayah.text,
            en: ayah.en,
            tafsir: ayah.tafsir,
            surahIndex: current.surahIndex,
            ayahIndex: index
        }));
        searchResults = localResults;
        renderSearchResults(localResults);
    } else {
        // Search in surah names
        const filtered = surahs.filter(s =>
            `${s.number}`.includes(query) ||
            searchText(s.name, cleanQuery) ||
            searchText(s.englishName, cleanQuery)
        );
        renderSurahList(filtered);

        // إذا كان البحث قصير، ابحث أيضاً في الآيات
        if (query.length >= 3) {
            // إظهار مؤشر البحث
            const searchInput = el('search');
            if (searchInput) {
                searchInput.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, .1), rgba(255, 165, 0, .1))';
                searchInput.style.borderColor = 'var(--primary)';
            }

            searchInAllSurahs(query).finally(() => {
                // إعادة تعيين مؤشر البحث
                if (searchInput) {
                    searchInput.style.background = '';
                    searchInput.style.borderColor = '';
                }
            });
        }
    }
}

// دالة البحث في جميع السور
// هذه الدالة تبحث في عدة سور للعثور على نتائج أكثر
async function searchInAllSurahs(query) {
    if (query.length < 3) return;

    try {
        // البحث في أول 10 سور كبداية (لتحسين الأداء)
        // يمكن زيادة هذا العدد حسب الحاجة
        const searchPromises = surahs.slice(0, 10).map(async (surah, surahIndex) => {
            try {
                const [arRes, enRes] = await Promise.all([
                    fetch(`https://api.alquran.cloud/v1/surah/${surah.number}`),
                    fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/en.pickthall`)
                ]);

                const [ar, en] = await Promise.all([arRes.json(), enRes.json()]);

                const matchingAyahs = ar.data.ayahs
                    .map((ayah, ayahIndex) => ({
                        ayah,
                        en: en.data.ayahs[ayahIndex]?.text || '',
                        surahIndex: surahIndex,
                        ayahIndex: ayahIndex
                    }))
                    .filter(({ ayah, en }) =>
                        searchText(ayah.text, cleanQuery) || searchText(en, cleanQuery)
                    )
                    .map(({ ayah, en, surahIndex, ayahIndex }) => ({
                        surahNumber: surah.number,
                        ayahNumber: ayah.numberInSurah,
                        surahName: surah.name,
                        text: ayah.text,
                        en: en,
                        surahIndex: surahIndex,
                        ayahIndex: ayahIndex
                    }));

                return matchingAyahs;
            } catch (error) {
                console.log(`Error searching in surah ${surah.number}:`, error);
                return [];
            }
        });

        const allResults = await Promise.all(searchPromises);
        const flatResults = allResults.flat().slice(0, 20); // حد أقصى 20 نتيجة

        if (flatResults.length > 0) {
            searchResults = flatResults;
            renderSearchResults(flatResults);
        }

    } catch (error) {
        console.error('Error searching in all surahs:', error);
    }
}

function loadSurahAndPlay(surahIndex, ayahIndex) {
    if (surahIndex !== current.surahIndex) {
        loadSurah(surahIndex).then(() => {
            setTimeout(() => playAyah(ayahIndex), 500);
        });
    } else {
        playAyah(ayahIndex);
    }
    isSearchMode = false;
    const search = el('search');
    if (search) search.value = '';
}

// ====== Audio Functions ======

function togglePlayPause() {
    const audio = document.getElementById('audio');
    if (!audio) return;

    if (audio.paused) {
        audio.play().catch(error => {
            console.error('Error playing audio:', error);
        });
        updatePlayButtonIcon(true);
    } else {
        audio.pause();
        updatePlayButtonIcon(false);
    }
}

function playAyah(i) {
    const item = current.playlist[i];
    if (!item) {
        console.error('No ayah data for index:', i);
        return;
    }

    // Check if audio URL is available
    if (!item.audio) {
        console.error('No audio URL available for ayah:', i);
        return;
    }

    console.log('Playing ayah:', i, 'Audio URL:', item.audio);

    current.ayahIndex = i;

    // Use the shared audio player
    const audio = window.audioPlayer;
    if (!audio) {
        console.error('Audio player not initialized');
        return;
    }

    audio.src = item.audio;

    // Add error handling for audio
    audio.onerror = () => {
        console.error('Error loading audio for ayah:', i);
        updatePlayButtonIcon(false);
    };

    audio.onloadeddata = () => {
        console.log('Audio loaded successfully for ayah:', i);
        updatePlayButtonIcon(true);
    };

    audio.play().catch(error => {
        console.error('Error playing audio:', error);
        updatePlayButtonIcon(false);
    });

    updatePlayButtonIcon(true);
    markActiveAyah(i);
    updateCurrentAyah();
}

function nextAyah() {
    const next = current.ayahIndex + 1;
    if (next < current.playlist.length) {
        console.log('Playing next ayah:', next);
        playAyah(next);
    } else {
        // End of surah, move to next surah if available
        if (current.surahIndex + 1 < surahs.length) {
            console.log('Moving to next surah:', current.surahIndex + 1);
            loadSurah(current.surahIndex + 1);
        } else {
            // End of all surahs, stop playback
            console.log('End of all surahs, stopping playback');
            const audio = window.audioPlayer;
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
            updatePlayButtonIcon(false);

            // Reset progress bar
            const progressBar = document.getElementById('progressBar');
            if (progressBar) {
                progressBar.style.width = '0%';
            }
        }
    }
}

function previousAyah() {
    const prev = current.ayahIndex - 1;
    if (prev >= 0) {
        console.log('Playing previous ayah:', prev);
        playAyah(prev);
    } else {
        // Beginning of surah, move to previous surah if available
        if (current.surahIndex > 0) {
            console.log('Moving to previous surah:', current.surahIndex - 1);
            loadSurah(current.surahIndex - 1);
        } else {
            console.log('Beginning of all surahs');
        }
    }
}

// ====== Reading Mode Controls ======
let showTafsirState = true;
let showTranslationState = true;

function toggleTafsir() {
    showTafsirState = !showTafsirState;
    const btn = el('showTafsir');
    if (btn) {
        if (showTafsirState) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }

    // Update reading list
    if (current.mode === 'reading' && current.playlist.length > 0) {
        renderAyahsForReading(current.playlist);
    }
}

function toggleTranslation() {
    showTranslationState = !showTranslationState;
    const btn = el('showTranslation');
    if (btn) {
        if (showTranslationState) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }

    // Update reading list
    if (current.mode === 'reading' && current.playlist.length > 0) {
        renderAyahsForReading(current.playlist);
    }
}

// ====== Theme Management ======
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

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme === 'auto' ? (prefersDark ? 'dark' : 'light') : savedTheme;

    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
}

// ====== Event Handlers ======
function setupEventListeners() {
    const playBtn = el('playBtn');
    const nextBtn = el('nextBtn');
    const prevBtn = el('prevBtn');
    const audio = el('audio');
    const reciterSelect = el('reciterSelect');
    const search = el('search');

    // Play button
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (!audio || !audio.src) return;
            if (audio.paused) {
                audio.play();
                updatePlayButtonIcon(true);
            } else {
                audio.pause();
                updatePlayButtonIcon(false);
            }
        });
    }

    // Next/Previous buttons
    if (nextBtn) nextBtn.addEventListener('click', nextAyah);
    if (prevBtn) prevBtn.addEventListener('click', previousAyah);

    // Audio events
    if (audio) {
        audio.addEventListener('ended', nextAyah);
    }

    // Reciter change
    if (reciterSelect) {
        reciterSelect.addEventListener('change', changeReciter);
    }

    // Modal close on outside click
    const modeModal = el('modeModal');
    if (modeModal) {
        modeModal.addEventListener('click', (e) => {
            if (e.target === modeModal) {
                closeModeModal();
            }
        });
    }

    // Search
    if (search) {
        let searchTimeout;
        search.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            const query = search.value.trim();

            if (query.length >= 2) {
                searchTimeout = setTimeout(() => {
                    searchInQuran(query);
                }, 300);
            } else if (query.length === 0) {
                isSearchMode = false;
                if (current.surahIndex !== -1 && current.mode) {
                    if (current.mode === 'reading') {
                        renderAyahsForReading(current.playlist);
                    } else if (current.mode === 'listening') {
                        renderAyahs(current.playlist);
                    }
                } else {
                    // If no surah is loaded, show filtered surah list
                    const filtered = surahs.filter(s =>
                        `${s.number}`.includes(query) ||
                        searchText(s.name, query) ||
                        searchText(s.englishName, query)
                    );
                    renderSurahList(filtered);
                }
            } else if (query.length === 1) {
                // For single character, search in surah names
                const filtered = surahs.filter(s =>
                    `${s.number}`.includes(query) ||
                    searchText(s.name, query) ||
                    searchText(s.englishName, query)
                );
                renderSurahList(filtered);
            }
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            if (playBtn) playBtn.click();
        }
        if (e.key === 'ArrowRight') { nextAyah(); }
        if (e.key === 'ArrowLeft') { previousAyah(); }
        if (e.key === 'Escape') { closeModeModal(); }
    });
}

// ====== Initialize ======
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();

    // Initialize reading mode controls
    const tafsirBtn = el('showTafsir');
    const translationBtn = el('showTranslation');

    if (tafsirBtn) tafsirBtn.classList.add('active');
    if (translationBtn) translationBtn.classList.add('active');

    init();
});

// ====== Prayer Times Functions ======
let prayerTimes = {};
let currentLocation = null;
let prayerCountdownInterval = null;

async function getPrayerTimes(lat, lng) {
    try {
        const response = await fetch(`https://api.aladhan.com/v1/timings/${Math.floor(Date.now() / 1000)}?latitude=${lat}&longitude=${lng}&method=2`);
        const data = await response.json();

        if (data.status === 'OK') {
            prayerTimes = data.data.timings;
            updatePrayerTimesDisplay();
            startPrayerCountdown();
        }
    } catch (error) {
        console.error('Error fetching prayer times:', error);
        showPrayerTimesError();
    }
}

function updatePrayerTimesDisplay() {
    const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const arabicNames = ['الفجر', 'الظهر', 'العصر', 'المغرب', 'العشاء'];

    prayers.forEach((prayer, index) => {
        const element = document.getElementById(prayer.toLowerCase());
        if (element && prayerTimes[prayer]) {
            element.textContent = formatPrayerTime(prayerTimes[prayer]);
        }
    });
}

function formatPrayerTime(timeString) {
    if (!timeString) return '--:--';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
}

function startPrayerCountdown() {
    if (prayerCountdownInterval) {
        clearInterval(prayerCountdownInterval);
    }

    prayerCountdownInterval = setInterval(() => {
        updatePrayerCountdown();
    }, 1000);
}

function updatePrayerCountdown() {
    const now = new Date();
    const currentTime = now.getTime();

    let nextPrayer = null;
    let nextPrayerTime = null;

    const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    for (const prayer of prayers) {
        if (prayerTimes[prayer]) {
            const prayerTime = new Date();
            const [hours, minutes] = prayerTimes[prayer].split(':');
            prayerTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            if (prayerTime > now) {
                nextPrayer = prayer;
                nextPrayerTime = prayerTime;
                break;
            }
        }
    }

    if (nextPrayer && nextPrayerTime) {
        const timeLeft = nextPrayerTime - currentTime;
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        const countdownElement = document.getElementById('prayerCountdown');
        if (countdownElement) {
            countdownElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
}

function showPrayerTimesError() {
    const grid = document.getElementById('prayerTimesGrid');
    if (grid) {
        grid.innerHTML = '<div style="text-align:center; color:var(--error); padding:20px;">تعذّر تحميل مواقيت الصلاة</div>';
    }
}

async function refreshPrayerTimes() {
    if (currentLocation) {
        await getPrayerTimes(currentLocation.lat, currentLocation.lng);
    } else {
        await getCurrentLocation();
    }
}

// ====== Qibla Functions ======
let qiblaDirection = null;

async function getQiblaDirection(lat, lng) {
    try {
        // Calculate qibla direction (simplified)
        const kaabaLat = 21.4225;
        const kaabaLng = 39.8262;

        const deltaLng = kaabaLng - lng;
        const y = Math.sin(deltaLng * Math.PI / 180);
        const x = Math.cos(lat * Math.PI / 180) * Math.tan(kaabaLat * Math.PI / 180) - Math.sin(lat * Math.PI / 180) * Math.cos(deltaLng * Math.PI / 180);

        let qiblaAngle = Math.atan2(y, x) * 180 / Math.PI;
        qiblaAngle = (qiblaAngle + 360) % 360;

        qiblaDirection = qiblaAngle;
        updateQiblaDisplay();

        // Calculate distance
        const distance = calculateDistance(lat, lng, kaabaLat, kaabaLng);
        updateQiblaDistance(distance);

    } catch (error) {
        console.error('Error calculating qibla direction:', error);
    }
}

function updateQiblaDisplay() {
    const arrow = document.getElementById('qiblaArrow');
    const direction = document.getElementById('qiblaDirection');

    if (arrow && qiblaDirection !== null) {
        arrow.style.transform = `rotate(${qiblaDirection}deg)`;
    }

    if (direction && qiblaDirection !== null) {
        direction.textContent = `${Math.round(qiblaDirection)}°`;
    }
}

function updateQiblaDistance(distance) {
    const distanceElement = document.getElementById('qiblaDistance');
    if (distanceElement) {
        distanceElement.textContent = `${Math.round(distance)} كم`;
    }
}

function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

async function refreshQibla() {
    if (currentLocation) {
        await getQiblaDirection(currentLocation.lat, currentLocation.lng);
    } else {
        await getCurrentLocation();
    }
}

// ====== Hadith Functions ======
let currentHadith = null;

async function getRandomHadith() {
    try {
        // Using a simple hadith API or local data
        const hadiths = [
            {
                text: "من حسن إسلام المرء تركه ما لا يعنيه",
                narrator: "رواه الترمذي",
                grade: "حسن"
            },
            {
                text: "المسلم من سلم المسلمون من لسانه ويده",
                narrator: "رواه البخاري ومسلم",
                grade: "صحيح"
            },
            {
                text: "لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه",
                narrator: "رواه البخاري ومسلم",
                grade: "صحيح"
            },
            {
                text: "إنما الأعمال بالنيات وإنما لكل امرئ ما نوى",
                narrator: "رواه البخاري ومسلم",
                grade: "صحيح"
            },
            {
                text: "من كان يؤمن بالله واليوم الآخر فليقل خيراً أو ليصمت",
                narrator: "رواه البخاري ومسلم",
                grade: "صحيح"
            }
        ];

        const randomIndex = Math.floor(Math.random() * hadiths.length);
        currentHadith = hadiths[randomIndex];
        updateHadithDisplay();

    } catch (error) {
        console.error('Error fetching hadith:', error);
        showHadithError();
    }
}

function updateHadithDisplay() {
    if (!currentHadith) return;

    const textElement = document.getElementById('hadithText');
    const narratorElement = document.getElementById('narratorName');
    const gradeElement = document.getElementById('gradeText');

    if (textElement) textElement.textContent = currentHadith.text;
    if (narratorElement) narratorElement.textContent = currentHadith.narrator;
    if (gradeElement) gradeElement.textContent = currentHadith.grade;
}

function showHadithError() {
    const content = document.getElementById('hadithContent');
    if (content) {
        content.innerHTML = '<div style="text-align:center; color:var(--error); padding:20px;">تعذّر تحميل الحديث</div>';
    }
}

async function refreshHadith() {
    await getRandomHadith();
}

// Location functions moved to prayer-qibla.js
// دوال الموقع تم نقلها إلى prayer-qibla.js

// ====== Export for global use ======
window.QuranCast = {
    init,
    loadSurah,
    loadSurahForReading,
    playAyah,
    nextAyah,
    previousAyah,
    searchInQuran,
    searchInAllSurahs,
    changeReciter,
    setLang,
    showReadingMode,
    showListeningMode,
    showSurahList,
    closeModeModal,
    toggleTafsir,
    // refreshPrayerTimes, - moved to prayer-qibla.js
    // refreshQibla, - moved to prayer-qibla.js
    refreshHadith
};

/*
🎯 ميزات البحث المحسنة في Quran Cast:

✅ البحث بدون تشكيل (الحركات)
   - اكتب "الرحمن" بدلاً من "الرَّحْمَٰن"
   - اكتب "الملك" بدلاً من "الْمُلْكُ"
   - اكتب "الفاتحة" بدلاً من "الْفَاتِحَة"

✅ البحث في الكلمات الفردية
   - البحث في أجزاء من الآية
   - البحث في كلمات متعددة

✅ البحث الشامل
   - في النص العربي والإنجليزي
   - في التفسير
   - في أسماء السور

✅ أداء محسن
   - تأخير البحث (debouncing)
   - بحث ذكي في عدة سور
   - نتائج فورية

🔍 أمثلة على البحث:
- "قل هو الله أحد" → آية الإخلاص
- "بسم الله" → البسملة
- "الرحمة" → آيات الرحمة
- "الإيمان" → آيات الإيمان

🆕 الميزات الجديدة:
✅ مواقيت الصلاة مع العد التنازلي
✅ اتجاه القبلة مع البوصلة
✅ أحاديث نبوية عشوائية
*/

// ====== Enhanced Player Functions ======

// Initialize audio player functionality
function initializeAudioPlayer() {
    // Audio element for the enhanced player
    if (!window.audioPlayer) {
        window.audioPlayer = new Audio();
        window.audioPlayer.preload = 'none';

        // Add event listeners for audio
        window.audioPlayer.addEventListener('timeupdate', updateProgress);
        window.audioPlayer.addEventListener('ended', onAudioEnded);
        window.audioPlayer.addEventListener('loadedmetadata', onAudioLoaded);
    }
}

// Update progress bar
function updateProgress() {
    const audio = window.audioPlayer;
    if (!audio || !audio.duration) return;

    const progress = (audio.currentTime / audio.duration) * 100;
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = progress + '%';
    }

    // Update time display
    const currentTimeEl = document.getElementById('currentTime');
    const totalTimeEl = document.getElementById('totalTime');
    if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
    if (totalTimeEl) totalTimeEl.textContent = formatTime(audio.duration);
}

// Audio event handlers
function onAudioEnded() {
    console.log('Audio ended, moving to next ayah...');

    // Auto-play next ayah
    const nextIndex = current.ayahIndex + 1;
    if (nextIndex < current.playlist.length) {
        console.log('Playing next ayah:', nextIndex);
        playAyah(nextIndex);
    } else {
        // End of surah, reset to first ayah
        console.log('End of surah, resetting to first ayah');
        current.ayahIndex = 0;
        updatePlayButtonIcon(false);

        // Update progress bar
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = '0%';
        }

        // Reset time display
        const currentTimeEl = document.getElementById('currentTime');
        const totalTimeEl = document.getElementById('totalTime');
        if (currentTimeEl) currentTimeEl.textContent = '00:00';
        if (totalTimeEl) totalTimeEl.textContent = '00:00';
    }
}

function onAudioLoaded() {
    // Audio metadata loaded
    updateProgress();
}

// Player control functions
function togglePlayPause() {
    const audio = window.audioPlayer;
    const playIcon = document.getElementById('playIcon');

    if (!audio || !playIcon) {
        console.error('Audio player or play icon not found');
        return;
    }

    if (audio.paused) {
        audio.play().then(() => {
            playIcon.className = 'bi bi-pause-fill';
            updatePlayButtonIcon(true);
        }).catch(error => {
            console.error('Error playing audio:', error);
            updatePlayButtonIcon(false);
        });
    } else {
        audio.pause();
        playIcon.className = 'bi bi-play-fill';
        updatePlayButtonIcon(false);
    }
}

function previousAyah() {
    const prev = current.ayahIndex - 1;
    if (prev >= 0) {
        console.log('Playing previous ayah:', prev);
        playAyah(prev);
    } else {
        // Beginning of surah, move to previous surah if available
        if (current.surahIndex > 0) {
            console.log('Moving to previous surah:', current.surahIndex - 1);
            loadSurah(current.surahIndex - 1);
        } else {
            console.log('Beginning of all surahs');
        }
    }
}

function nextAyah() {
    // Implementation for next ayah
    console.log('Next ayah');
    // TODO: Implement next ayah functionality
}

// Player settings functions
function changeReciter() {
    const reciterSelect = document.getElementById('reciterSelect');
    if (!reciterSelect) return;

    const selectedReciter = reciterSelect.value;
    console.log('Reciter changed to:', selectedReciter);

    // Update current reciter display
    const reciterNames = {
        'ar.alafasy': 'مشاري العفاسي',
        'ar.abdul_basit': 'عبد الباسط عبد الصمد'
    };

    const currentReciterEl = document.getElementById('currentReciter');
    if (currentReciterEl) {
        currentReciterEl.textContent = reciterNames[selectedReciter] || selectedReciter;
    }

    // Save to localStorage
    localStorage.setItem('qc-reciter', selectedReciter);

    // Reload current surah with new reciter if one is loaded
    if (current.surahIndex !== -1) {
        console.log('Reloading surah with new reciter...');
        loadSurah(current.surahIndex);
    }
}

function changePlaybackSpeed() {
    const speedSelect = document.getElementById('playbackSpeed');
    if (!speedSelect) return;

    const selectedSpeed = parseFloat(speedSelect.value);
    console.log('Playback speed changed to:', selectedSpeed);

    const audio = window.audioPlayer;
    if (audio) {
        audio.playbackRate = selectedSpeed;
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

    console.log('Downloading ayah:', ayah.aya, 'Audio URL:', ayah.audio);

    // Create download link
    const downloadLink = document.createElement('a');
    downloadLink.href = ayah.audio;

    // Get surah name for filename
    const surah = surahs[current.surahIndex];
    const surahName = surah ? surah.name : 'surah';

    // Set filename: surah_ayah_reciter.mp3
    const reciter = getCurrentReciter();
    const reciterName = reciter === 'ar.alafasy' ? 'mishary' : 'abdul_basit';
    downloadLink.download = `${surahName}_${ayah.aya}_${reciterName}.mp3`;

    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    console.log('Download started for:', downloadLink.download);
}

function shareAyah() {
    if (current.ayahIndex < 0 || !current.playlist[current.ayahIndex]) {
        console.log('No ayah selected for sharing');
        return;
    }

    const ayah = current.playlist[current.ayahIndex];
    const surah = surahs[current.surahIndex];

    if (!surah) {
        console.log('No surah data available');
        return;
    }

    // Create shareable text
    const shareText = `سورة ${surah.name} - الآية ${ayah.aya}\n\n${ayah.text}\n\n${ayah.en}\n\n${ayah.tafsir ? `التفسير: ${ayah.tafsir}` : ''}`;

    console.log('Sharing ayah text:', shareText);

    // Copy to clipboard
    if (navigator.clipboard && window.isSecureContext) {
        // Use modern clipboard API
        navigator.clipboard.writeText(shareText).then(() => {
            showShareSuccess();
        }).catch(err => {
            console.error('Failed to copy to clipboard:', err);
            fallbackCopyTextToClipboard(shareText);
        });
    } else {
        // Fallback for older browsers
        fallbackCopyTextToClipboard(shareText);
    }
}

// Fallback copy function for older browsers
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
        showShareSuccess();
    } catch (err) {
        console.error('Fallback copy failed:', err);
        showShareError();
    }

    document.body.removeChild(textArea);
}

// Show success message
function showShareSuccess() {
    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'share-notification success';
    notification.innerHTML = `
        <i class="bi bi-check-circle-fill"></i>
        <span>تم نسخ النص بنجاح!</span>
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Show error message
function showShareError() {
    const notification = document.createElement('div');
    notification.className = 'share-notification error';
    notification.innerHTML = `
        <i class="bi bi-exclamation-circle-fill"></i>
        <span>فشل في نسخ النص</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

function addToFavorites() {
    if (current.ayahIndex < 0 || !current.playlist[current.ayahIndex]) {
        console.log('No ayah selected for favorites');
        return;
    }

    const ayah = current.playlist[current.ayahIndex];
    const surah = surahs[current.surahIndex];

    if (!surah) {
        console.log('No surah data available');
        return;
    }

    // Create favorite object
    const favorite = {
        surahNumber: surah.number,
        surahName: surah.name,
        ayahNumber: ayah.aya,
        ayahText: ayah.text,
        ayahTranslation: ayah.en,
        ayahTafsir: ayah.tafsir,
        reciter: getCurrentReciter(),
        timestamp: new Date().toISOString()
    };

    // Get existing favorites from localStorage
    let favorites = JSON.parse(localStorage.getItem('quran-favorites') || '[]');

    // Check if already in favorites
    const existingIndex = favorites.findIndex(fav =>
        fav.surahNumber === favorite.surahNumber &&
        fav.ayahNumber === favorite.ayahNumber
    );

    if (existingIndex !== -1) {
        // Remove from favorites
        favorites.splice(existingIndex, 1);
        localStorage.setItem('quran-favorites', JSON.stringify(favorites));
        showFavoriteNotification('تم إزالة الآية من المفضلة', 'removed');
        console.log('Ayah removed from favorites');
    } else {
        // Add to favorites
        favorites.push(favorite);
        localStorage.setItem('quran-favorites', JSON.stringify(favorites));
        showFavoriteNotification('تم إضافة الآية للمفضلة', 'added');
        console.log('Ayah added to favorites');
    }
}

// Show favorite notification
function showFavoriteNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `share-notification ${type === 'added' ? 'success' : 'info'}`;

    const icon = type === 'added' ? 'bi-heart-fill' : 'bi-heart';
    notification.innerHTML = `
        <i class="bi ${icon}"></i>
        <span>${message}</span>
    `;

    // Change background for removed notification
    if (type === 'removed') {
        notification.style.background = 'linear-gradient(135deg, #6b7280, #4b5563)';
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Enhanced listening section display
function showListeningSection(surahNumber) {
    hideAllSections();
    const listeningSection = el('listeningSection');
    if (listeningSection) {
        listeningSection.style.display = 'block';
    }

    // Update player title and info
    const surah = surahs.find(s => s.number === surahNumber);
    if (surah) {
        const listeningTitle = el('listeningTitle');
        const currentSurahName = el('currentSurahName');
        const currentAyahInfo = el('currentAyahInfo');

        if (listeningTitle) listeningTitle.textContent = `سورة ${surah.name}`;
        if (currentSurahName) currentSurahName.textContent = surah.name;
        if (currentAyahInfo) currentAyahInfo.textContent = `عدد الآيات: ${surah.numberOfAyahs}`;
    }

    // Load ayahs for the selected surah
    loadAyahsForSurah(surahNumber);

    // Initialize audio player
    initializeAudioPlayer();
}

// ====== Modal Management ======

function showModeModal() {
    console.log('showModeModal called');
    const modal = document.getElementById('modeSelection');
    console.log('Modal element:', modal);
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
        document.body.classList.add('modal-open');

        // Add event listeners for closing modal
        addModalEventListeners();
        console.log('Modal should be visible now');
    } else {
        console.error('Modal element not found!');
    }
}

function closeModeModal() {
    const modal = document.getElementById('modeSelection');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');

        // Remove event listeners
        removeModalEventListeners();
    }
}

function addModalEventListeners() {
    const modal = document.getElementById('modeSelection');
    if (modal) {
        // Close modal when clicking outside
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                closeModeModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', handleEscapeKey);
    }
}

function removeModalEventListeners() {
    document.removeEventListener('keydown', handleEscapeKey);
}

function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        closeModeModal();
    }
}

// ====== Mode Selection Functions ======

function selectReadingMode() {
    current.mode = 'reading';

    // Close modal
    closeModeModal();

    // Redirect to reading page with surah info
    const surah = surahs[current.surahIndex];
    if (surah) {
        // Store surah info in localStorage to load it in reading page
        localStorage.setItem('qc-selected-surah', JSON.stringify({
            index: current.surahIndex,
            number: surah.number,
            name: surah.name,
            englishName: surah.englishName
        }));

        // Redirect to reading page
        window.location.href = 'reading.html';
    }
}

function selectListeningMode() {
    current.mode = 'listening';

    // Close modal
    closeModeModal();

    // Redirect to player page with surah info
    const surah = surahs[current.surahIndex];
    if (surah) {
        // Store surah info in localStorage to load it in player page
        localStorage.setItem('qc-selected-surah', JSON.stringify({
            index: current.surahIndex,
            number: surah.number,
            name: surah.name,
            englishName: surah.englishName
        }));

        // Redirect to player page
        window.location.href = 'player.html';
    }
}

// ====== Surah Selection ======

function selectSurah(index) {
    console.log('selectSurah called with index:', index);
    current.surahIndex = index;

    // Show mode selection modal
    showModeModal();
}

// ====== Test Functions ======

// Test function to manually show modal
function testModal() {
    console.log('Testing modal...');
    showModeModal();
}

// Add test button to window for debugging
window.testModal = testModal;

// ====== Enhanced Homepage Animations ======
// Scroll-triggered animations for better performance
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe all animated elements
    const animatedElements = document.querySelectorAll('.card, .search-bar, .list .item, .mode-btn');
    animatedElements.forEach(el => {
        el.style.animationPlayState = 'paused';
        observer.observe(el);
    });
}

// Enhanced stat numbers counter animation
function animateStatNumbers() {
    const statNumbers = document.querySelectorAll('.stat-number');

    statNumbers.forEach(stat => {
        const targetNumber = parseInt(stat.textContent);
        const duration = 2000; // 2 seconds
        const increment = targetNumber / (duration / 16); // 60fps
        let currentNumber = 0;

        const timer = setInterval(() => {
            currentNumber += increment;
            if (currentNumber >= targetNumber) {
                currentNumber = targetNumber;
                clearInterval(timer);
            }
            stat.textContent = Math.floor(currentNumber);
        }, 16);
    });
}

// Enhanced hero section entrance
function enhanceHeroEntrance() {
    const heroSection = document.querySelector('.hero-section');
    if (!heroSection) return;

    // Add entrance effect
    heroSection.style.opacity = '0';
    heroSection.style.transform = 'translateY(50px) scale(0.95)';

    setTimeout(() => {
        heroSection.style.transition = 'all 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        heroSection.style.opacity = '1';
        heroSection.style.transform = 'translateY(0) scale(1)';
    }, 100);
}

// Enhanced background image reveal
function enhanceBackgroundReveal() {
    const bgElements = document.querySelectorAll('.hero-section.bg-image::before');

    bgElements.forEach(bg => {
        bg.style.transition = 'all 2s ease-out';
        bg.style.opacity = '0';
        bg.style.transform = 'scale(1.1)';

        setTimeout(() => {
            bg.style.opacity = '0.3';
            bg.style.transform = 'scale(1)';
        }, 500);
    });
}

// Enhanced verse text animation
function enhanceVerseTextAnimation() {
    const verseTexts = document.querySelectorAll('.quran-verse-bg .verse-text');

    verseTexts.forEach((verse, index) => {
        verse.style.opacity = '0';
        verse.style.transform = 'translateY(20px) rotate(-5deg)';
        verse.style.transition = 'all 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

        setTimeout(() => {
            verse.style.opacity = '0.15';
            verse.style.transform = 'translateY(0) rotate(-5deg)';
        }, 300 + (index * 200));
    });
}

// Enhanced card hover effects
function enhanceCardHoverEffects() {
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-6px) scale(1.02)';
            this.style.boxShadow = '0 25px 50px rgba(145, 85, 253, 0.15)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = 'var(--shadow-card)';
        });
    });
}

// Enhanced button hover effects
function enhanceButtonHoverEffects() {
    const buttons = document.querySelectorAll('.btn, .mode-btn');

    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 8px 25px rgba(145, 85, 253, 0.2)';
        });

        btn.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'var(--shadow)';
        });
    });
}

// Enhanced stat cards animation
function enhanceStatCardsAnimation() {
    const statCards = document.querySelectorAll('.hero-stats .stat-item');

    statCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px) scale(0.9)';
        card.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) scale(1)';
        }, 200 + (index * 200));
    });
}

// Initialize all enhanced animations
function initEnhancedAnimations() {
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEnhancedAnimations);
        return;
    }

    // Initialize scroll animations
    initScrollAnimations();

    // Initialize enhanced entrance animations
    enhanceHeroEntrance();
    enhanceBackgroundReveal();
    enhanceVerseTextAnimation();

    // Initialize enhanced hover effects
    enhanceCardHoverEffects();
    enhanceButtonHoverEffects();

    // Initialize stat cards animation
    enhanceStatCardsAnimation();

    // Animate stat numbers after a delay
    setTimeout(animateStatNumbers, 1000);

    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
}

// Enhanced list item animations
function enhanceListAnimations() {
    const listItems = document.querySelectorAll('.list .item');

    listItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-30px) scale(0.95)';
        item.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0) scale(1)';
        }, 100 + (index * 100));
    });
}

// Enhanced search bar animation
function enhanceSearchBarAnimation() {
    const searchBar = document.querySelector('.search-bar');
    if (!searchBar) return;

    searchBar.style.opacity = '0';
    searchBar.style.opacity = '0';
    searchBar.style.transform = 'translateY(20px) scale(0.95)';
    searchBar.style.transition = 'all 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

    setTimeout(() => {
        searchBar.style.opacity = '1';
        searchBar.style.transform = 'translateY(0) scale(1)';
    }, 300);
}

// Enhanced mode buttons animation
function enhanceModeButtonsAnimation() {
    const modeButtons = document.querySelectorAll('.mode-btn');

    modeButtons.forEach((btn, index) => {
        btn.style.opacity = '0';
        btn.style.transform = 'translateY(30px) scale(0.9)';
        btn.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

        setTimeout(() => {
            btn.style.opacity = '1';
            btn.style.transform = 'translateY(0) scale(1)';
        }, 500 + (index * 200));
    });
}

// Enhanced footer animation
function enhanceFooterAnimation() {
    const footer = document.querySelector('footer');
    if (!footer) return;

    footer.style.opacity = '0';
    footer.style.transform = 'translateY(20px)';
    footer.style.transition = 'all 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

    setTimeout(() => {
        footer.style.opacity = '1';
        footer.style.transform = 'translateY(0)';
    }, 1200);
}

// Enhanced loading animations
function enhanceLoadingAnimations() {
    const spinners = document.querySelectorAll('.spinner-border');

    spinners.forEach(spinner => {
        spinner.style.animation = 'spinnerGlow 2s ease-in-out infinite';
    });
}

// Initialize all animations when page loads
document.addEventListener('DOMContentLoaded', function () {
    // Initialize enhanced animations
    initEnhancedAnimations();

    // Initialize specific section animations
    enhanceListAnimations();
    enhanceSearchBarAnimation();
    enhanceModeButtonsAnimation();
    enhanceFooterAnimation();
    enhanceLoadingAnimations();
});

// Enhanced scroll performance
let ticking = false;
function updateScrollAnimations() {
    if (!ticking) {
        requestAnimationFrame(() => {
            // Update scroll-based animations here
            ticking = false;
        });
        ticking = true;
    }
}

// Add scroll event listener for performance
window.addEventListener('scroll', updateScrollAnimations, { passive: true });

// ====== Font Customization Functions ======

// Font size presets
const fontSizes = {
    small: { size: '1.5rem', lineHeight: '2' },
    medium: { size: '2rem', lineHeight: '2.5' },
    large: { size: '2.5rem', lineHeight: '3' },
    xlarge: { size: '3rem', lineHeight: '3.5' }
};

// Font family presets
const fontFamilies = {
    'Amiri': 'Amiri, serif',
    'Scheherazade New': 'Scheherazade New, serif',
    'Noto Nastaliq Urdu': 'Noto Nastaliq Urdu, serif',
    'Reem Kufi': 'Reem Kufi, sans-serif',
    'Almarai': 'Almarai, sans-serif'
};

// Line height presets
const lineHeights = {
    tight: '1.8',
    normal: '2.5',
    relaxed: '3',
    loose: '3.5'
};

// Toggle font settings menu
function toggleFontSettingsMenu() {
    console.log('toggleFontSettingsMenu called');
    const menu = document.getElementById('fontSettingsMenu');
    console.log('Font settings menu element:', menu);

    if (!menu) {
        console.error('Font settings menu not found!');
        return;
    }

    if (menu.style.display === 'none' || menu.style.display === '') {
        menu.style.display = 'block';
        menu.classList.add('show');
        console.log('Font settings menu opened');
    } else {
        menu.style.display = 'none';
        menu.classList.remove('show');
        console.log('Font settings menu closed');
    }
}

// Font settings menu functions (kept for backward compatibility)
function toggleFontSizeMenu() {
    toggleFontSettingsMenu();
}

function toggleFontFamilyMenu() {
    toggleFontSettingsMenu();
}

function toggleLineHeightMenu() {
    toggleFontSettingsMenu();
}

// Font preview functions
function previewFontSize(size) {
    const preview = document.getElementById('fontPreview');
    if (!preview) return;

    // Remove existing font size classes
    preview.classList.remove('font-size-small', 'font-size-medium', 'font-size-large', 'font-size-xlarge');

    // Add new font size class
    preview.classList.add(`font-size-${size}`);

    // Apply font size directly to preview text
    const fontSizeMap = {
        'small': '1.5rem',
        'medium': '2rem',
        'large': '2.5rem',
        'xlarge': '3rem'
    };

    if (fontSizeMap[size]) {
        preview.style.fontSize = fontSizeMap[size];
    }

    // Update active state
    updatePreviewActiveState('fontSizeMenu', size);

    // Store preview settings
    window.fontPreviewSettings = window.fontPreviewSettings || {};
    window.fontPreviewSettings.size = size;
}

function previewFontFamily(family) {
    const preview = document.getElementById('fontPreview');
    if (!preview) return;

    // Remove existing font family classes
    preview.classList.remove('font-family-amiri', 'font-family-scheherazade', 'font-family-nastaliq', 'font-family-kufi', 'font-family-almarai');

    // Apply font family directly to preview text
    const fontFamilyMap = {
        'Amiri': 'Amiri, serif',
        'Scheherazade New': 'Scheherazade New, serif',
        'Noto Nastaliq Urdu': 'Noto Nastaliq Urdu, serif',
        'Reem Kufi': 'Reem Kufi, sans-serif',
        'Almarai': 'Almarai, sans-serif'
    };

    if (fontFamilyMap[family]) {
        preview.style.fontFamily = fontFamilyMap[family];
    }

    // Add new font family class based on selection
    let className = '';
    switch (family) {
        case 'Amiri':
            className = 'font-family-amiri';
            break;
        case 'Scheherazade New':
            className = 'font-family-scheherazade';
            break;
        case 'Noto Nastaliq Urdu':
            className = 'font-family-nastaliq';
            break;
        case 'Reem Kufi':
            className = 'font-family-kufi';
            break;
        case 'Almarai':
            className = 'font-family-almarai';
            break;
    }

    if (className) {
        preview.classList.add(className);
    }

    // Update active state
    updatePreviewActiveState('fontFamilyMenu', family);

    // Store preview settings
    window.fontPreviewSettings = window.fontPreviewSettings || {};
    window.fontPreviewSettings.family = family;
}

function previewLineHeight(height) {
    const preview = document.getElementById('fontPreview');
    if (!preview) return;

    // Remove existing line height classes
    preview.classList.remove('line-height-tight', 'line-height-normal', 'line-height-relaxed', 'line-height-loose');

    // Apply line height directly to preview text
    const lineHeightMap = {
        'tight': '1.8',
        'normal': '2.5',
        'relaxed': '3.2',
        'loose': '4'
    };

    if (lineHeightMap[height]) {
        preview.style.lineHeight = lineHeightMap[height];
    }

    // Add new line height class
    preview.classList.add(`line-height-${height}`);

    // Update active state
    updatePreviewActiveState('lineHeightMenu', height);

    // Store preview settings
    window.fontPreviewSettings = window.fontPreviewSettings || {};
    window.fontPreviewSettings.lineHeight = height;
}

function updatePreviewActiveState(menuId, selectedValue) {
    // This function will be updated to work with the new modal structure
    console.log('Updating preview active state for:', menuId, selectedValue);
}

function initializeFontPreview() {
    // Load current font settings into preview
    const preview = document.getElementById('fontPreview');
    if (!preview) return;

    // Reset preview to default
    preview.className = 'preview-text';

    // Apply current settings
    const currentSize = localStorage.getItem('qc-font-size') || 'medium';
    const currentFamily = localStorage.getItem('qc-font-family') || 'Amiri';
    const currentLineHeight = localStorage.getItem('qc-line-height') || 'normal';

    // Initialize preview settings
    window.fontPreviewSettings = {
        size: currentSize,
        family: currentFamily,
        lineHeight: currentLineHeight
    };

    // Apply preview settings
    previewFontSize(currentSize);
    previewFontFamily(currentFamily);
    previewLineHeight(currentLineHeight);

    // Update active states
    updateAllPreviewActiveStates();
}

function resetFontPreview() {
    const preview = document.getElementById('fontPreview');
    if (!preview) return;

    // Reset to default settings
    preview.className = 'preview-text';
    preview.style.fontSize = '2rem';
    preview.style.fontFamily = 'Amiri, serif';
    preview.style.lineHeight = '2.5';

    // Reset preview settings
    window.fontPreviewSettings = {
        size: 'medium',
        family: 'Amiri',
        lineHeight: 'normal'
    };

    // Update active states
    updateAllPreviewActiveStates();
}

function applyFontSettings() {
    if (!window.fontPreviewSettings) return;

    // Apply the preview settings to the actual reading section
    const { size, family, lineHeight } = window.fontPreviewSettings;

    if (size) changeFontSize(size);
    if (family) changeFontFamily(family);
    if (lineHeight) changeLineHeight(lineHeight);

    // Close the modal
    toggleFontSettingsMenu();

    // Show success message
    showFontSettingsApplied();
}

function showFontSettingsApplied() {
    // Create a temporary success message
    const message = document.createElement('div');
    message.className = 'font-settings-success';
    message.textContent = 'تم تطبيق إعدادات الفونت بنجاح!';
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
    `;

    document.body.appendChild(message);

    // Remove after 3 seconds
    setTimeout(() => {
        message.remove();
    }, 3000);
}

function updateAllPreviewActiveStates() {
    // Update all active states in the modal
    const { size = 'medium', family = 'Amiri', lineHeight = 'normal' } = window.fontPreviewSettings || {};

    // Update font size active state
    document.querySelectorAll('[onclick*="previewFontSize"]').forEach(btn => {
        btn.classList.remove('active');
        if (btn.onclick.toString().includes(size)) {
            btn.classList.add('active');
        }
    });

    // Update font family active state
    document.querySelectorAll('[onclick*="previewFontFamily"]').forEach(btn => {
        btn.classList.remove('active');
        if (btn.onclick.toString().includes(family)) {
            btn.classList.add('active');
        }
    });

    // Update line height active state
    document.querySelectorAll('[onclick*="previewLineHeight"]').forEach(btn => {
        btn.classList.remove('active');
        if (btn.onclick.toString().includes(lineHeight)) {
            btn.classList.add('active');
        }
    });
}

// Change font size
function changeFontSize(size) {
    console.log('changeFontSize called with size:', size);
    const readingSection = document.getElementById('readingSection');
    console.log('Reading section element:', readingSection);

    if (!readingSection) {
        console.error('Reading section not found!');
        return;
    }

    // Remove existing font size classes
    readingSection.classList.remove('font-size-small', 'font-size-medium', 'font-size-large', 'font-size-xlarge');

    // Add new font size class
    readingSection.classList.add(`font-size-${size}`);
    console.log('Font size class added:', `font-size-${size}`);

    // Save to localStorage
    localStorage.setItem('qc-font-size', size);

    // Close menu
    toggleFontSizeMenu();

    // Update active state
    updateFontOptionActiveState('fontSizeMenu', size);
}

// Change font family
function changeFontFamily(family) {
    console.log('changeFontFamily called with family:', family);
    const readingSection = document.getElementById('readingSection');
    console.log('Reading section element:', readingSection);

    if (!readingSection) {
        console.error('Reading section not found!');
        return;
    }

    // Remove existing font family classes
    readingSection.classList.remove('font-family-amiri', 'font-family-scheherazade', 'font-family-nastaliq', 'font-family-kufi', 'font-family-almarai');

    // Add new font family class based on selection
    let className = '';
    switch (family) {
        case 'Amiri':
            className = 'font-family-amiri';
            break;
        case 'Scheherazade New':
            className = 'font-family-scheherazade';
            break;
        case 'Noto Nastaliq Urdu':
            className = 'font-family-nastaliq';
            break;
        case 'Reem Kufi':
            className = 'font-family-kufi';
            break;
        case 'Almarai':
            className = 'font-family-almarai';
            break;
    }

    if (className) {
        readingSection.classList.add(className);
        console.log('Font family class added:', className);
    }

    // Save to localStorage
    localStorage.setItem('qc-font-family', family);

    // Close menu
    toggleFontFamilyMenu();

    // Update active state
    updateFontOptionActiveState('fontFamilyMenu', family);
}

// Change line height
function changeLineHeight(height) {
    console.log('changeLineHeight called with height:', height);
    const readingSection = document.getElementById('readingSection');
    console.log('Reading section element:', readingSection);

    if (!readingSection) {
        console.error('Reading section not found!');
        return;
    }

    // Remove existing line height classes
    readingSection.classList.remove('line-height-tight', 'line-height-normal', 'line-height-relaxed', 'line-height-loose');

    // Add new line height class
    readingSection.classList.add(`line-height-${height}`);
    console.log('Line height class added:', `line-height-${height}`);

    // Save to localStorage
    localStorage.setItem('qc-line-height', height);

    // Close menu
    toggleFontFamilyMenu();

    // Update active state
    updateFontOptionActiveState('lineHeightMenu', height);
}

// Update active state of font options
function updateFontOptionActiveState(menuId, selectedValue) {
    const menu = document.getElementById(menuId);
    if (!menu) return;

    // Remove active class from all options
    const options = menu.querySelectorAll('.font-option');
    options.forEach(option => option.classList.remove('active'));

    // Add active class to selected option
    const selectedOption = Array.from(options).find(option => {
        if (menuId === 'fontSizeMenu') {
            return option.textContent.includes(getFontSizeLabel(selectedValue));
        } else if (menuId === 'fontFamilyMenu') {
            return option.textContent.includes(selectedValue);
        } else if (menuId === 'lineHeightMenu') {
            return option.textContent.includes(getLineHeightLabel(selectedValue));
        }
        return false;
    });

    if (selectedOption) {
        selectedOption.classList.add('active');
    }
}

// Get font size label
function getFontSizeLabel(size) {
    const labels = {
        small: 'صغير',
        medium: 'متوسط',
        large: 'كبير',
        xlarge: 'كبير جداً'
    };
    return labels[size] || size;
}

// Get line height label
function getLineHeightLabel(height) {
    const labels = {
        tight: 'مضغوط',
        normal: 'عادي',
        relaxed: 'مريح',
        loose: 'واسع'
    };
    return labels[height] || height;
}

// Load saved font preferences
function loadFontPreferences() {
    const readingSection = document.getElementById('readingSection');
    if (!readingSection) return;

    console.log('Loading font preferences...');

    // Load font size
    const savedSize = localStorage.getItem('qc-font-size');
    if (savedSize && fontSizes[savedSize]) {
        console.log('Loading saved font size:', savedSize);
        changeFontSize(savedSize);
    }

    // Load font family
    const savedFamily = localStorage.getItem('qc-font-family');
    if (savedFamily && fontFamilies[savedFamily]) {
        console.log('Loading saved font family:', savedFamily);
        changeFontFamily(savedFamily);
    }

    // Load line height
    const savedLineHeight = localStorage.getItem('qc-line-height');
    if (savedLineHeight && lineHeights[savedLineHeight]) {
        console.log('Loading saved line height:', savedLineHeight);
        changeLineHeight(savedLineHeight);
    }
}

// Close font settings menu when clicking outside
document.addEventListener('click', function (event) {
    const fontSettingsMenu = document.getElementById('fontSettingsMenu');
    const fontSettingsBtn = document.getElementById('fontSettingsBtn');

    if (!fontSettingsMenu || !fontSettingsBtn) return;

    let clickedInside = false;

    // Check if click is inside font settings button
    if (fontSettingsBtn.contains(event.target)) {
        clickedInside = true;
    }

    // Check if click is inside font settings menu
    if (fontSettingsMenu.contains(event.target)) {
        clickedInside = true;
    }

    // Close menu if clicked outside
    if (!clickedInside) {
        fontSettingsMenu.style.display = 'none';
        fontSettingsMenu.classList.remove('show');
    }
});

// Initialize font preferences when page loads
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM Content Loaded - Initializing font preferences');

    // Test if all elements exist
    const fontSettingsBtn = document.getElementById('fontSettingsBtn');
    const fontSettingsMenu = document.getElementById('fontSettingsMenu');
    const readingSection = document.getElementById('readingSection');

    console.log('Font controls found:', {
        fontSettingsBtn: fontSettingsBtn,
        fontSettingsMenu: fontSettingsMenu,
        readingSection: readingSection
    });

    // Test event listeners
    if (fontSettingsBtn) {
        fontSettingsBtn.addEventListener('click', function (e) {
            console.log('Font settings button clicked!', e);
        });
    }

    // Load font preferences after a short delay to ensure DOM is ready
    setTimeout(loadFontPreferences, 100);
});

// Toggle sidebar function
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        if (sidebar.style.display === 'none' || sidebar.style.display === '') {
            sidebar.style.display = 'block';
            sidebar.classList.add('show');
        } else {
            sidebar.classList.remove('show');
            setTimeout(() => {
                sidebar.style.display = 'none';
            }, 300);
        }
    }
}
