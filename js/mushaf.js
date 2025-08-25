// ====== Mushaf Page JavaScript ======

// Global variables
let currentPage = 1;
let totalPages = 604;
let currentZoom = 100;
let isFullscreen = false;
let pageData = null;

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
        // Load first page
        await loadPage(1);

        // Update navigation buttons
        updateNavigationButtons();

        // Load page data from API
        await loadPageData();

    } catch (error) {
        console.error('Error initializing mushaf:', error);
        showError('تعذر تهيئة المصحف');
    }
}

// Load page data from API
async function loadPageData() {
    try {
        const response = await fetch('https://alquran.vip/APIs/quranPagesImage');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.status === 'success') {
            pageData = data;
            totalPages = data.total_pages;

            // Update total pages display
            const totalPagesElement = document.getElementById('totalPages');
            if (totalPagesElement) {
                totalPagesElement.textContent = totalPages;
            }

            console.log(`Loaded ${totalPages} pages from API`);
        } else {
            throw new Error('API returned error status');
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

        // Save current page to localStorage
        localStorage.setItem('mushaf-current-page', pageNumber);

    } catch (error) {
        console.error('Error loading page:', pageNumber, error);
        showError(`تعذر تحميل الصفحة ${pageNumber}`);
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

        // Set image source
        if (pageData && pageData.pages) {
            // Use API data if available
            const pageInfo = pageData.pages.find(p => p.page_number === pageNumber);
            if (pageInfo) {
                img.src = pageInfo.page_url;
            } else {
                // Fallback to direct URL
                img.src = `https://alquran.vip/APIs/quran-pages/${pageNumber.toString().padStart(3, '0')}.png`;
            }
        } else {
            // Fallback to direct URL
            img.src = `https://alquran.vip/APIs/quran-pages/${pageNumber.toString().padStart(3, '0')}.png`;
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
            <div class="spinner-border" role="status">
                <span class="visually-hidden">جاري التحميل...</span>
            </div>
            <p>جاري تحميل الصفحة...</p>
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
        <div class="page-error">
            <i class="bi bi-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <h5>خطأ</h5>
            <p>${message}</p>
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
    loadPage(pageNumber);
}

function goToPageInput() {
    const pageInput = document.getElementById('pageInput');
    if (!pageInput) return;

    const pageNumber = parseInt(pageInput.value);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
        loadPage(pageNumber);
    } else {
        alert(`يرجى إدخال رقم صفحة صحيح (1-${totalPages})`);
        pageInput.value = currentPage;
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        loadPage(currentPage + 1);
    }
}

function previousPage() {
    if (currentPage > 1) {
        loadPage(currentPage - 1);
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
        'الأنفال': 177
    };

    return pageMap[text] || 1;
}

// Zoom functions
function zoomIn() {
    if (currentZoom < 300) {
        currentZoom += 25;
        updateZoom();
    }
}

function zoomOut() {
    if (currentZoom > 50) {
        currentZoom -= 25;
        updateZoom();
    }
}

function resetZoom() {
    currentZoom = 100;
    updateZoom();
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
            alert('لا توجد صورة للتحميل');
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

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-header">
            <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="bi bi-x"></i>
            </button>
        </div>
        <div class="notification-body">
            ${message}
        </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
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
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
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
