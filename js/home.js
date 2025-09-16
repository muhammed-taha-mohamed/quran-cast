// Home Section Functionality
function initializeHomeSection() {
    const homeSection = document.getElementById('section-home');
    if (!homeSection) return;

    // Auto-play background audio with enhanced strategies
    const autoPlayAudio = document.getElementById('autoPlayAudio');
    if (autoPlayAudio) {
        // Set volume to a reasonable level (30%)
        autoPlayAudio.volume = 0.3;
        
        // Try to play the audio immediately
        const playPromise = autoPlayAudio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('Background audio started playing automatically from home section');
                // Update button state
                const btn = document.getElementById('audioToggleBtn');
                const icon = document.getElementById('audioIcon');
                if (btn && icon) {
                    btn.classList.add('playing');
                    icon.className = 'bi bi-pause-fill';
                    // Hide button after successful auto-play
                    setTimeout(() => {
                        btn.style.opacity = '0.3';
                        btn.style.pointerEvents = 'none';
                    }, 3000);
                }
            }).catch(error => {
                console.log('Auto-play was prevented by browser from home section:', error);
                // Try again after a short delay
                setTimeout(() => {
                    autoPlayAudio.play().then(() => {
                        console.log('Background audio started playing after delay');
                        const btn = document.getElementById('audioToggleBtn');
                        const icon = document.getElementById('audioIcon');
                        if (btn && icon) {
                            btn.classList.add('playing');
                            icon.className = 'bi bi-pause-fill';
                            setTimeout(() => {
                                btn.style.opacity = '0.3';
                                btn.style.pointerEvents = 'none';
                            }, 3000);
                        }
                    }).catch(err => {
                        console.log('Second attempt also failed:', err);
                    });
                }, 1000);
            });
        }
    }

    // The complete home section HTML content
    const homeHTML = `
        <!-- Hero Section -->
        <div style="border-radius: 0%; width: 100%;"
            class="hero-section prayer-hero bg-image text-center py-5 mb-5">
            <!-- Desktop Image Background -->
            <div class="d-none d-md-block" onclick="triggerBackgroundAudio()" style="cursor: pointer; height: 100%; width: 100%;">

            </div>

            <!-- Mobile Video Background -->
            <video autoplay muted loop playsinline class="d-md-none hero-video" id="heroVideo" onclick="triggerBackgroundAudio()">
                <source src="media/vedios/quran_page_mobile.mp4" type="video/mp4">
            </video>

            <!-- Mobile Stats (Top Position) -->
            <div class="mobile-stats-box d-md-none">
                <div class="prayer-stats-row-mobile">
                    <div class="prayer-stat-item-mobile">
                        <div class="stat-content">
                            <div class="stat-label" data-translate="prayer.nextPrayer">الصلاة القادمة</div>
                            <div class="stat-value" id="nextPrayerNameMobile">--</div>
                        </div>
                    </div>
                    <div class="prayer-stat-item-mobile">
                        <div class="stat-content">
                            <div class="stat-label" data-translate="prayer.timeRemaining">المؤقت</div>
                            <div class="stat-value" id="prayerCountdownMobile">--:--:--</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="hero-content d-none d-md-block">
                <div class="row justify-content-center">
                    <div>
                        <!-- Enhanced Prayer Info Card -->
                        <div class="prayer-info-card enhanced-prayer-card">
                            <div class="prayer-info-content">

                                <div class="prayer-stats-row">
                                    <div class="prayer-stat-item">

                                        <div class="stat-content">
                                            <div class="stat-label" data-translate="prayer.nextPrayer">الصلاة القادمة</div>

                                            <div class="stat-value" id="nextPrayerName">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150">
                                                    <path fill="none" stroke="#FFFFFF" stroke-width="3"
                                                        stroke-linecap="round" stroke-dasharray="300 385"
                                                        stroke-dashoffset="0"
                                                        d="M275 75c0 31-27 50-50 50-58 0-92-100-150-100-28 0-50 22-50 50s23 50 50 50c58 0 92-100 150-100 24 0 50 19 50 50Z">
                                                        <animate attributeName="stroke-dashoffset" calcMode="spline"
                                                            dur="5" values="685;-685" keySplines="0 0 1 1"
                                                            repeatCount="indefinite"></animate>
                                                    </path>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="prayer-stat-item">

                                        <div class="stat-content">
                                            <div class="stat-label" data-translate="prayer.timeRemaining">الوقت المتبقي</div>
                                            <div class="stat-value" id="heroPrayerCountdown">

                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150">
                                                    <path fill="none" stroke="#FFFFFF" stroke-width="3"
                                                        stroke-linecap="round" stroke-dasharray="300 385"
                                                        stroke-dashoffset="0"
                                                        d="M275 75c0 31-27 50-50 50-58 0-92-100-150-100-28 0-50 22-50 50s23 50 50 50c58 0 92-100 150-100 24 0 50 19 50 50Z">
                                                        <animate attributeName="stroke-dashoffset" calcMode="spline"
                                                            dur="5" values="685;-685" keySplines="0 0 1 1"
                                                            repeatCount="indefinite"></animate>
                                                    </path>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content Grid -->
        <div class="row g-4">

            <!-- Prayer Times Section -->
            <div class="col-12">
                <div class="card prayer-times-card enhanced-prayer-times-card">
                    <div class="card-header enhanced-card-header">
                        <div class="d-flex align-items-center">
                            <div class="header-content">
                                <h5 class="salah-title" style="color: #0f766e;" class="mb-0" data-translate="prayer.todayTimes">مواقيت الصلاة اليوم
                                </h5>
                            </div>
                        </div>
                        <div class="header-actions">

                            <span class="prayer-date" id="prayerDate">--</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="prayer-times-grid enhanced-prayer-grid" id="prayerTimesGrid">
                            <div class="prayer-time-item fajr enhanced-prayer-item fajr">
                                <div class="prayer-info">
                                    <div class="prayer-name" data-translate="prayer.fajr">الفجر</div>
                                    <div class="prayer-time" id="fajr">--:--</div>
                                    <div class="prayer-status"> </div>
                                </div>
                            </div>
                            <div class="prayer-time-item sunrise enhanced-prayer-item sunrise">
                                <div class="prayer-info">
                                    <div class="prayer-name" data-translate="prayer.sunrise">الشروق</div>
                                    <div class="prayer-time" id="sunrise">--:--</div>
                                    <div class="prayer-status"> </div>
                                </div>
                            </div>
                            <div class="prayer-time-item dhuhr enhanced-prayer-item duhr">
                                <div class="prayer-info">
                                    <div class="prayer-name" data-translate="prayer.dhuhr">الظهر</div>
                                    <div class="prayer-time" id="dhuhr">--:--</div>
                                    <div class="prayer-status"> </div>
                                </div>
                            </div>
                            <div class="prayer-time-item asr enhanced-prayer-item asr">
                                <div class="prayer-info">
                                    <div class="prayer-name" data-translate="prayer.asr">العصر</div>
                                    <div class="prayer-time" id="asr">--:--</div>
                                    <div class="prayer-status"> </div>
                                </div>
                            </div>
                            <div class="prayer-time-item maghrib enhanced-prayer-item maghrib">
                                <div class="prayer-info">
                                    <div class="prayer-name" data-translate="prayer.maghrib">المغرب</div>
                                    <div class="prayer-time" id="maghrib">--:--</div>
                                    <div class="prayer-status"> </div>
                                </div>
                            </div>
                            <div class="prayer-time-item isha enhanced-prayer-item ishaa">
                                <div class="prayer-info">
                                    <div class="prayer-name" data-translate="prayer.isha">العشاء</div>
                                    <div class="prayer-time" id="isha">--:--</div>
                                    <div class="prayer-status"> </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Advanced Adhkar Slider Section -->
            <div class="col-12">
                <div class="card prayer-times-card enhanced-prayer-times-card">
                    <div class="card-header enhanced-card-header">
                        <div class="d-flex align-items-center justify-content-between w-100">
                            <div class="header-content">
                                <h5 style="color: #0f766e;" class="mb-0">
                                    <i class="bi text-success me-2"></i>
                                     <span data-translate="azkar.prayerRemembrance">اذكار الصلاة</span>
                                </h5>
                            </div>
                            
                        </div>
                    </div>

                    <div class="card-body">
                       
                       
 <!-- Adhkar Content -->
                        <div class="tab-content" id="adhkarTabContent">
                            <!-- Prayer Adhkar -->
                            <div class="tab-pane fade show active" id="prayer-content" role="tabpanel">
                                <div class="adhkar-grid">
                                    <div class="adhkar-item" onclick="linkAdhkarWithTasbih('سبحان الله', 33)">
                                        <div class="adhkar-icon adhkar-icon-success">
                                        </div>
                                        <div class="adhkar-text">
                                            <strong>سبحان الله</strong>
                                            <small class="d-block text-muted">33 مرة</small>
                                        </div>
                                        <div class="adhkar-action">
                                            <i class="bi bi-arrow-left"></i>
                                        </div>
                                    </div>

                                    <div class="adhkar-item" onclick="linkAdhkarWithTasbih('الحمد لله', 33)">
                                        <div class="adhkar-icon adhkar-icon-primary">
                                        </div>
                                        <div class="adhkar-text">
                                            <strong>الحمد لله</strong>
                                            <small class="d-block text-muted">33 مرة</small>
                                        </div>
                                        <div class="adhkar-action">
                                            <i class="bi bi-arrow-left"></i>
                                        </div>
                                    </div>

                                    <div class="adhkar-item" onclick="linkAdhkarWithTasbih('الله أكبر', 33)">
                                        <div class="adhkar-icon adhkar-icon-warning">
                                        </div>
                                        <div class="adhkar-text">
                                            <strong>الله أكبر</strong>
                                            <small class="d-block text-muted">34 مرة</small>
                                        </div>
                                        <div class="adhkar-action">
                                            <i class="bi bi-arrow-left"></i>
                                        </div>
                                    </div>

                                    <div class="adhkar-item" onclick="linkAdhkarWithTasbih('لا إله إلا الله', 100)">
                                        <div class="adhkar-icon adhkar-icon-danger">
                                        </div>
                                        <div class="adhkar-text">
                                            <strong>لا إله إلا الله</strong>
                                            <small class="d-block text-muted">100 مرة</small>
                                        </div>
                                        <div class="adhkar-action">
                                            <i class="bi bi-arrow-left"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <!-- Tasbih Section -->
            <div class="col-12">
                <div class="card prayer-times-card enhanced-prayer-times-card">
                    <div class="card-header enhanced-card-header">
                        <div class="d-flex align-items-center">
                            <div class="header-content">
                                <h5 style="color: #0f766e;" class="mb-0" data-translate="azkar.tasbih">
                                    المسبحـة
                                </h5>
                            </div>
                        </div>
                        <div class="header-actions">
                           
                            <button class="btn btn-outline-success btn-sm" onclick="showCustomDhikrModal()">
                               
                                <span data-translate="azkar.customize">تخصيص</span>
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-12 text-center">
                                <div class="tasbih-counter" onclick="incrementTasbih()" style="cursor: pointer;" title="اضغط لزيادة العداد">
                                    <div class="counter-display" id="tasbihCounter">0</div>
                                    <br>
                                    <div class="current-dhikr" id="currentDhikr" data-translate="azkar.selectDhikr">اختر ذكراً للبدء</div>
                                </div>

                                <!-- Circular Control Buttons -->
                                <div class="tasbih-controls-circular">
                                    <button class="btn btn-success btn-lg tasbih-btn-circular increment-btn"
                                        onclick="incrementTasbih()" title="زيادة" data-translate-title="azkar.count">
                                        <i class="bi bi-plus-circle-fill"></i>
                                    </button>
                                    <button class="btn btn-danger btn-lg tasbih-btn-circular reset-btn"
                                        onclick="resetTasbih()" title="إعادة تعيين" data-translate-title="azkar.reset">
                                        <i class="bi bi-arrow-clockwise"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Custom Dhikr Modal -->
            <div class="modal fade unified-modal" id="customDhikrModal" tabindex="-1" aria-labelledby="customDhikrModalLabel"
                aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="customDhikrModalLabel">
                                <span data-translate="azkar.addCustomDhikr">إضافة ذكر مخصص</span>
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" data-translate-aria="common.close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="customDhikrText" class="form-label" data-translate="azkar.dhikrText">نص الذكر</label>
                                <input type="text" class="form-control" id="customDhikrText"
                                    placeholder="مثال: لا حول ولا قوة إلا بالله" data-translate="azkar.dhikrExample">
                            </div>
                            <div class="mb-3">
                                <label for="customDhikrCount" class="form-label" data-translate="azkar.repeatCount">عدد مرات التكرار</label>
                                <input type="number" class="form-control" id="customDhikrCount"
                                    placeholder="مثال: 99" min="1" max="999" data-translate="azkar.countExample">
                            </div>
                        </div>
                        <div class="modal-footer">
                        <button type="button" class="btn btn-primary" onclick="addCustomDhikr()">
                              
                                <span data-translate="common.save">حفظ</span>
                            </button>
                            
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" data-translate="common.cancel">إلغاء</button>
                            
                        </div>
                    </div>
                </div>
            </div>

        </div>
    `;

    // Set the HTML content
    homeSection.innerHTML = homeHTML;
}

