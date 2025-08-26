// ====== Mushaf Page JavaScript ======

// Global variables
let currentPage = 1;
let totalPages = 604;
let currentZoom = 100;
let isFullscreen = false;
let pageData = null;
let isLoading = false;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeMushaf();
    setupEventListeners();
});

// Initialize theme
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

// Initialize mushaf functionality
async function initializeMushaf() {
    try {
        // Show loading state
        showLoading();
        
        // Load page data from API first
        await loadPageData();
        
        // Load first page
        await loadPage(1);

        // Update navigation buttons
        updateNavigationButtons();

    } catch (error) {
        console.error('Error initializing mushaf:', error);
        showError('تعذر تهيئة المصحف');
    }
}

// Load page data from API
async function loadPageData() {
    try {
        // Try multiple API endpoints for better reliability
        const apiEndpoints = [
            'https://alquran.vip/APIs/quranPagesImage',
            'https://api.alquran.cloud/v1/quran/quran-uthmani',
            'https://api.quran.com/api/v4/quran/verses/uthmani'
        ];

        let dataLoaded = false;
        
        for (const endpoint of apiEndpoints) {
            try {
                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'QuranCast/1.0'
                    },
                    timeout: 10000
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'success' || data.code === 200) {
                        pageData = data;
                        if (data.total_pages) {
                            totalPages = data.total_pages;
                        }
                        dataLoaded = true;
                        console.log(`Loaded page data from ${endpoint}`);
                        break;
                    }
                }
            } catch (e) {
                console.log(`Failed to load from ${endpoint}:`, e);
                continue;
            }
        }

        if (!dataLoaded) {
            // Fallback to default values
            pageData = null;
            totalPages = 604;
            console.log('Using fallback page data');
        }

        // Update total pages display
        const totalPagesElement = document.getElementById('totalPages');
        if (totalPagesElement) {
            totalPagesElement.textContent = totalPages;
        }

        // Update page input max value
        const pageInput = document.getElementById('pageInput');
        if (pageInput) {
            pageInput.max = totalPages;
        }

    } catch (error) {
        console.error('Error loading page data:', error);
        // Fallback to default values
        pageData = null;
        totalPages = 604;
    }
}

// Load specific page
async function loadPage(pageNumber) {
    if (pageNumber < 1 || pageNumber > totalPages) {
        console.error('Invalid page number:', pageNumber);
        return;
    }

    if (isLoading) {
        console.log('Page loading in progress, skipping...');
        return;
    }

    isLoading = true;
    currentPage = pageNumber;

    // Show loading state
    showLoading();

    try {
        // Update page input
        const pageInput = document.getElementById('pageInput');
        if (pageInput) {
            pageInput.value = pageNumber;
        }

        // Update current page display
        const currentPageElement = document.getElementById('currentPageNumber');
        if (currentPageElement) {
            currentPageElement.textContent = pageNumber;
        }

        // Load page image
        await loadPageImage(pageNumber);

        // Update navigation buttons
        updateNavigationButtons();

        // Update quick navigation active state
        updateQuickNavigationActive();

        // Update page information
        updatePageInfo(pageNumber);

        // Save current page to localStorage
        localStorage.setItem('mushaf-current-page', pageNumber);

        // Hide loading after successful load
        hideLoading();

    } catch (error) {
        console.error('Error loading page:', pageNumber, error);
        showError(`تعذر تحميل الصفحة ${pageNumber}`);
    } finally {
        isLoading = false;
    }
}

