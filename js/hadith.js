// Hadith API Configuration
const HADITH_API_KEY = '$2y$10$6j86fNYbkGT5RgLG4sKBOuaSus1tDzFA1nnfsyzq9dXimqXj4YNO';
const HADITH_API_BASE = 'https://hadithapi.com/api';

// Global variables
let currentHadith = null;
let allHadiths = [];
let allBooks = [];
let currentBook = null;
let currentChapter = null;
let allChapters = [];
let currentPage = 1;
let totalPages = 1;
let searchQuery = '';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    // Don't load hadith data until the page is actually shown
    console.log('DOM loaded, hadith will be initialized when page is shown');
});

// Initialize hadith page when section becomes visible
function initializeHadithPage() {
    console.log('Initializing hadith page...');
    
    // Load local data first for immediate display
    loadLocalBooks();
    setupEventListeners();
    
    // Try to load from API in background
    setTimeout(() => {
        loadBooksFromAPI();
    }, 1000);
    
    console.log('Hadith page initialized with local data');
}

// Load books from API
async function loadBooksFromAPI() {
    try {
        showLoading(true);
        hideError();

        const response = await fetch(`${HADITH_API_BASE}/books?apiKey=${HADITH_API_KEY}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 200 && data.books) {
            // Transform API data to match our format
            allBooks = data.books.map(book => ({
                slug: book.bookSlug,
                title: book.bookName,
                writer: book.writerName,
                hadithsCount: book.hadiths_count,
                chaptersCount: book.chapters_count
            }));

            console.log('Books loaded successfully from API:', allBooks.length);
            populateBooksDropdown();

            // Load first book's chapters by default
            if (allBooks.length > 0) {
                currentBook = allBooks[0];
                await loadChaptersFromAPI(allBooks[0].slug);
            }
        } else {
            throw new Error(data.message || 'Failed to load books');
        }

    } catch (error) {
        console.error('Error loading books:', error);
        showError('خطأ في تحميل الكتب. جاري التحميل من البيانات المحلية...');
        loadLocalBooks();
    } finally {
        showLoading(false);
    }
}

// Load chapters for a specific book
async function loadChaptersFromAPI(bookSlug) {
    try {
        showLoading(true);

        const response = await fetch(`${HADITH_API_BASE}/${bookSlug}/chapters?apiKey=${HADITH_API_KEY}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 200 && data.chapters) {
            // Transform API data to match our format
            allChapters = data.chapters.map(chapter => ({
                slug: chapter.chapterSlug,
                title: chapter.chapterName,
                hadithsCount: chapter.hadiths_count
            }));

            console.log('Chapters loaded successfully from API:', allChapters.length);
            populateChaptersDropdown();

            // Load first chapter's hadiths by default
            if (allChapters.length > 0) {
                currentChapter = allChapters[0];
                await loadHadithsFromAPI(1);
            }
        } else {
            throw new Error(data.message || 'Failed to load chapters');
        }

    } catch (error) {
        console.error('Error loading chapters:', error);
        showError('خطأ في تحميل الأبواب. جاري التحميل من البيانات المحلية...');
        loadLocalChapters();
    } finally {
        showLoading(false);
    }
}