// Function to link adhkar with tasbih and scroll to it
function linkAdhkarWithTasbih(dhikrText, count) {
    // Set the tasbih with the selected dhikr
    if (typeof setTasbihPreset === 'function') {
        setTasbihPreset(count, dhikrText);
    }
    
    // Scroll to tasbih section smoothly
    setTimeout(() => {
        const tasbihSection = document.querySelector('.tasbih-counter');
        if (tasbihSection) {
            tasbihSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Add a highlight effect
            tasbihSection.style.transform = 'scale(1.05)';
            tasbihSection.style.boxShadow = '0 0 20px rgba(15, 118, 110, 0.5)';
            
            setTimeout(() => {
                tasbihSection.style.transform = 'scale(1)';
                tasbihSection.style.boxShadow = '';
            }, 1000);
        }
    }, 100);
}

// Initialize the home section when the DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    initializeHomeSection();

    // Initialize prayer times after home section is loaded
    setTimeout(() => {
        if (typeof initializeEnhancedPrayerTimes === 'function') {
            initializeEnhancedPrayerTimes();
        }
    }, 100);
});

// Floating Navigation Functions
function toggleBottomNavbar() {
    const bottomNavbar = document.getElementById('bottomNavbar');
    const floatingBtn = document.getElementById('floatingNavBtn');
    
    if (bottomNavbar && floatingBtn) {
        if (bottomNavbar.style.display === 'none' || bottomNavbar.style.display === '') {
            // Show navbar
            bottomNavbar.style.display = 'flex';
            floatingBtn.style.display = 'none';
            bottomNavbar.style.animation = 'slideInUp 0.4s ease';
        } else {
            // Hide navbar
            hideBottomNavbar();
        }
    }
}