// Load page image
async function loadPageImage(pageNumber) {
    const container = document.getElementById('pageImageContainer');
    if (!container) return;

    try {
        // Create image element
        const img = document.createElement('img');
        img.className = 'page-image';
        img.alt = `صفحة ${pageNumber} من القرآن الكريم`;
        img.style.transform = `scale(${currentZoom / 100})`;
        img.style.transition = 'transform 0.3s ease';

        // Set image source with multiple fallbacks
        const imageUrls = [
            // Primary source
            `https://alquran.vip/APIs/quran-pages/${pageNumber.toString().padStart(3, '0')}.png`,
            // Alternative sources
            `https://quran.com/api/quran/verses/uthmani?page_number=${pageNumber}`,
            `https://api.alquran.cloud/v1/quran/quran-uthmani/${pageNumber}`,
            // Local fallback (if available)
            `media/images/quran-pages/${pageNumber.toString().padStart(3, '0')}.png`
        ];

        // Try to load image from different sources
        let imageLoaded = false;
        
        for (const imageUrl of imageUrls) {
            try {
                if (imageUrl.includes('alquran.vip')) {
                    // Direct image URL
                    img.src = imageUrl;
                    imageLoaded = true;
                    break;
                } else if (imageUrl.includes('api.alquran.cloud')) {
                    // API endpoint - would need to handle JSON response
                    continue;
                }
            } catch (e) {
                console.log(`Failed to load from ${imageUrl}:`, e);
                continue;
            }
        }

        if (!imageLoaded) {
            // Use primary source as fallback
            img.src = imageUrls[0];
        }

        // Handle image load
        img.onload = () => {
            hideLoading();
            container.innerHTML = '';
            container.appendChild(img);

            // Add click to zoom functionality
            img.addEventListener('click', () => {
                if (currentZoom < 200) {
                    zoomIn();
                } else {
                    resetZoom();
                }
            });

            // Show success notification
            showNotification('تم تحميل الصفحة بنجاح', 'success');
        };

        // Handle image error
        img.onerror = () => {
            console.error('Failed to load image for page:', pageNumber);
            showError(`تعذر تحميل صورة الصفحة ${pageNumber}`);
        };

    } catch (error) {
        console.error('Error creating page image:', error);
        showError('تعذر إنشاء صورة الصفحة');
    }
}

// Show loading state
function showLoading() {
    const container = document.getElementById('pageImageContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="page-loading" id="pageLoading">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">جاري التحميل...</span>
            </div>
            <p class="mt-3 text-muted">جاري تحميل الصفحة...</p>
        </div>
    `;
}

// Hide loading state
function hideLoading() {
    const loading = document.getElementById('pageLoading');
    if (loading) {
        loading.style.display = 'none';
    }
}

// Show error message
function showError(message) {
    const container = document.getElementById('pageImageContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="page-error text-center p-5">
            <i class="bi bi-exclamation-triangle text-danger" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <h5 class="text-danger">خطأ</h5>
            <p class="text-muted">${message}</p>
            <button class="btn btn-primary" onclick="retryLoadPage()">
                <i class="bi bi-arrow-clockwise me-2"></i>إعادة المحاولة
            </button>
        </div>
    `;
}

// Retry loading current page
function retryLoadPage() {
    loadPage(currentPage);
}

// Navigation functions
function goToPage(pageNumber) {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
        loadPage(pageNumber);
    } else {
        showNotification(`يرجى إدخال رقم صفحة صحيح (1-${totalPages})`, 'error');
    }
}

function goToPageInput() {
    const pageInput = document.getElementById('pageInput');
    if (!pageInput) return;

    const pageNumber = parseInt(pageInput.value);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
        loadPage(pageNumber);
    } else {
        showNotification(`يرجى إدخال رقم صفحة صحيح (1-${totalPages})`, 'error');
        pageInput.value = currentPage;
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        loadPage(currentPage + 1);
    } else {
        showNotification('أنت في الصفحة الأخيرة', 'info');
    }
}

function previousPage() {
    if (currentPage > 1) {
        loadPage(currentPage - 1);
    } else {
        showNotification('أنت في الصفحة الأولى', 'info');
    }
}

// Update navigation buttons state
function updateNavigationButtons() {
    const firstBtn = document.getElementById('firstPageBtn');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const lastBtn = document.getElementById('lastPageBtn');

    if (firstBtn) firstBtn.disabled = currentPage === 1;
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
    if (lastBtn) lastBtn.disabled = currentPage === totalPages;
}

