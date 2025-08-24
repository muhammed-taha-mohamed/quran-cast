// ====== Hadith Page JavaScript ======

let currentHadith = null;
let allHadiths = [];

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    loadHadithsFromAPI();
});

// Initialize theme for hadith page
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// Load hadiths from public API
async function loadHadithsFromAPI() {
    try {
        // Using multiple hadith APIs for better coverage
        const apis = [
            'https://api.hadith.gading.dev/books',
            'https://api.hadith.gading.dev/books/bukhari',
            'https://api.hadith.gading.dev/books/muslim'
        ];

        const responses = await Promise.allSettled(apis.map(url => fetch(url)));

        // Fallback to local hadiths if APIs fail
        if (responses.some(r => r.status === 'fulfilled')) {
            await loadHadithsFromMultipleSources();
        } else {
            loadLocalHadiths();
        }

        // Show initial hadith
        await getRandomHadith();

    } catch (error) {
        console.error('Error loading hadiths from API:', error);
        loadLocalHadiths();
        await getRandomHadith();
    }
}

// Load hadiths from multiple sources
async function loadHadithsFromMultipleSources() {
    try {
        // Try to get hadiths from various sources
        const sources = [
            'https://api.hadith.gading.dev/books/bukhari/1',
            'https://api.hadith.gading.dev/books/muslim/1',
            'https://api.hadith.gading.dev/books/abudawud/1'
        ];

        for (const source of sources) {
            try {
                const response = await fetch(source);
                if (response.ok) {
                    const data = await response.json();
                    if (data.data && data.data.hadiths) {
                        processAPIHadiths(data.data.hadiths, source);
                    }
                }
            } catch (e) {
                console.log(`Failed to load from ${source}:`, e);
            }
        }
    } catch (error) {
        console.error('Error loading from multiple sources:', error);
        loadLocalHadiths();
    }
}

// Process hadiths from API
function processAPIHadiths(hadiths, source) {
    const processed = hadiths.map(h => ({
        text: h.arab || h.text || '',
        narrator: h.narrator || 'غير محدد',
        grade: h.grade || 'غير محدد',
        category: determineCategory(h.text || ''),
        source: source.includes('bukhari') ? 'صحيح البخاري' :
            source.includes('muslim') ? 'صحيح مسلم' :
                source.includes('abudawud') ? 'سنن أبي داود' : 'مصدر إسلامي',
        book: source.includes('bukhari') ? 'البخاري' :
            source.includes('muslim') ? 'مسلم' :
                source.includes('abudawud') ? 'أبي داود' : 'غير محدد'
    })).filter(h => h.text && h.text.length > 10);

    allHadiths.push(...processed);
}

// Determine category based on text content
function determineCategory(text) {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('صلاة') || lowerText.includes('صوم') || lowerText.includes('زكاة') || lowerText.includes('حج')) {
        return 'العبادات';
    } else if (lowerText.includes('إيمان') || lowerText.includes('توحيد') || lowerText.includes('عقيدة')) {
        return 'العقيدة';
    } else if (lowerText.includes('أخلاق') || lowerText.includes('أدب') || lowerText.includes('سلوك')) {
        return 'الأخلاق';
    } else if (lowerText.includes('معاملات') || lowerText.includes('بيع') || lowerText.includes('شراء')) {
        return 'المعاملات';
    } else {
        return 'الآداب';
    }
}