// Load hadiths from API
async function loadHadithsFromAPI(page = 1) {
    try {
        showLoading(true);
        hideError();

        let url = `${HADITH_API_BASE}/hadiths/?apiKey=${HADITH_API_KEY}&page=${page}`;

        if (currentBook) {
            url += `&book=${currentBook.slug}`;
        }

        if (currentChapter) {
            url += `&chapter=${currentChapter.slug}`;
        }

        if (searchQuery) {
            url += `&search=${encodeURIComponent(searchQuery)}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 200 && data.hadiths) {
            // Transform API data to match our format
            allHadiths = data.hadiths.map(hadith => ({
                id: hadith.id,
                hadithNumber: hadith.hadithNumber,
                arabic: hadith.arabic,
                urdu: hadith.urdu || '',
                english: hadith.english || '',
                book: hadith.book,
                chapter: hadith.chapter || '',
                status: hadith.status || 'sahih'
            }));

            currentPage = data.current_page || 1;
            totalPages = data.last_page || 1;

            console.log('Hadiths loaded successfully from API:', allHadiths.length);
            displayHadiths();
            updatePagination();
        } else {
            throw new Error(data.message || 'Failed to load hadiths');
        }

    } catch (error) {
        console.error('Error loading hadiths:', error);
        showError('خطأ في تحميل الأحاديث. جاري التحميل من البيانات المحلية...');
        loadLocalHadiths();
    } finally {
        showLoading(false);
    }
}

// Populate books dropdown
function populateBooksDropdown() {
    const booksSelect = document.getElementById('bookSelect');
    if (!booksSelect) return;

    booksSelect.innerHTML = '<option value="">اختر كتاب</option>';

    allBooks.forEach(book => {
        const option = document.createElement('option');
        option.value = book.slug;
        option.textContent = `${book.title} (${book.hadithsCount} حديث)`;
        option.title = `المؤلف: ${book.writer} - عدد الأحاديث: ${book.hadithsCount} - عدد الأبواب: ${book.chaptersCount}`;
        booksSelect.appendChild(option);
    });

    if (currentBook) {
        booksSelect.value = currentBook.slug;
    }

    console.log('Books dropdown populated with', allBooks.length, 'books');
}

// Populate chapters dropdown
function populateChaptersDropdown() {
    const chaptersSelect = document.getElementById('chapterSelect');
    if (!chaptersSelect) return;

    chaptersSelect.innerHTML = '<option value="">اختر باب</option>';

    allChapters.forEach(chapter => {
        const option = document.createElement('option');
        option.value = chapter.slug;
        option.textContent = `${chapter.title} (${chapter.hadithsCount} حديث)`;
        option.title = `عدد الأحاديث: ${chapter.hadithsCount}`;
        chaptersSelect.appendChild(option);
    });

    if (currentChapter) {
        chaptersSelect.value = currentChapter.slug;
    }
}

// Display hadiths
function displayHadiths() {
    const container = document.getElementById('hadithContainer');
    if (!container) return;

    if (allHadiths.length === 0) {
        container.innerHTML = `
            <div class="no-hadiths text-center py-5">
                <i class="bi bi-book display-1 text-muted mb-3"></i>
                <h3 class="text-muted">لا توجد أحاديث</h3>
                <p class="text-muted">لم يتم العثور على أحاديث مطابقة للبحث</p>
                <button class="btn btn-outline-primary" onclick="searchQuery = ''; document.getElementById('hadithSearch').value = ''; loadHadithsFromAPI(1);">
                    <i class="bi bi-arrow-clockwise me-2"></i>إعادة تحميل
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = allHadiths.map(hadith => `
        <div class="hadith-card" data-hadith-id="${hadith.id}">
            <div class="hadith-header">
                <div class="hadith-number">#${hadith.hadithNumber}</div>
                <div class="hadith-status ${hadith.status}">${hadith.status}</div>
            </div>
            <div class="hadith-content">
                <div class="hadith-text">
                    <div class="arabic-text">${hadith.arabic}</div>
                    ${hadith.urdu ? `<div class="urdu-text">${hadith.urdu}</div>` : ''}
                    ${hadith.english ? `<div class="english-text">${hadith.english}</div>` : ''}
                </div>
                <div class="hadith-meta">
                    <span class="book-name">${hadith.book}</span>
                    ${hadith.chapter ? `<span class="chapter-name">${hadith.chapter}</span>` : ''}
                    <span class="hadith-status-badge ${hadith.status}">${hadith.status}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Update pagination
function updatePagination() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');

    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
        prevBtn.classList.toggle('disabled', currentPage <= 1);
    }

    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
        nextBtn.classList.toggle('disabled', currentPage >= totalPages);
    }

    if (pageInfo) {
        pageInfo.textContent = `صفحة ${currentPage} من ${totalPages}`;
    }
}

// Change page
function changePage(page) {
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    loadHadithsFromAPI(page);
}

// Search hadiths
function searchHadiths() {
    const searchInput = document.getElementById('hadithSearch');
    if (!searchInput) return;

    searchQuery = searchInput.value.trim();
    currentPage = 1;

    // Search in local data
    searchLocalHadiths();
}

// Search in local hadiths
function searchLocalHadiths() {
    if (!searchQuery) {
        // If no search query, show all hadiths
        loadLocalHadiths();
        return;
    }

    // Filter hadiths based on search query
    const filteredHadiths = allHadiths.filter(hadith => {
        const searchLower = searchQuery.toLowerCase();
        return (
            hadith.arabic.toLowerCase().includes(searchLower) ||
            hadith.english.toLowerCase().includes(searchLower) ||
            hadith.urdu.toLowerCase().includes(searchLower) ||
            hadith.book.toLowerCase().includes(searchLower) ||
            hadith.chapter.toLowerCase().includes(searchLower)
        );
    });

    // Display filtered results
    const container = document.getElementById('hadithContainer');
    if (!container) return;

    if (filteredHadiths.length === 0) {
        container.innerHTML = `
            <div class="no-hadiths text-center py-5">
                <i class="bi bi-search display-1 text-muted mb-3"></i>
                <h3 class="text-muted">لا توجد نتائج</h3>
                <p class="text-muted">لم يتم العثور على أحاديث مطابقة للبحث: "${searchQuery}"</p>
                <button class="btn btn-outline-primary" onclick="searchQuery = ''; document.getElementById('hadithSearch').value = ''; searchLocalHadiths();">
                    <i class="bi bi-arrow-clockwise me-2"></i>إعادة البحث
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredHadiths.map(hadith => `
        <div class="hadith-card" data-hadith-id="${hadith.id}">
            <div class="hadith-header">
                <div class="hadith-number">#${hadith.hadithNumber}</div>
                <div class="hadith-status ${hadith.status}">${hadith.status}</div>
            </div>
            <div class="hadith-content">
                <div class="hadith-text">
                    <div class="arabic-text">${hadith.arabic}</div>
                    ${hadith.urdu ? `<div class="urdu-text">${hadith.urdu}</div>` : ''}
                    ${hadith.english ? `<div class="english-text">${hadith.english}</div>` : ''}
                </div>
                <div class="hadith-meta">
                    <span class="book-name">${hadith.book}</span>
                    ${hadith.chapter ? `<span class="chapter-name">${hadith.chapter}</span>` : ''}
                    <span class="hadith-status-badge ${hadith.status}">${hadith.status}</span>
                </div>
            </div>
        </div>
    `).join('');

    updatePagination();
}

// Filter local hadiths by book and chapter
function filterLocalHadiths() {
    let filteredHadiths = allHadiths;

    // Filter by book if selected
    if (currentBook) {
        filteredHadiths = filteredHadiths.filter(hadith =>
            hadith.book === currentBook.title
        );
    }

    // Filter by chapter if selected
    if (currentChapter) {
        filteredHadiths = filteredHadiths.filter(hadith =>
            hadith.chapter === currentChapter.title
        );
    }

    // Apply search filter if there's a search query
    if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        filteredHadiths = filteredHadiths.filter(hadith => {
            return (
                hadith.arabic.toLowerCase().includes(searchLower) ||
                hadith.english.toLowerCase().includes(searchLower) ||
                hadith.urdu.toLowerCase().includes(searchLower) ||
                hadith.book.toLowerCase().includes(searchLower) ||
                hadith.chapter.toLowerCase().includes(searchLower)
            );
        });
    }

    // Display filtered results
    const container = document.getElementById('hadithContainer');
    if (!container) return;

    if (filteredHadiths.length === 0) {
        container.innerHTML = `
            <div class="no-hadiths text-center py-5">
                <i class="bi bi-funnel display-1 text-muted mb-3"></i>
                <h3 class="text-muted">لا توجد أحاديث</h3>
                <p class="text-muted">لم يتم العثور على أحاديث مطابقة للتصفية المحددة</p>
                <button class="btn btn-outline-primary" onclick="currentBook = null; currentChapter = null; searchQuery = ''; document.getElementById('bookSelect').value = ''; document.getElementById('chapterSelect').value = ''; document.getElementById('hadithSearch').value = ''; loadLocalHadiths();">
                    <i class="bi bi-arrow-clockwise me-2"></i>إعادة تعيين
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredHadiths.map(hadith => `
        <div class="hadith-card" data-hadith-id="${hadith.id}">
            <div class="hadith-header">
                <div class="hadith-number">#${hadith.hadithNumber}</div>
                <div class="hadith-status ${hadith.status}">${hadith.status}</div>
            </div>
            <div class="hadith-content">
                <div class="hadith-text">
                    <div class="arabic-text">${hadith.arabic}</div>
                    ${hadith.urdu ? `<div class="urdu-text">${hadith.urdu}</div>` : ''}
                    ${hadith.english ? `<div class="english-text">${hadith.english}</div>` : ''}
                </div>
                <div class="hadith-meta">
                    <span class="book-name">${hadith.book}</span>
                    ${hadith.chapter ? `<span class="chapter-name">${hadith.chapter}</span>` : ''}
                    <span class="hadith-status-badge ${hadith.status}">${hadith.status}</span>
                </div>
            </div>
        </div>
    `).join('');

    updatePagination();
}

// Setup event listeners
function setupEventListeners() {
    // Book selection
    const bookSelect = document.getElementById('bookSelect');
    if (bookSelect) {
        bookSelect.addEventListener('change', onBookChange);
    }

    // Chapter selection
    const chapterSelect = document.getElementById('chapterSelect');
    if (chapterSelect) {
        chapterSelect.addEventListener('change', onChapterChange);
    }

    // Search input
    const searchInput = document.getElementById('hadithSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchHadiths, 500));
    }

    // Pagination buttons
    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => changePage(currentPage - 1));
    }

    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => changePage(currentPage + 1));
    }
}

// Book change handler
async function onBookChange(event) {
    const bookSlug = event.target.value;
    if (!bookSlug) {
        currentBook = null;
        allChapters = [];
        populateChaptersDropdown();
        allHadiths = [];
        displayHadiths();
        return;
    }

    currentBook = allBooks.find(book => book.slug === bookSlug);
    if (currentBook) {
        // Load local chapters for the selected book
        loadLocalChapters();
        // Filter hadiths by book
        filterLocalHadiths();
    }
}

// Chapter change handler
async function onChapterChange(event) {
    const chapterSlug = event.target.value;
    if (!chapterSlug) {
        currentChapter = null;
        filterLocalHadiths();
        return;
    }

    currentChapter = allChapters.find(chapter => chapter.slug === chapterSlug);
    if (currentChapter) {
        currentPage = 1;
        filterLocalHadiths();
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'block' : 'none';
    }
}

function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.innerHTML = `
            <div class="error-message alert alert-danger d-flex align-items-center" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <div>${message}</div>
            </div>
        `;
        errorContainer.style.display = 'block';
    }
}

function hideError() {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.style.display = 'none';
    }
}

// Local fallback data
function loadLocalBooks() {
    allBooks = [
        { slug: 'sahih-bukhari', title: 'صحيح البخاري', writer: 'الإمام البخاري', hadithsCount: '7276', chaptersCount: '99' },
        { slug: 'sahih-muslim', title: 'صحيح مسلم', writer: 'الإمام مسلم', hadithsCount: '7564', chaptersCount: '56' },
        { slug: 'sunan-abu-dawud', title: 'سنن أبي داود', writer: 'الإمام أبو داود', hadithsCount: '5274', chaptersCount: '43' },
        { slug: 'sunan-tirmidhi', title: 'سنن الترمذي', writer: 'الإمام الترمذي', hadithsCount: '3956', chaptersCount: '50' },
        { slug: 'sunan-nasai', title: 'سنن النسائي', writer: 'الإمام النسائي', hadithsCount: '5761', chaptersCount: '52' },
        { slug: 'sunan-ibn-majah', title: 'سنن ابن ماجه', writer: 'الإمام ابن ماجه', hadithsCount: '4341', chaptersCount: '39' },
        { slug: 'musnad-ahmad', title: 'مسند أحمد', writer: 'الإمام أحمد بن حنبل', hadithsCount: '0', chaptersCount: '14' },
        { slug: 'sunan-darimi', title: 'سنن الدارمي', writer: 'الإمام الدارمي', hadithsCount: '0', chaptersCount: '0' }
    ];
    console.log('Local books loaded:', allBooks.length);
    populateBooksDropdown();
    
    // Load first book's chapters
    if (allBooks.length > 0) {
        currentBook = allBooks[0];
        loadLocalChapters();
        loadLocalHadiths();
    }
}

function loadLocalChapters() {
    allChapters = [
        { slug: 'faith', title: 'كتاب الإيمان', hadithsCount: '150' },
        { slug: 'prayer', title: 'كتاب الصلاة', hadithsCount: '200' },
        { slug: 'charity', title: 'كتاب الزكاة', hadithsCount: '100' },
        { slug: 'fasting', title: 'كتاب الصوم', hadithsCount: '80' },
        { slug: 'pilgrimage', title: 'كتاب الحج', hadithsCount: '120' },
        { slug: 'knowledge', title: 'كتاب العلم', hadithsCount: '90' },
        { slug: 'manners', title: 'كتاب الأدب', hadithsCount: '110' },
        { slug: 'supplication', title: 'كتاب الدعوات', hadithsCount: '70' }
    ];
    console.log('Local chapters loaded:', allChapters.length);
    populateChaptersDropdown();
    
    // Set first chapter as current
    if (allChapters.length > 0) {
        currentChapter = allChapters[0];
    }
}

function loadLocalHadiths() {
    allHadiths = [
        {
            id: 1,
            hadithNumber: 1,
            arabic: 'إنما الأعمال بالنيات وإنما لكل امرئ ما نوى',
            urdu: 'اعمال کا دارومدار نیتوں پر ہے اور ہر شخص کو وہی ملے گا جس کی اس نے نیت کی',
            english: 'Actions are according to intentions, and everyone will get what was intended',
            book: 'صحيح البخاري',
            chapter: 'كتاب الإيمان',
            status: 'sahih'
        },
        {
            id: 2,
            hadithNumber: 2,
            arabic: 'من كان يؤمن بالله واليوم الآخر فليقل خيراً أو ليصمت',
            urdu: 'جو شخص اللہ اور آخرت پر ایمان رکھتا ہے اسے چاہیے کہ اچھی بات کہے یا خاموش رہے',
            english: 'Whoever believes in Allah and the Last Day should speak good or remain silent',
            book: 'صحيح البخاري',
            chapter: 'كتاب الإيمان',
            status: 'sahih'
        },
        {
            id: 3,
            hadithNumber: 3,
            arabic: 'المسلم من سلم المسلمون من لسانه ويده',
            urdu: 'مسلمان وہ ہے جس کی زبان اور ہاتھ سے دوسرے مسلمان محفوظ رہیں',
            english: 'A Muslim is one from whose tongue and hand the Muslims are safe',
            book: 'صحيح البخاري',
            chapter: 'كتاب الإيمان',
            status: 'sahih'
        },
        {
            id: 4,
            hadithNumber: 4,
            arabic: 'لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه',
            urdu: 'تم میں سے کوئی شخص ایماندار نہیں ہو سکتا جب تک کہ اپنے بھائی کے لیے وہی پسند نہ کرے جو اپنے لیے پسند کرتا ہے',
            english: 'None of you will have faith until he loves for his brother what he loves for himself',
            book: 'صحيح البخاري',
            chapter: 'كتاب الإيمان',
            status: 'sahih'
        },
        {
            id: 5,
            hadithNumber: 5,
            arabic: 'من أحدث في أمرنا هذا ما ليس منه فهو رد',
            urdu: 'جو شخص ہمارے دین میں کوئی نئی بات ایجاد کرے جو اس میں نہیں ہے تو وہ رد ہے',
            english: 'Whoever innovates something in this matter of ours that is not part of it will have it rejected',
            book: 'صحيح البخاري',
            chapter: 'كتاب الإيمان',
            status: 'sahih'
        },
        {
            id: 6,
            hadithNumber: 1,
            arabic: 'إذا قام أحدكم إلى الصلاة فليستقبل القبلة',
            urdu: 'جب تم میں سے کوئی نماز کے لیے کھڑا ہو تو قبلہ کی طرف منہ کرے',
            english: 'When one of you stands for prayer, he should face the Qibla',
            book: 'صحيح البخاري',
            chapter: 'كتاب الصلاة',
            status: 'sahih'
        },
        {
            id: 7,
            hadithNumber: 2,
            arabic: 'لا صلاة لمن لم يقرأ بفاتحة الكتاب',
            urdu: 'جس نے فاتحہ الکتاب نہیں پڑھی اس کی نماز نہیں',
            english: 'There is no prayer for one who does not recite the Opening of the Book',
            book: 'صحيح البخاري',
            chapter: 'كتاب الصلاة',
            status: 'sahih'
        },
        {
            id: 8,
            hadithNumber: 3,
            arabic: 'إذا استيقظ أحدكم من نومه فليغسل يديه قبل أن يدخلهما في الإناء',
            urdu: 'جب تم میں سے کوئی نیند سے جاگے تو برتن میں ہاتھ ڈالنے سے پہلے ہاتھ دھو لے',
            english: 'When one of you wakes up from sleep, he should wash his hands before putting them in the vessel',
            book: 'صحيح البخاري',
            chapter: 'كتاب الصلاة',
            status: 'sahih'
        },
        {
            id: 9,
            hadithNumber: 1,
            arabic: 'من كان يؤمن بالله واليوم الآخر فليكرم ضيفه',
            urdu: 'جو شخص اللہ اور آخرت پر ایمان رکھتا ہے اسے چاہیے کہ اپنے مہمان کی عزت کرے',
            english: 'Whoever believes in Allah and the Last Day should honor his guest',
            book: 'صحيح مسلم',
            chapter: 'كتاب الإيمان',
            status: 'sahih'
        },
        {
            id: 10,
            hadithNumber: 2,
            arabic: 'من كان يؤمن بالله واليوم الآخر فليقل خيراً أو ليصمت',
            urdu: 'جو شخص اللہ اور آخرت پر ایمان رکھتا ہے اسے چاہیے کہ اچھی بات کہے یا خاموش رہے',
            english: 'Whoever believes in Allah and the Last Day should speak good or remain silent',
            book: 'صحيح مسلم',
            chapter: 'كتاب الإيمان',
            status: 'sahih'
        },
        {
            id: 11,
            hadithNumber: 1,
            arabic: 'إن الله طيب لا يقبل إلا طيباً',
            urdu: 'اللہ پاک ہے اور پاک چیز ہی قبول کرتا ہے',
            english: 'Allah is pure and accepts only what is pure',
            book: 'سنن أبي داود',
            chapter: 'كتاب الزكاة',
            status: 'sahih'
        },
        {
            id: 12,
            hadithNumber: 2,
            arabic: 'من تصدق بعدل تمرة من كسب طيب',
            urdu: 'جو شخص ایک کھجور کے برابر بھی حلال کمائی سے صدقہ کرے',
            english: 'Whoever gives charity equal to a date from pure earnings',
            book: 'سنن أبي داود',
            chapter: 'كتاب الزكاة',
            status: 'sahih'
        }
    ];
    console.log('Local hadiths loaded:', allHadiths.length);
    displayHadiths();
    updatePagination();
    
    // Show welcome message
    showNotification('مرحباً بك في مكتبة الأحاديث النبوية - البيانات المحلية', 'success');
}

// Make functions globally available
window.initializeHadithPage = initializeHadithPage;
window.loadBooksFromAPI = loadBooksFromAPI;
window.loadChaptersFromAPI = loadChaptersFromAPI;
window.loadHadithsFromAPI = loadHadithsFromAPI;