// Update quick navigation active state
function updateQuickNavigationActive() {
    const quickNavButtons = document.querySelectorAll('.quick-nav-btn');
    quickNavButtons.forEach(btn => {
        btn.classList.remove('active');

        // Check if this button corresponds to current page
        const pageNumber = getQuickNavPageNumber(btn);
        if (pageNumber === currentPage) {
            btn.classList.add('active');
        }
    });
}

// Get page number from quick nav button
function getQuickNavPageNumber(button) {
    const text = button.textContent;
    const pageMap = {
        'الفاتحة': 1,
        'البقرة': 2,
        'آل عمران': 49,
        'النساء': 77,
        'المائدة': 106,
        'الأنعام': 128,
        'الأعراف': 151,
        'الأنفال': 177,
        'التوبة': 200,
        'يونس': 250,
        'هود': 300,
        'يوسف': 350,
        'الرعد': 400,
        'إبراهيم': 450,
        'الحجر': 500,
        'النحل': 550
    };

    return pageMap[text] || 1;
}

// Get page information
function getPageInfo(pageNumber) {
    // This is a simplified mapping - in a real app, you'd get this from an API
    const pageInfo = {
        surah: 'غير محدد',
        juz: 'غير محدد',
        revelation: 'غير محدد',
        ayahs: 'غير محدد'
    };

    // Simple mapping for common pages
    if (pageNumber <= 7) {
        pageInfo.surah = 'الفاتحة';
        pageInfo.juz = 'الجزء 1';
        pageInfo.revelation = 'مكية';
        pageInfo.ayahs = '7 آيات';
    } else if (pageNumber <= 49) {
        pageInfo.surah = 'البقرة';
        pageInfo.juz = pageNumber <= 22 ? 'الجزء 1' : 'الجزء 2';
        pageInfo.revelation = 'مدنية';
        pageInfo.ayahs = '286 آية';
    } else if (pageNumber <= 77) {
        pageInfo.surah = 'آل عمران';
        pageInfo.juz = pageNumber <= 49 ? 'الجزء 3' : 'الجزء 4';
        pageInfo.revelation = 'مدنية';
        pageInfo.ayahs = '200 آية';
    } else if (pageNumber <= 106) {
        pageInfo.surah = 'النساء';
        pageInfo.juz = pageNumber <= 77 ? 'الجزء 4' : 'الجزء 5';
        pageInfo.revelation = 'مدنية';
        pageInfo.ayahs = '176 آية';
    } else if (pageNumber <= 128) {
        pageInfo.surah = 'المائدة';
        pageInfo.juz = pageNumber <= 106 ? 'الجزء 5' : 'الجزء 6';
        pageInfo.revelation = 'مدنية';
        pageInfo.ayahs = '120 آية';
    } else if (pageNumber <= 151) {
        pageInfo.surah = 'الأنعام';
        pageInfo.juz = pageNumber <= 128 ? 'الجزء 6' : 'الجزء 7';
        pageInfo.revelation = 'مكية';
        pageInfo.ayahs = '165 آية';
    } else if (pageNumber <= 177) {
        pageInfo.surah = 'الأعراف';
        pageInfo.juz = pageNumber <= 151 ? 'الجزء 7' : 'الجزء 8';
        pageInfo.revelation = 'مكية';
        pageInfo.ayahs = '206 آية';
    } else if (pageNumber <= 200) {
        pageInfo.surah = 'الأنفال';
        pageInfo.juz = pageNumber <= 177 ? 'الجزء 8' : 'الجزء 9';
        pageInfo.revelation = 'مدنية';
        pageInfo.ayahs = '75 آية';
    } else if (pageNumber <= 250) {
        pageInfo.surah = 'التوبة';
        pageInfo.juz = pageNumber <= 200 ? 'الجزء 9' : 'الجزء 10';
        pageInfo.revelation = 'مدنية';
        pageInfo.ayahs = '129 آية';
    } else if (pageNumber <= 300) {
        pageInfo.surah = 'يونس';
        pageInfo.juz = pageNumber <= 250 ? 'الجزء 10' : 'الجزء 11';
        pageInfo.revelation = 'مكية';
        pageInfo.ayahs = '109 آية';
    } else if (pageNumber <= 350) {
        pageInfo.surah = 'هود';
        pageInfo.juz = pageNumber <= 300 ? 'الجزء 11' : 'الجزء 12';
        pageInfo.revelation = 'مكية';
        pageInfo.ayahs = '123 آية';
    } else if (pageNumber <= 400) {
        pageInfo.surah = 'يوسف';
        pageInfo.juz = pageNumber <= 350 ? 'الجزء 12' : 'الجزء 13';
        pageInfo.revelation = 'مكية';
        pageInfo.ayahs = '111 آية';
    } else if (pageNumber <= 450) {
        pageInfo.surah = 'الرعد';
        pageInfo.juz = pageNumber <= 400 ? 'الجزء 13' : 'الجزء 14';
        pageInfo.revelation = 'مدنية';
        pageInfo.ayahs = '43 آية';
    } else if (pageNumber <= 500) {
        pageInfo.surah = 'إبراهيم';
        pageInfo.juz = pageNumber <= 450 ? 'الجزء 14' : 'الجزء 15';
        pageInfo.revelation = 'مكية';
        pageInfo.ayahs = '52 آية';
    } else if (pageNumber <= 550) {
        pageInfo.surah = 'الحجر';
        pageInfo.juz = pageNumber <= 500 ? 'الجزء 15' : 'الجزء 16';
        pageInfo.revelation = 'مكية';
        pageInfo.ayahs = '99 آية';
    } else if (pageNumber <= 604) {
        pageInfo.surah = 'النحل';
        pageInfo.juz = pageNumber <= 550 ? 'الجزء 16' : 'الجزء 17';
        pageInfo.revelation = 'مكية';
        pageInfo.ayahs = '128 آية';
    }

    return pageInfo;
}