function hideBottomNavbar() {
    const bottomNavbar = document.getElementById('bottomNavbar');
    const floatingBtn = document.getElementById('floatingNavBtn');
    
    if (bottomNavbar && floatingBtn) {
        bottomNavbar.style.animation = 'slideOutDown 0.3s ease';
        setTimeout(() => {
            bottomNavbar.style.display = 'none';
            floatingBtn.style.display = 'flex';
        }, 300);
    }
}

// Update active nav item based on current section
function updateActiveNavItem() {
    const currentHash = window.location.hash || '#home';
    const navItems = document.querySelectorAll('.bottom-navbar .nav-item');
    
    navItems.forEach(item => {
        item.classList.remove('active');
        const href = item.getAttribute('onclick');
        if (href && href.includes(currentHash)) {
            item.classList.add('active');
        }
    });
}

// Listen for hash changes
window.addEventListener('hashchange', updateActiveNavItem);

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    updateActiveNavItem();
});

// إدارة عرض رابط الإدارة للمديرين
function checkAdminAccess() {
    // قائمة المديرين المصرح لهم
    const adminEmails = [
        'admin@mail.com',
        'mohamedtahaomk35@gmail.com'
    ];
    
    // فحص إذا كان المستخدم مسجل دخول
    if (typeof reelsManager !== 'undefined' && reelsManager.currentUser) {
        const userEmail = reelsManager.currentUser.email;
        
        if (adminEmails.includes(userEmail)) {
            // إظهار رابط الإدارة
            const adminBtn = document.getElementById('adminSettingsBtn');
            if (adminBtn) {
                adminBtn.style.display = 'block';
            }
        } else {
            // إخفاء رابط الإدارة
            const adminBtn = document.getElementById('adminSettingsBtn');
            if (adminBtn) {
                adminBtn.style.display = 'none';
            }
        }
    } else {
        // إخفاء رابط الإدارة إذا لم يكن مسجل دخول
        const adminBtn = document.getElementById('adminSettingsBtn');
        if (adminBtn) {
            adminBtn.style.display = 'none';
        }
    }
}

