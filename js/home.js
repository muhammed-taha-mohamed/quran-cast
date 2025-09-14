// Home Section Functionality
function initializeHomeSection() {
    const homeSection = document.getElementById('section-home');
    if (!homeSection) return;

    // The complete home section HTML content
    const homeHTML = `
        <!-- Hero Section -->
        <div style="border-radius: 0%; width: 100%;"
            class="hero-section prayer-hero bg-image text-center py-5 mb-5">
            <!-- Desktop Image Background -->
            <div class="d-none d-md-block">

            </div>

            <!-- Mobile Video Background -->
            <video autoplay muted loop playsinline class="d-md-none hero-video">
                <source src="media/vedios/quran_page_mobile.mp4" type="video/mp4">
            </video>

            <!-- Mobile Stats (Top Position) -->
            <div class="mobile-stats-box d-md-none">
                <div class="prayer-stats-row-mobile">
                    <div class="prayer-stat-item-mobile">
                        <div class="stat-content">
                            <div class="stat-label">الصلاة القادمة</div>
                            <div class="stat-value" id="nextPrayerNameMobile">--</div>
                        </div>
                    </div>
                    <div class="prayer-stat-item-mobile">
                        <div class="stat-content">
                            <div class="stat-label">المؤقت</div>
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
                                            <div class="stat-label">الصلاة القادمة</div>

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
                                            <div class="stat-label">الوقت المتبقي</div>
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
                                <h5 class="salah-title" style="color: #0f766e;" class="mb-0">مواقيت الصلاة اليوم
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
                                    <div class="prayer-name">الفجر</div>
                                    <div class="prayer-time" id="fajr">--:--</div>
                                    <div class="prayer-status"> </div>
                                </div>
                            </div>
                            <div class="prayer-time-item sunrise enhanced-prayer-item sunrise">
                                <div class="prayer-info">
                                    <div class="prayer-name">الشروق</div>
                                    <div class="prayer-time" id="sunrise">--:--</div>
                                    <div class="prayer-status"> </div>
                                </div>
                            </div>
                            <div class="prayer-time-item dhuhr enhanced-prayer-item duhr">
                                <div class="prayer-info">
                                    <div class="prayer-name">الظهر</div>
                                    <div class="prayer-time" id="dhuhr">--:--</div>
                                    <div class="prayer-status"> </div>
                                </div>
                            </div>
                            <div class="prayer-time-item asr enhanced-prayer-item asr">
                                <div class="prayer-info">
                                    <div class="prayer-name">العصر</div>
                                    <div class="prayer-time" id="asr">--:--</div>
                                    <div class="prayer-status"> </div>
                                </div>
                            </div>
                            <div class="prayer-time-item maghrib enhanced-prayer-item maghrib">
                                <div class="prayer-info">
                                    <div class="prayer-name">المغرب</div>
                                    <div class="prayer-time" id="maghrib">--:--</div>
                                    <div class="prayer-status"> </div>
                                </div>
                            </div>
                            <div class="prayer-time-item isha enhanced-prayer-item ishaa">
                                <div class="prayer-info">
                                    <div class="prayer-name">العشاء</div>
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
                                     اذكار الصلاة
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
                                <h5 style="color: #0f766e;" class="mb-0">
                                    المسبحـة
                                </h5>
                            </div>
                        </div>
                        <div class="header-actions">
                            <button class="btn btn-outline-success btn-sm" onclick="returnToAdhkarSection()"
                                title="العودة للأذكار">
                                <i class="bi bi-arrow-up-circle"></i>
                                الاذكار
                            </button>
                            <button class="btn btn-outline-success btn-sm" onclick="showCustomDhikrModal()">
                                <i class="bi bi-plus-circle"></i>
                                تخصيص
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-12 text-center">
                                <div class="tasbih-counter">
                                    <div class="counter-display" id="tasbihCounter" onclick="incrementTasbih()"
                                        style="cursor: pointer;" title="اضغط لزيادة العداد">0</div>
                                    <br>
                                    <div class="current-dhikr" id="currentDhikr">اختر ذكراً للبدء</div>
                                </div>

                                <!-- Circular Control Buttons -->
                                <div class="tasbih-controls-circular">
                                    <button class="btn btn-success btn-lg tasbih-btn-circular increment-btn"
                                        onclick="incrementTasbih()" title="زيادة">
                                        <i class="bi bi-plus-circle-fill"></i>
                                    </button>
                                    <button class="btn btn-danger btn-lg tasbih-btn-circular reset-btn"
                                        onclick="resetTasbih()" title="إعادة تعيين">
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
                                إضافة ذكر مخصص
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="customDhikrText" class="form-label">نص الذكر</label>
                                <input type="text" class="form-control" id="customDhikrText"
                                    placeholder="مثال: لا حول ولا قوة إلا بالله">
                            </div>
                            <div class="mb-3">
                                <label for="customDhikrCount" class="form-label">عدد مرات التكرار</label>
                                <input type="number" class="form-control" id="customDhikrCount"
                                    placeholder="مثال: 99" min="1" max="999">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                            <button type="button" class="btn btn-primary" onclick="addCustomDhikr()">
                                <i class="bi bi-check-circle"></i>
                                إضافة
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    `;

    // Set the HTML content
    homeSection.innerHTML = homeHTML;
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

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initializeHomeSection };
}