// Update page information display
function updatePageInfo(pageNumber) {
    const pageInfo = getPageInfo(pageNumber);
    
    const pageSurah = document.getElementById('pageSurah');
    const pageJuz = document.getElementById('pageJuz');
    const pageRevelation = document.getElementById('pageRevelation');
    const pageAyahs = document.getElementById('pageAyahs');

    if (pageSurah) pageSurah.textContent = pageInfo.surah;
    if (pageJuz) pageJuz.textContent = pageInfo.juz;
    if (pageRevelation) pageInfo.revelation;
    if (pageAyahs) pageAyahs.textContent = pageInfo.ayahs;
}

// Search functionality
function searchPages() {
    const searchInput = document.getElementById('pageSearch');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchInput || !searchResults) return;
    
    const query = searchInput.value.trim();
    
    if (!query) {
        hideSearchResults();
        return;
    }
    
    const results = performSearch(query);
    displaySearchResults(results);
}

// Perform search
function performSearch(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    // Search in surah names and page numbers
    for (let page = 1; page <= totalPages; page++) {
        const pageInfo = getPageInfo(page);
        
        // Check if query matches surah name
        if (pageInfo.surah.toLowerCase().includes(lowerQuery)) {
            results.push({
                page: page,
                type: 'surah',
                title: pageInfo.surah,
                subtitle: `صفحة ${page} - ${pageInfo.juz}`,
                icon: '📖'
            });
        }
        
        // Check if query matches page number
        if (page.toString().includes(query)) {
            results.push({
                page: page,
                type: 'page',
                title: `صفحة ${page}`,
                subtitle: `${pageInfo.surah} - ${pageInfo.juz}`,
                icon: '📄'
            });
        }
        
        // Limit results to prevent performance issues
        if (results.length >= 20) break;
    }
    
    return results;
}

// Display search results
function displaySearchResults(results) {
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) return;
    
    if (results.length === 0) {
        searchResults.innerHTML = `
            <div class="search-result-item">
                <div class="search-result-content">
                    <p class="text-muted text-center mb-0">لا توجد نتائج</p>
                </div>
            </div>
        `;
    } else {
        searchResults.innerHTML = results.map(result => `
            <div class="search-result-item" onclick="goToPage(${result.page}); hideSearchResults();">
                <div class="search-result-icon">${result.icon}</div>
                <div class="search-result-content">
                    <h6>${result.title}</h6>
                    <p>${result.subtitle}</p>
                </div>
            </div>
        `).join('');
    }
    
    searchResults.classList.add('show');
}