// فتح صفحة الإدارة
function openAdminSettings() {
    window.location.href = 'admin-settings.html';
}

// مراقبة تغيير حالة تسجيل الدخول
function monitorAuthState() {
    if (typeof reelsManager !== 'undefined' && reelsManager.auth) {
        reelsManager.auth.onAuthStateChanged((user) => {
            // تحديث حالة رابط الإدارة عند تغيير تسجيل الدخول
            setTimeout(() => {
                checkAdminAccess();
            }, 1000); // تأخير قصير للتأكد من تحديث reelsManager.currentUser
        });
    }
}


// تحديث لون شريط الحالة حسب المود
function updateStatusBarTheme() {
    const theme = document.documentElement.getAttribute('data-theme');
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    const appleStatusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    
    if (theme === 'dark') {
        // المود الداكن - شريط الحالة بنفس لون الميني بلاير
        if (themeColorMeta) {
            themeColorMeta.setAttribute('content', '#2d2d2d');
        }
        if (appleStatusBarMeta) {
            appleStatusBarMeta.setAttribute('content', 'black-translucent');
        }
    } else {
        // المود الفاتح - شريط الحالة فاتح
        if (themeColorMeta) {
            themeColorMeta.setAttribute('content', '#f4f5fa');
        }
        if (appleStatusBarMeta) {
            appleStatusBarMeta.setAttribute('content', 'default');
        }
    }
}

// مراقبة تغيير المود
function watchThemeChanges() {
    // مراقب تغيير المود
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                updateStatusBarTheme();
            }
        });
    });
    
    // بدء المراقبة
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });
    
    // تحديث فوري عند التحميل
    updateStatusBarTheme();
}

// تهيئة مراقبة حالة المصادقة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // فحص فوري
    checkAdminAccess();
    
    // مراقبة التغييرات
    monitorAuthState();
    
    
    // مراقبة تغيير المود
    watchThemeChanges();
    
    // فحص دوري كل 5 ثوان
    setInterval(checkAdminAccess, 5000);
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        initializeHomeSection, 
        toggleBottomNavbar, 
        hideBottomNavbar, 
        updateActiveNavItem,
        checkAdminAccess,
        openAdminSettings,
        monitorAuthState
    };
}