// Load local hadiths as fallback
function loadLocalHadiths() {
    allHadiths = [
        {
            text: "من حسن إسلام المرء تركه ما لا يعنيه",
            narrator: "أبو هريرة",
            grade: "حسن",
            category: "الأخلاق",
            source: "رواه الترمذي",
            book: "الترمذي"
        },
        {
            text: "المسلم من سلم المسلمون من لسانه ويده",
            narrator: "أبو هريرة",
            grade: "صحيح",
            category: "الأخلاق",
            source: "رواه البخاري ومسلم",
            book: "البخاري"
        },
        {
            text: "لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه",
            narrator: "أنس بن مالك",
            grade: "صحيح",
            category: "العقيدة",
            source: "رواه البخاري ومسلم",
            book: "مسلم"
        },
        {
            text: "إنما الأعمال بالنيات وإنما لكل امرئ ما نوى",
            narrator: "عمر بن الخطاب",
            grade: "صحيح",
            category: "العقيدة",
            source: "رواه البخاري ومسلم",
            book: "البخاري"
        },
        {
            text: "من كان يؤمن بالله واليوم الآخر فليقل خيراً أو ليصمت",
            narrator: "أبو هريرة",
            grade: "صحيح",
            category: "الأخلاق",
            source: "رواه البخاري ومسلم",
            book: "مسلم"
        },
        {
            text: "من حسن إسلام المرء قلة الكلام فيما لا يعنيه",
            narrator: "أبو هريرة",
            grade: "حسن",
            category: "الأخلاق",
            source: "رواه الترمذي",
            book: "الترمذي"
        },
        {
            text: "إن الله لا ينظر إلى صوركم وأموالكم ولكن ينظر إلى قلوبكم وأعمالكم",
            narrator: "أبو هريرة",
            grade: "صحيح",
            category: "العقيدة",
            source: "رواه مسلم",
            book: "مسلم"
        },
        {
            text: "من صلى علي صلاة صلى الله عليه بها عشراً",
            narrator: "أبو هريرة",
            grade: "صحيح",
            category: "العبادات",
            source: "رواه مسلم",
            book: "مسلم"
        },
        {
            text: "من سلك طريقاً يلتمس فيه علماً سهل الله له به طريقاً إلى الجنة",
            narrator: "أبو هريرة",
            grade: "صحيح",
            category: "الآداب",
            source: "رواه مسلم",
            book: "مسلم"
        },
        {
            text: "من بنى لله مسجداً بنى الله له في الجنة مثله",
            narrator: "عثمان بن عفان",
            grade: "صحيح",
            category: "العبادات",
            source: "رواه البخاري ومسلم",
            book: "البخاري"
        },
        {
            text: "من أطعم مسكيناً أطعمه الله من ثمار الجنة",
            narrator: "علي بن أبي طالب",
            grade: "حسن",
            category: "المعاملات",
            source: "رواه الترمذي",
            book: "الترمذي"
        },
        {
            text: "من كذب علي متعمداً فليتبوأ مقعده من النار",
            narrator: "عبد الله بن مسعود",
            grade: "صحيح",
            category: "الأخلاق",
            source: "رواه البخاري ومسلم",
            book: "البخاري"
        },
        {
            text: "من صلى الفجر في جماعة فهو في ذمة الله",
            narrator: "سمرة بن جندب",
            grade: "صحيح",
            category: "العبادات",
            source: "رواه مسلم",
            book: "مسلم"
        },
        {
            text: "من قرأ حرفاً من كتاب الله فله به حسنة والحسنة بعشر أمثالها",
            narrator: "عبد الله بن مسعود",
            grade: "حسن",
            category: "العبادات",
            source: "رواه الترمذي",
            book: "الترمذي"
        },
        {
            text: "من صلى العشاء في جماعة فكأنما قام نصف الليل",
            narrator: "أبو هريرة",
            grade: "صحيح",
            category: "العبادات",
            source: "رواه مسلم",
            book: "مسلم"
        }
    ];
}

// Get random hadith
async function getRandomHadith() {
    try {
        if (allHadiths.length === 0) {
            loadLocalHadiths();
        }

        const randomIndex = Math.floor(Math.random() * allHadiths.length);
        currentHadith = allHadiths[randomIndex];
        updateHadithDisplay();

        // Clear any previous search results
        clearSearchResults();

    } catch (error) {
        console.error('Error fetching hadith:', error);
        showHadithError();
    }
}

// Update hadith display
function updateHadithDisplay() {
    if (!currentHadith) return;

    const textElement = document.getElementById('hadithText');
    const narratorElement = document.getElementById('narratorName');
    const gradeElement = document.getElementById('gradeText');

    if (textElement) {
        textElement.innerHTML = `
            <div class="hadith-text-content">
                <p class="fs-4 fw-bold text-primary mb-3">${currentHadith.text}</p>
                <p class="text-muted fs-6">${currentHadith.source}</p>
                ${currentHadith.book ? `<p class="text-info fs-6">${currentHadith.book}</p>` : ''}
            </div>
        `;
    }

    if (narratorElement) narratorElement.textContent = currentHadith.narrator;
    if (gradeElement) gradeElement.textContent = currentHadith.grade;
}

// Show hadith error
function showHadithError() {
    const content = document.getElementById('hadithContent');
    if (content) {
        content.innerHTML = `
            <div class="alert alert-danger text-center p-4">
                <i class="bi bi-exclamation-triangle me-2"></i>
                تعذّر تحميل الحديث
                <br><br>
                <button class="btn btn-primary" onclick="loadHadithsFromAPI()">
                    <i class="bi bi-arrow-clockwise me-2"></i>إعادة المحاولة
                </button>
            </div>
        `;
    }
}

// Refresh hadith
async function refreshHadith() {
    await getRandomHadith();
}

// Get hadith by category
async function getHadithByCategory(category) {
    try {
        const categoryHadiths = allHadiths.filter(h => h.category === category);

        if (categoryHadiths.length > 0) {
            const randomIndex = Math.floor(Math.random() * categoryHadiths.length);
            currentHadith = categoryHadiths[randomIndex];
            updateHadithDisplay();

            // Show category info
            showCategoryInfo(category, categoryHadiths.length);
        } else {
            showNoResults('', '', category);
        }

    } catch (error) {
        console.error('Error fetching hadith by category:', error);
    }
}