// Hide search results
function hideSearchResults() {
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
        searchResults.classList.remove('show');
    }
}

// Setup search event listeners
function setupSearchEventListeners() {
    const searchInput = document.getElementById('pageSearch');
    if (!searchInput) return;
    
    // Search on input
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (searchInput.value.trim()) {
                searchPages();
            } else {
                hideSearchResults();
            }
        }, 300);
    });
    
    // Hide results when clicking outside
    document.addEventListener('click', (e) => {
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer && !searchContainer.contains(e.target)) {
            hideSearchResults();
        }
    });
    
    // Search on Enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchPages();
        }
    });
}

// Zoom functions
function zoomIn() {
    if (currentZoom < 300) {
        currentZoom += 25;
        updateZoom();
        showNotification(`تم التكبير إلى ${currentZoom}%`, 'info');
    } else {
        showNotification('أقصى مستوى تكبير', 'info');
    }
}

function zoomOut() {
    if (currentZoom > 50) {
        currentZoom -= 25;
        updateZoom();
        showNotification(`تم التصغير إلى ${currentZoom}%`, 'info');
    } else {
        showNotification('أقصى مستوى تصغير', 'info');
    }
}

function resetZoom() {
    currentZoom = 100;
    updateZoom();
    showNotification('تم إعادة تعيين التكبير', 'info');
}

function updateZoom() {
    const pageImage = document.querySelector('.page-image');
    if (pageImage) {
        pageImage.style.transform = `scale(${currentZoom / 100})`;
    }

    const zoomLevel = document.getElementById('zoomLevel');
    if (zoomLevel) {
        zoomLevel.textContent = `${currentZoom}%`;
    }
}

// Download current page
function downloadPage() {
    try {
        const pageImage = document.querySelector('.page-image');
        if (!pageImage || !pageImage.src) {
            showNotification('لا توجد صورة للتحميل', 'error');
            return;
        }

        // Create download link
        const link = document.createElement('a');
        link.href = pageImage.src;
        link.download = `quran_page_${currentPage.toString().padStart(3, '0')}.png`;
        link.target = '_blank';

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showNotification('تم بدء تحميل الصفحة', 'success');

    } catch (error) {
        console.error('Error downloading page:', error);
        showNotification('تعذر تحميل الصفحة', 'error');
    }
}

// Share current page
function sharePage() {
    try {
        const shareData = {
            title: 'المصحف الشريف',
            text: `صفحة ${currentPage} من القرآن الكريم`,
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData);
        } else {
            // Fallback: copy to clipboard
            const shareText = `${shareData.title} - ${shareData.text}\n${shareData.url}`;
            navigator.clipboard.writeText(shareText).then(() => {
                showNotification('تم نسخ الرابط إلى الحافظة', 'success');
            }).catch(() => {
                showNotification('تعذر نسخ الرابط', 'error');
            });
        }

    } catch (error) {
        console.error('Error sharing page:', error);
        showNotification('تعذر مشاركة الصفحة', 'error');
    }
}

// Toggle fullscreen
function toggleFullscreen() {
    const pageDisplay = document.querySelector('.page-display');
    if (!pageDisplay) return;

    try {
        if (!isFullscreen) {
            if (pageDisplay.requestFullscreen) {
                pageDisplay.requestFullscreen();
            } else if (pageDisplay.webkitRequestFullscreen) {
                pageDisplay.webkitRequestFullscreen();
            } else if (pageDisplay.msRequestFullscreen) {
                pageDisplay.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }

        isFullscreen = !isFullscreen;

        // Update button text
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            if (isFullscreen) {
                fullscreenBtn.innerHTML = '<i class="bi bi-fullscreen-exit"></i> خروج من ملء الشاشة';
            } else {
                fullscreenBtn.innerHTML = '<i class="bi bi-arrows-fullscreen"></i> ملء الشاشة';
            }
        }

    } catch (error) {
        console.error('Error toggling fullscreen:', error);
        showNotification('تعذر تبديل وضع ملء الشاشة', 'error');
    }
}

// Handle fullscreen change events
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('msfullscreenchange', handleFullscreenChange);

function handleFullscreenChange() {
    isFullscreen = !!document.fullscreenElement || !!document.webkitFullscreenElement || !!document.msFullscreenElement;

    // Update button text
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        if (isFullscreen) {
            fullscreenBtn.innerHTML = '<i class="bi bi-fullscreen-exit"></i> خروج من ملء الشاشة';
        } else {
            fullscreenBtn.innerHTML = '<i class="bi bi-arrows-fullscreen"></i> ملء الشاشة';
        }
    }
}

// Theme functions
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    updateThemeIcon(newTheme);
    showNotification(`تم التبديل إلى الوضع ${newTheme === 'dark' ? 'المظلم' : 'النهاري'}`, 'info');
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

// Show notification with improved styling
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.mushaf-notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `mushaf-notification mushaf-notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="bi bi-x"></i>
            </button>
        </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 4000);
}

// Setup event listeners
function setupEventListeners() {
    // Page input enter key
    const pageInput = document.getElementById('pageInput');
    if (pageInput) {
        pageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                goToPageInput();
            }
        });

        // Validate input on blur
        pageInput.addEventListener('blur', () => {
            const value = parseInt(pageInput.value);
            if (value < 1 || value > totalPages) {
                pageInput.value = currentPage;
            }
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        // Only handle keyboard events when not typing in input
        if (e.target.tagName === 'INPUT') return;

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                previousPage();
                break;
            case 'ArrowRight':
                e.preventDefault();
                nextPage();
                break;
            case 'Home':
                e.preventDefault();
                goToPage(1);
                break;
            case 'End':
                e.preventDefault();
                goToPage(totalPages);
                break;
            case '+':
            case '=':
                e.preventDefault();
                zoomIn();
                break;
            case '-':
                e.preventDefault();
                zoomOut();
                break;
            case '0':
                e.preventDefault();
                resetZoom();
                break;
            case ' ':
                e.preventDefault();
                toggleFullscreen();
                break;
        }
    });

    // Load saved page on page load
    const savedPage = localStorage.getItem('mushaf-current-page');
    if (savedPage) {
        const pageNumber = parseInt(savedPage);
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setTimeout(() => loadPage(pageNumber), 100);
        }
    }

    // Add touch gestures for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe left - next page
                nextPage();
            } else {
                // Swipe right - previous page
                previousPage();
            }
        }
    }

    // Setup search event listeners
    setupSearchEventListeners();
}

// Show Quran mode modal (placeholder)
function showQuranModeModal() {
    // Redirect to main page for Quran mode selection
    window.location.href = 'index.html';
}

// Export functions for global use
window.Mushaf = {
    loadPage,
    goToPage,
    nextPage,
    previousPage,
    zoomIn,
    zoomOut,
    resetZoom,
    downloadPage,
    sharePage,
    toggleFullscreen,
    toggleTheme
};

// Go to specific surah
function goToSurah(surahNumber) {
    if (!surahNumber) return;
    
    const surahPageMap = {
        1: 1,    // الفاتحة
        2: 2,    // البقرة
        3: 49,   // آل عمران
        4: 77,   // النساء
        5: 106,  // المائدة
        6: 128,  // الأنعام
        7: 151,  // الأعراف
        8: 177,  // الأنفال
        9: 200,  // التوبة
        10: 250, // يونس
        11: 300, // هود
        12: 350, // يوسف
        13: 400, // الرعد
        14: 450, // إبراهيم
        15: 500, // الحجر
        16: 550, // النحل
        17: 600, // الإسراء
        18: 650, // الكهف
        19: 700, // مريم
        20: 750, // طه
        21: 800, // الأنبياء
        22: 850, // الحج
        23: 900, // المؤمنون
        24: 950, // النور
        25: 1000, // الفرقان
        26: 1050, // الشعراء
        27: 1100, // النمل
        28: 1150, // القصص
        29: 1200, // العنكبوت
        30: 1250, // الروم
        31: 1300, // لقمان
        32: 1350, // السجدة
        33: 1400, // الأحزاب
        34: 1450, // سبأ
        35: 1500, // فاطر
        36: 1550, // يس
        37: 1600, // الصافات
        38: 1650, // ص
        39: 1700, // الزمر
        40: 1750, // غافر
        41: 1800, // فصلت
        42: 1850, // الشورى
        43: 1900, // الزخرف
        44: 1950, // الدخان
        45: 2000, // الجاثية
        46: 2050, // الأحقاف
        47: 2100, // محمد
        48: 2150, // الفتح
        49: 2200, // الحجرات
        50: 2250, // ق
        51: 2300, // الذاريات
        52: 2350, // الطور
        53: 2400, // النجم
        54: 2450, // القمر
        55: 2500, // الرحمن
        56: 2550, // الواقعة
        57: 2600, // الحديد
        58: 2650, // المجادلة
        59: 2700, // الحشر
        60: 2750, // الممتحنة
        61: 2800, // الصف
        62: 2850, // الجمعة
        63: 2900, // المنافقون
        64: 2950, // التغابن
        65: 3000, // الطلاق
        66: 3050, // التحريم
        67: 3100, // الملك
        68: 3150, // القلم
        69: 3200, // الحاقة
        70: 3250, // المعارج
        71: 3300, // نوح
        72: 3350, // الجن
        73: 3400, // المزمل
        74: 3450, // المدثر
        75: 3500, // القيامة
        76: 3550, // الإنسان
        77: 3600, // المرسلات
        78: 3650, // النبأ
        79: 3700, // النازعات
        80: 3750, // عبس
        81: 3800, // التكوير
        82: 3850, // الانفطار
        83: 3900, // المطففين
        84: 3950, // الانشقاق
        85: 4000, // البروج
        86: 4050, // الطارق
        87: 4100, // الأعلى
        88: 4150, // الغاشية
        89: 4200, // الفجر
        90: 4250, // البلد
        91: 4300, // الشمس
        92: 4350, // الليل
        93: 4400, // الضحى
        94: 4450, // الشرح
        95: 4500, // التين
        96: 4550, // العلق
        97: 4600, // القدر
        98: 4650, // البينة
        99: 4700, // الزلزلة
        100: 4750, // العاديات
        101: 4800, // القارعة
        102: 4850, // التكاثر
        103: 4900, // العصر
        104: 4950, // الهمزة
        105: 5000, // الفيل
        106: 5050, // قريش
        107: 5100, // الماعون
        108: 5150, // الكوثر
        109: 5200, // الكافرون
        110: 5250, // النصر
        111: 5300, // المسد
        112: 5350, // الإخلاص
        113: 5400, // الفلق
        114: 5450  // الناس
    };
    
    const targetPage = surahPageMap[surahNumber];
    if (targetPage) {
        goToPage(targetPage);
        showNotification(`تم الانتقال إلى سورة ${getSurahName(surahNumber)}`, 'success');
    } else {
        showNotification('لم يتم العثور على السورة المحددة', 'error');
    }
}

// Go to specific juz
function goToJuz(juzNumber) {
    if (!juzNumber) return;
    
    const juzPageMap = {
        1: 1,     // الجزء 1
        2: 22,    // الجزء 2
        3: 42,    // الجزء 3
        4: 62,    // الجزء 4
        5: 82,    // الجزء 5
        6: 102,   // الجزء 6
        7: 122,   // الجزء 7
        8: 142,   // الجزء 8
        9: 162,   // الجزء 9
        10: 182,  // الجزء 10
        11: 202,  // الجزء 11
        12: 222,  // الجزء 12
        13: 242,  // الجزء 13
        14: 262,  // الجزء 14
        15: 282,  // الجزء 15
        16: 302,  // الجزء 16
        17: 322,  // الجزء 17
        18: 342,  // الجزء 18
        19: 362,  // الجزء 19
        20: 382,  // الجزء 20
        21: 402,  // الجزء 21
        22: 422,  // الجزء 22
        23: 442,  // الجزء 23
        24: 462,  // الجزء 24
        25: 482,  // الجزء 25
        26: 502,  // الجزء 26
        27: 522,  // الجزء 27
        28: 542,  // الجزء 28
        29: 562,  // الجزء 29
        30: 582   // الجزء 30
    };
    
    const targetPage = juzPageMap[juzNumber];
    if (targetPage) {
        goToPage(targetPage);
        showNotification(`تم الانتقال إلى الجزء ${juzNumber}`, 'success');
    } else {
        showNotification('لم يتم العثور على الجزء المحدد', 'error');
    }
}

// Get surah name by number
function getSurahName(surahNumber) {
    const surahNames = {
        1: 'الفاتحة',
        2: 'البقرة',
        3: 'آل عمران',
        4: 'النساء',
        5: 'المائدة',
        6: 'الأنعام',
        7: 'الأعراف',
        8: 'الأنفال',
        9: 'التوبة',
        10: 'يونس',
        11: 'هود',
        12: 'يوسف',
        13: 'الرعد',
        14: 'إبراهيم',
        15: 'الحجر',
        16: 'النحل',
        17: 'الإسراء',
        18: 'الكهف',
        19: 'مريم',
        20: 'طه',
        21: 'الأنبياء',
        22: 'الحج',
        23: 'المؤمنون',
        24: 'النور',
        25: 'الفرقان',
        26: 'الشعراء',
        27: 'النمل',
        28: 'القصص',
        29: 'العنكبوت',
        30: 'الروم',
        31: 'لقمان',
        32: 'السجدة',
        33: 'الأحزاب',
        34: 'سبأ',
        35: 'فاطر',
        36: 'يس',
        37: 'الصافات',
        38: 'ص',
        39: 'الزمر',
        40: 'غافر',
        41: 'فصلت',
        42: 'الشورى',
        43: 'الزخرف',
        44: 'الدخان',
        45: 'الجاثية',
        46: 'الأحقاف',
        47: 'محمد',
        48: 'الفتح',
        49: 'الحجرات',
        50: 'ق',
        51: 'الذاريات',
        52: 'الطور',
        53: 'النجم',
        54: 'القمر',
        55: 'الرحمن',
        56: 'الواقعة',
        57: 'الحديد',
        58: 'المجادلة',
        59: 'الحشر',
        60: 'الممتحنة',
        61: 'الصف',
        62: 'الجمعة',
        63: 'المنافقون',
        64: 'التغابن',
        65: 'الطلاق',
        66: 'التحريم',
        67: 'الملك',
        68: 'القلم',
        69: 'الحاقة',
        70: 'المعارج',
        71: 'نوح',
        72: 'الجن',
        73: 'المزمل',
        74: 'المدثر',
        75: 'القيامة',
        76: 'الإنسان',
        77: 'المرسلات',
        78: 'النبأ',
        79: 'النازعات',
        80: 'عبس',
        81: 'التكوير',
        82: 'الانفطار',
        83: 'المطففين',
        84: 'الانشقاق',
        85: 'البروج',
        86: 'الطارق',
        87: 'الأعلى',
        88: 'الغاشية',
        89: 'الفجر',
        90: 'البلد',
        91: 'الشمس',
        92: 'الليل',
        93: 'الضحى',
        94: 'الشرح',
        95: 'التين',
        96: 'العلق',
        97: 'القدر',
        98: 'البينة',
        99: 'الزلزلة',
        100: 'العاديات',
        101: 'القارعة',
        102: 'التكاثر',
        103: 'العصر',
        104: 'الهمزة',
        105: 'الفيل',
        106: 'قريش',
        107: 'الماعون',
        108: 'الكوثر',
        109: 'الكافرون',
        110: 'النصر',
        111: 'المسد',
        112: 'الإخلاص',
        113: 'الفلق',
        114: 'الناس'
    };
    
    return surahNames[surahNumber] || 'غير معروف';
}