// Show category information
function showCategoryInfo(category, count) {
    const content = document.getElementById('hadithContent');
    if (content) {
        const categoryInfo = document.createElement('div');
        categoryInfo.className = 'alert alert-info text-center mb-3';
        categoryInfo.innerHTML = `
            <i class="bi bi-collection me-2"></i>
            تم عرض حديث من قسم: <strong>${category}</strong>
            <br>إجمالي الأحاديث في هذا القسم: <strong>${count}</strong>
        `;

        // Insert before the hadith content
        const hadithText = content.querySelector('.hadith-text');
        if (hadithText) {
            hadithText.parentNode.insertBefore(categoryInfo, hadithText);
        }
    }
}

// Search and filter hadiths
function searchHadiths() {
    const searchQuery = document.getElementById('hadithSearch').value.trim();
    const narratorFilter = document.getElementById('narratorFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;

    if (!searchQuery && !narratorFilter && !categoryFilter) {
        // If no filters, show random hadith
        getRandomHadith();
        return;
    }

    // Filter hadiths based on criteria
    const filteredHadiths = allHadiths.filter(hadith => {
        let matches = true;

        // Text search
        if (searchQuery) {
            matches = matches && hadith.text.includes(searchQuery);
        }

        // Narrator filter
        if (narratorFilter) {
            matches = matches && hadith.narrator === narratorFilter;
        }

        // Category filter
        if (categoryFilter) {
            matches = matches && hadith.category === categoryFilter;
        }

        return matches;
    });

    if (filteredHadiths.length > 0) {
        // Show first matching hadith
        currentHadith = filteredHadiths[0];
        updateHadithDisplay();

        // Show results count
        showSearchResults(filteredHadiths.length, searchQuery, narratorFilter, categoryFilter);
    } else {
        showNoResults(searchQuery, narratorFilter, categoryFilter);
    }
}

// Show search results count
function showSearchResults(count, searchQuery, narratorFilter, categoryFilter) {
    const content = document.getElementById('hadithContent');
    if (content) {
        const resultsInfo = document.createElement('div');
        resultsInfo.className = 'alert alert-success text-center mb-3';
        resultsInfo.innerHTML = `
            <i class="bi bi-check-circle me-2"></i>
            تم العثور على <strong>${count}</strong> حديث
            ${searchQuery ? `<br>مطابق لـ: <strong>"${searchQuery}"</strong>` : ''}
            ${narratorFilter ? `<br>من رواية: <strong>${narratorFilter}</strong>` : ''}
            ${categoryFilter ? `<br>في قسم: <strong>${categoryFilter}</strong>` : ''}
        `;

        // Insert before the hadith content
        const hadithText = content.querySelector('.hadith-text');
        if (hadithText) {
            hadithText.parentNode.insertBefore(resultsInfo, hadithText);
        }
    }
}

// Show no results message
function showNoResults(searchQuery, narratorFilter, categoryFilter) {
    const content = document.getElementById('hadithContent');
    if (content) {
        content.innerHTML = `
            <div class="alert alert-warning text-center p-4">
                <i class="bi bi-exclamation-triangle me-2"></i>
                لم يتم العثور على أحاديث مطابقة للبحث
                ${searchQuery ? `<br><strong>"${searchQuery}"</strong>` : ''}
                ${narratorFilter ? `<br>من رواية: <strong>${narratorFilter}</strong>` : ''}
                ${categoryFilter ? `<br>في قسم: <strong>${categoryFilter}</strong>` : ''}
                <br><br>
                <button class="btn btn-primary" onclick="refreshHadith()">
                    <i class="bi bi-arrow-clockwise me-2"></i>عرض حديث عشوائي
                </button>
            </div>
        `;
    }
}

// Clear search filters
function clearFilters() {
    document.getElementById('hadithSearch').value = '';
    document.getElementById('narratorFilter').value = '';
    document.getElementById('categoryFilter').value = '';
    clearSearchResults();
    getRandomHadith();
}

// Clear search results display
function clearSearchResults() {
    const content = document.getElementById('hadithContent');
    if (content) {
        // Remove any alert messages
        const alerts = content.querySelectorAll('.alert');
        alerts.forEach(alert => alert.remove());
    }
}

// Toggle language
function toggleLanguage() {
    const langText = document.getElementById('langText');
    if (langText) {
        langText.textContent = langText.textContent === 'English' ? 'العربية' : 'English';
    }
}

// Theme toggle for hadith page
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

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
