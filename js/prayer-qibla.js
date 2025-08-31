// Prayer Times and Qibla Combined JavaScript

// Global variables
let currentLocation = null;
let prayerTimes = null;
let nextPrayer = null;
let countdownInterval = null;
let qiblaAngle = 0;

// Tasbih and Dhikr variables
let tasbihCount = 0;
let currentDhikr = null;
let targetCount = 0;
let customDhikrs = [];

// Kaaba coordinates (Makkah)
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, initializing prayer-qibla page...');

    // Check if required elements exist
    const requiredElements = [
        'prayerTimesGrid',
        'nextPrayerName',
        'prayerDate',
        'fajr',
        'dhuhr',
        'asr',
        'maghrib',
        'isha'
    ];

    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements);
        return;
    }

    console.log('All required elements found, proceeding with initialization...');

    // Initialize enhanced prayer times with table support
    initializeEnhancedPrayerTimes();

    // Update prayer date
    updatePrayerDate();

    // Start countdown timer
    startCountdown();

    // Start auto-refresh for prayer times
    startAutoRefresh();

    // Load tasbih state
    loadTasbihState();
});

// Request location directly from browser without popup
async function requestLocation() {
    try {
        console.log('Requesting location directly from browser...');

        // Check if we have a stored location first
        const storedLocation = localStorage.getItem('userLocation');
        if (storedLocation) {
            try {
                currentLocation = JSON.parse(storedLocation);
                console.log('Using stored location:', currentLocation);

                // Load prayer times and qibla direction with stored location
                await loadPrayerTimes();
                calculateQiblaDirection();
                updateHeroStats();
                return;
            } catch (error) {
                console.log('Error parsing stored location, requesting new location...');
                localStorage.removeItem('userLocation');
            }
        }

        // Request location directly from browser
        console.log('Getting current position...');
        const position = await getCurrentPosition();
        console.log('Position received:', position);

        currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        };

        // Store location in localStorage
        localStorage.setItem('userLocation', JSON.stringify(currentLocation));
        console.log('Location stored and current location set to:', currentLocation);

        // Load prayer times and qibla direction
        console.log('Loading prayer times...');
        await loadPrayerTimes();

        console.log('Calculating qibla direction...');
        calculateQiblaDirection();

        // Update hero stats with prayer times
        updateHeroStats();

    } catch (error) {
        console.error('Error getting location:', error);
        handleLocationError(error);
    }
}

// Update location manually (called from update location button)
async function updateLocation() {
    try {
        console.log('Updating location...');

        // Clear stored location
        localStorage.removeItem('userLocation');

        // Request new location
        await requestLocation();



    } catch (error) {
        console.error('Error updating location:', error);

    }
}



// Get current position with timeout
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
        }

        const timeoutId = setTimeout(() => {
            reject(new Error('Location request timed out'));
        }, 15000); // 15 seconds timeout (increased for better reliability)

        navigator.geolocation.getCurrentPosition(
            (position) => {
                clearTimeout(timeoutId);
                resolve(position);
            },
            (error) => {
                clearTimeout(timeoutId);
                reject(error);
            },
            {
                enableHighAccuracy: false, // Changed to false for better compatibility
                timeout: 15000,
                maximumAge: 600000 // 10 minutes cache (increased)
            }
        );
    });
}

// Get location name from coordinates
async function getLocationName(lat, lng) {
    try {
        // Try multiple geocoding services for better reliability
        let locationName = null;

        // Try BigDataCloud API first
        try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=ar`);
            if (response.ok) {
                const data = await response.json();

                if (data.city && data.countryName) {
                    locationName = `${data.city}, ${data.countryName}`;
                } else if (data.locality && data.countryName) {
                    locationName = `${data.locality}, ${data.countryName}`;
                }
            }
        } catch (error) {
            console.log('BigDataCloud API failed, trying alternative...');
        }

        // If first API failed, try alternative
        if (!locationName) {
            try {
                const response2 = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`);
                if (response2.ok) {
                    const data2 = await response2.json();
                    if (data2.address) {
                        const city = data2.address.city || data2.address.town || data2.address.village;
                        const country = data2.address.country;
                        if (city && country) {
                            locationName = `${city}, ${country}`;
                        }
                    }
                }
            } catch (error2) {
                console.log('OpenStreetMap API also failed');
            }
        }

        // If all APIs failed, return coordinates
        if (!locationName) {
            locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }

        return locationName;

    } catch (error) {
        console.error('Error getting location name:', error);
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
}

// Handle location errors
function handleLocationError(error) {
    let errorMessage = 'حدث خطأ في تحديد الموقع';

    if (error.code !== undefined) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = 'تم رفض طلب الموقع. يرجى السماح بالوصول للموقع.';
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = 'معلومات الموقع غير متاحة.';
                break;
            case error.TIMEOUT:
                errorMessage = 'انتهت مهلة طلب الموقع.';
                break;
            case error.UNKNOWN_ERROR:
                errorMessage = 'حدث خطأ غير معروف.';
                break;
        }
    } else if (error.message) {
        if (error.message.includes('timeout')) {
            errorMessage = 'انتهت مهلة طلب الموقع.';
        } else if (error.message.includes('not supported')) {
            errorMessage = 'المتصفح لا يدعم تحديد الموقع.';
        } else {
            errorMessage = error.message;
        }
    }

    // Try to load prayer times with default location (Mecca) as fallback
    setTimeout(() => {
        if (!currentLocation) {
            console.log('Using default location (Mecca) as fallback');
            currentLocation = {
                latitude: 21.4225,
                longitude: 39.8262
            };
            loadPrayerTimes();
            calculateQiblaDirection();
        }
    }, 2000);
}

// Show prayer times error with retry button
function showPrayerTimesError() {
    const grid = document.getElementById('prayerTimesGrid');
    grid.innerHTML = `
        <div class="alert alert-danger text-center">
            <i class="bi bi-exclamation-triangle me-2"></i>
            حدث خطأ في تحميل مواقيت الصلاة
            <br>
            <button class="btn btn-warning btn-sm mt-2" onclick="loadPrayerTimes()">
                <i class="bi bi-arrow-clockwise me-1"></i>إعادة المحاولة
            </button>
        </div>
    `;
}





// Load prayer times from API
async function loadPrayerTimes() {
    if (!currentLocation) {
        console.log('No current location, cannot load prayer times');
        return;
    }

    try {
        console.log('Loading prayer times for location:', currentLocation);

        // Show loading state
        const grid = document.getElementById('prayerTimesGrid');
        if (!grid) {
            console.error('Prayer times grid element not found');
            return;
        }

        const date = new Date();
        const timestamp = Math.floor(date.getTime() / 1000);

        console.log('Requesting prayer times for timestamp:', timestamp);

        // Try multiple API endpoints for better reliability
        let data = null;
        let apiError = null;

        // Try Aladhan API first
        try {
            const apiUrl = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${currentLocation.latitude}&longitude=${currentLocation.longitude}&method=4`;
            console.log('Trying API URL:', apiUrl);

            const response = await fetch(apiUrl);
            console.log('API response status:', response.status);

            if (response.ok) {
                data = await response.json();
                console.log('API response data:', data);
            } else {
                console.error('API response not ok:', response.status, response.statusText);
            }
        } catch (error) {
            apiError = error;
            console.error('Aladhan API failed:', error);
        }

        // If first API failed, try alternative endpoint
        if (!data || data.status !== 'OK') {
            console.log('First API failed, trying alternative...');
            try {
                const response2 = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent('cairo')}&country=${encodeURIComponent('Egypta')}&method=4`);
                if (response2.ok) {
                    data = await response2.json();
                    console.log('Alternative API response:', data);
                }
            } catch (error2) {
                console.error('Alternative API also failed:', error2);
            }
        }

        // If still no data, use fallback prayer times
        if (!data || data.status !== 'OK') {
            console.warn('Using fallback prayer times');
            data = {
                status: 'OK',
                data: {
                    timings: {
                        Fajr: '05:30',
                        Dhuhr: '12:30',
                        Asr: '15:45',
                        Maghrib: '18:15',
                        Isha: '19:45'
                    }
                }
            };
            console.log('Fallback prayer times set:', data.data.timings);
        }

        console.log('Final prayer times data:', data);

        if (data.status === 'OK' && data.data && data.data.timings) {
            prayerTimes = data.data.timings;
            console.log('Prayer times set to:', prayerTimes);
            displayPrayerTimes();
            calculateNextPrayer();
            updateHeroStats();
        } else {
            throw new Error('Invalid API response format');
        }

    } catch (error) {
        console.error('Error loading prayer times:', error);
        showPrayerTimesError();
    }
}

// Display prayer times
function displayPrayerTimes() {
    // Update the prayer date first
    updatePrayerDate();

    if (!prayerTimes) {
        console.log('No prayer times data to display');
        return;
    }

    console.log('Displaying prayer times:', prayerTimes);

    // Use enhanced display function for cards
    displayPrayerTimesEnhanced();
}

// Helper function to create prayer time element if missing
function createPrayerTimeElement(prayerId) {
    try {
        const grid = document.getElementById('prayerTimesGrid');
        if (!grid) {
            console.error('Prayer times grid not found');
            return null;
        }

        // Create the prayer time item container
        const prayerItem = document.createElement('div');
        prayerItem.className = 'prayer-time-item';

        // Create prayer name
        const prayerName = document.createElement('div');
        prayerName.className = 'prayer-name';
        prayerName.textContent = getPrayerName(prayerId);

        // Create prayer time
        const prayerTime = document.createElement('div');
        prayerTime.className = 'prayer-time';
        prayerTime.id = prayerId;
        prayerTime.textContent = '--:--';

        // Assemble the element
        prayerItem.appendChild(prayerName);
        prayerItem.appendChild(prayerTime);

        // Add to grid
        grid.appendChild(prayerItem);

        console.log(`✅ Created missing element: ${prayerId}`);
        return prayerTime;

    } catch (error) {
        console.error(`❌ Error creating element ${prayerId}:`, error);
        return null;
    }
}

// Helper function to get prayer name in Arabic
function getPrayerName(prayerId) {
    const names = {
        'fajr': 'الفجر',
        'sunrise': 'الشروق',
        'dhuhr': 'الظهر',
        'asr': 'العصر',
        'maghrib': 'المغرب',
        'isha': 'العشاء'
    };
    return names[prayerId] || prayerId;
}

// Update prayer status based on current time
function updatePrayerStatus() {
    try {
        if (!prayerTimes) {
            console.log('No prayer times available for status update');
            return;
        }

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes

        const prayerOrder = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
        let currentPrayerIndex = -1;
        let nextPrayerIndex = -1;

        // Find current and next prayer
        for (let i = 0; i < prayerOrder.length; i++) {
            const prayerKey = prayerOrder[i];
            const prayerTime = prayerTimes[prayerKey] || prayerTimes[prayerKey.charAt(0).toUpperCase() + prayerKey.slice(1)];

            if (prayerTime) {
                const [hours, minutes] = prayerTime.split(':').map(Number);
                const prayerTimeInMinutes = hours * 60 + minutes;

                if (prayerTimeInMinutes <= currentTime) {
                    currentPrayerIndex = i;
                } else {
                    if (nextPrayerIndex === -1) {
                        nextPrayerIndex = i;
                    }
                }
            }
        }

        console.log('Prayer status update - Current index:', currentPrayerIndex, 'Next index:', nextPrayerIndex);

        // Update status for each prayer
        prayerOrder.forEach((prayerId, index) => {
            try {
                const timeElement = document.getElementById(prayerId);
                if (!timeElement) {
                    console.warn(`Time element not found for ${prayerId}`);
                    return;
                }

                const prayerItem = timeElement.closest('.prayer-time-item, .enhanced-prayer-item');
                if (!prayerItem) {
                    console.warn(`Prayer item not found for ${prayerId}`);
                    return;
                }

                const statusElement = prayerItem.querySelector('.prayer-status');
                if (statusElement) {
                    statusElement.classList.remove('past', 'current', 'upcoming');

                    if (index < currentPrayerIndex) {
                        // Past prayer
                        statusElement.textContent = 'مرت';
                        statusElement.classList.add('past');
                        console.log(`${prayerId}: Past prayer`);
                    } else if (index === currentPrayerIndex) {
                        // Current prayer
                        statusElement.textContent = 'حالية';
                        statusElement.classList.add('current');
                        console.log(`${prayerId}: Current prayer`);
                    } else {
                        // Upcoming prayer
                        statusElement.textContent = 'قادمة';
                        statusElement.classList.add('upcoming');
                        console.log(`${prayerId}: Upcoming prayer`);
                    }
                } else {
                    console.warn(`Status element not found for ${prayerId}`);
                }
            } catch (error) {
                console.error(`Error updating status for ${prayerId}:`, error);
            }
        });

        console.log('Prayer status update completed successfully');
    } catch (error) {
        console.error('Error in updatePrayerStatus:', error);
    }
}



// Calculate next prayer
function calculateNextPrayer() {
    console.log('🔍 calculateNextPrayer called with prayerTimes:', prayerTimes);
    if (!prayerTimes) {
        console.log('❌ No prayer times available for next prayer calculation');
        return;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Helper function to get prayer time
    function getPrayerTime(prayerKey) {
        const possibleKeys = [prayerKey, prayerKey.charAt(0).toUpperCase() + prayerKey.slice(1)];
        for (let key of possibleKeys) {
            if (prayerTimes[key]) {
                return prayerTimes[key];
            }
        }
        return null;
    }

    const prayerTimesArray = [
        { name: 'الفجر', time: getPrayerTime('fajr'), id: 'fajr' },
        { name: 'الشروق', time: getPrayerTime('sunrise'), id: 'sunrise' },
        { name: 'الظهر', time: getPrayerTime('dhuhr'), id: 'dhuhr' },
        { name: 'العصر', time: getPrayerTime('asr'), id: 'asr' },
        { name: 'المغرب', time: getPrayerTime('maghrib'), id: 'maghrib' },
        { name: 'العشاء', time: getPrayerTime('isha'), id: 'isha' }
    ].filter(prayer => prayer.time); // Only include prayers with valid times

    let nextPrayerTime = null;

    for (let prayer of prayerTimesArray) {
        const prayerMinutes = timeToMinutes(prayer.time);
        if (prayerMinutes > currentTime) {
            nextPrayerTime = prayer;
            break;
        }
    }

    // If no prayer found today, use tomorrow's fajr
    if (!nextPrayerTime && prayerTimesArray.length > 0) {
        nextPrayerTime = prayerTimesArray[0]; // Use first prayer (usually Fajr)
    }

    if (nextPrayerTime) {
        nextPrayer = {
            name: nextPrayerTime.name,
            time: nextPrayerTime.time,
            id: nextPrayerTime.id
        };
        console.log('Next prayer set:', nextPrayer);
        updateCountdown();

        // Calculate time until next prayer
        const now = new Date();
        const [hours, minutes] = nextPrayerTime.time.split(':');
        const targetTime = new Date();
        targetTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // If prayer time has passed today, use tomorrow
        if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
        }

        const timeDiff = targetTime - now;
        nextPrayer.timeUntil = Math.floor(timeDiff / (1000 * 60)); // Convert to minutes
        console.log('Time until next prayer (minutes):', nextPrayer.timeUntil);
    }
}

// Start countdown timer
function startCountdown() {
    console.log('🔍 startCountdown called with nextPrayer:', nextPrayer);

    if (countdownInterval) {
        clearInterval(countdownInterval);
        console.log('🔄 Cleared existing countdown interval');
    }

    countdownInterval = setInterval(updateCountdown, 1000);
    console.log('✅ Countdown interval started, updating every 1 second');

    // Initial update of mobile stats
    if (nextPrayer) {
        console.log('📱 Updating mobile stats...');
        updateMobileStats();
    } else {
        console.log('⚠️ No nextPrayer available for mobile stats update');
    }

    // Initial update of prayer status
    console.log('📊 Updating prayer status...');
    updatePrayerStatus();
}

// Update countdown display
function updateCountdown() {
    try {
        console.log('🔍 updateCountdown called with nextPrayer:', nextPrayer, 'prayerTimes:', prayerTimes);
        if (!nextPrayer || !prayerTimes) {
            console.log('❌ Missing data for countdown update - nextPrayer:', !!nextPrayer, 'prayerTimes:', !!prayerTimes);
            return;
        }

        const now = new Date();
        let targetTime = new Date();

        if (nextPrayer.id === 'fajr' && timeToMinutes(nextPrayer.time) < now.getHours() * 60 + now.getMinutes()) {
            // Tomorrow's fajr
            targetTime.setDate(targetTime.getDate() + 1);
        }

        const [hours, minutes] = nextPrayer.time.split(':');
        targetTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const timeDiff = targetTime - now;

        if (timeDiff <= 0) {
            // Prayer time reached, recalculate
            calculateNextPrayer();
            return;
        }

        const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const secondsLeft = Math.floor((timeDiff % (1000 * 60)) / 1000);

        const countdownString = `${hoursLeft.toString().padStart(2, '0')}:${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`;

        // Update next prayer name display
        const nextPrayerName = document.getElementById('nextPrayerName');
        const nextPrayerNameMobile = document.getElementById('nextPrayerNameMobile');
        if (nextPrayerName && nextPrayer) {
            // Check if it contains SVG loader (initial state)
            const svgLoader = nextPrayerName.querySelector('svg');
            if (svgLoader) {
                // Replace SVG loader with prayer name
                nextPrayerName.innerHTML = nextPrayer.name;
            } else {
                // Update existing text
                nextPrayerName.textContent = nextPrayer.name;
            }
        }
        if (nextPrayerNameMobile && nextPrayer) {
            nextPrayerNameMobile.textContent = nextPrayer.name;
        }

        // Update next prayer time display
        const nextPrayerTimeMobile = document.getElementById('nextPrayerTimeMobile');
        if (nextPrayerTimeMobile && nextPrayer) {
            nextPrayerTimeMobile.textContent = nextPrayer.time;
        }

        // Update hero countdown display
        const heroPrayerCountdown = document.getElementById('heroPrayerCountdown');
        if (heroPrayerCountdown) {
            // Check if it contains SVG loader (initial state)
            const svgLoader = heroPrayerCountdown.querySelector('svg');
            if (svgLoader) {
                // Replace SVG loader with countdown text
                heroPrayerCountdown.innerHTML = countdownString;
                console.log('Hero countdown updated:', countdownString);
            } else {
                // Update existing countdown text
                heroPrayerCountdown.textContent = countdownString;
                console.log('Hero countdown updated:', countdownString);
            }
        }

        // Update mobile stats with current countdown
        nextPrayer.timeUntil = Math.floor(timeDiff / (1000 * 60));

        // Update mobile countdown with real-time seconds
        const prayerCountdownMobile = document.getElementById('prayerCountdownMobile');
        if (prayerCountdownMobile) {
            const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
            const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const secondsLeft = Math.floor((timeDiff % (1000 * 60)) / 1000);

            const countdownString = `${hoursLeft.toString().padStart(2, '0')}:${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`;
            prayerCountdownMobile.textContent = countdownString;

            // Debug log for mobile countdown
            console.log('Mobile countdown updated:', countdownString);
        }

        // Update mobile stats every second for real-time countdown
        updateMobileStats();

        // Update prayer status every minute
        if (now.getSeconds() === 0) {
            updatePrayerStatus();
        }

    } catch (error) {
        console.error('Error updating countdown:', error);
        // Reset countdown displays on error (countdownDisplay1 has SVG loader, don't reset)
        const heroPrayerCountdown = document.getElementById('heroPrayerCountdown');
        if (heroPrayerCountdown) {
            heroPrayerCountdown.textContent = '--:--:--';
        }
    }
}

// Calibrate compass function
function calibrateCompass() {
    try {
        console.log('🧭 Calibrating compass...');

        // Show calibration message
        const qiblaDirection = document.getElementById('qiblaDirection');
        if (qiblaDirection) {
            qiblaDirection.textContent = 'جاري المعايرة...';
        }

        // Request device orientation permission if available
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        console.log('✅ Device orientation permission granted');
                        startCompassCalibration();
                    } else {
                        console.log('❌ Device orientation permission denied');
                        showCalibrationError('يرجى السماح بالوصول لاتجاه الجهاز');
                    }
                })
                .catch(error => {
                    console.error('Error requesting device orientation permission:', error);
                    showCalibrationError('خطأ في طلب إذن الاتجاه');
                });
        } else {
            // Fallback for devices without permission request
            console.log('Device orientation permission not required');
            startCompassCalibration();
        }

    } catch (error) {
        console.error('Error calibrating compass:', error);
        showCalibrationError('خطأ في معايرة البوصلة');
    }
}

// Start compass calibration
function startCompassCalibration() {
    try {
        // Add calibration animation
        const compassRing = document.querySelector('.google-compass-ring');
        if (compassRing) {
            compassRing.classList.add('calibrating');
        }

        // Listen for device orientation changes
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleDeviceOrientation);
            console.log('✅ Device orientation listener added');
        } else {
            console.log('❌ Device orientation not supported');
            showCalibrationError('هذا الجهاز لا يدعم البوصلة');
        }

        // Simulate calibration completion after 3 seconds
        setTimeout(() => {
            completeCalibration();
        }, 3000);

    } catch (error) {
        console.error('Error starting compass calibration:', error);
        showCalibrationError('خطأ في بدء المعايرة');
    }
}

// Handle device orientation changes
function handleDeviceOrientation(event) {
    try {
        if (event.alpha !== null) {
            // Alpha is the rotation around the z-axis (0-360)
            const alpha = event.alpha;
            console.log('Device alpha rotation:', alpha);

            // Update compass rotation
            updateCompassRotation(alpha);
        }

        if (event.beta !== null) {
            // Beta is the front-to-back tilt (-180 to 180)
            const beta = event.beta;
            console.log('Device beta tilt:', beta);
        }

        if (event.gamma !== null) {
            // Gamma is the left-to-right tilt (-90 to 90)
            const gamma = event.gamma;
            console.log('Device gamma tilt:', gamma);
        }

    } catch (error) {
        console.error('Error handling device orientation:', error);
    }
}

// Update compass rotation
function updateCompassRotation(alpha) {
    try {
        const compassRing = document.querySelector('.google-compass-ring');
        if (compassRing) {
            // Apply rotation to compass ring
            compassRing.style.transform = `rotate(${-alpha}deg)`;
        }

        // Update qibla arrow if we have the angle
        if (qiblaAngle !== undefined) {
            const qiblaArrow = document.getElementById('qiblaArrow');
            if (qiblaArrow) {
                const adjustedAngle = qiblaAngle - alpha;
                qiblaArrow.style.transform = `translate(-50%, -50%) rotate(${adjustedAngle}deg)`;
            }
        }

    } catch (error) {
        console.error('Error updating compass rotation:', error);
    }
}

// Complete calibration
function completeCalibration() {
    try {
        console.log('✅ Compass calibration completed');

        // Remove calibration animation
        const compassRing = document.querySelector('.google-compass-ring');
        if (compassRing) {
            compassRing.classList.remove('calibrating');
        }

        // Update direction display
        const qiblaDirection = document.getElementById('qiblaDirection');
        if (qiblaDirection && qiblaDirection.textContent === 'جاري المعايرة...') {
            qiblaDirection.textContent = 'تمت المعايرة';
        }

        // Show success message
        showCalibrationSuccess();

    } catch (error) {
        console.error('Error completing calibration:', error);
    }
}

// Show calibration error
function showCalibrationError(message) {
    try {
        console.log('Calibration error:', message);

        // Update direction display
        const qiblaDirection = document.getElementById('qiblaDirection');
        if (qiblaDirection) {
            qiblaDirection.textContent = message;
            qiblaDirection.style.color = 'var(--danger)';
        }

        // Remove calibration animation
        const compassRing = document.querySelector('.google-compass-ring');
        if (compassRing) {
            compassRing.classList.remove('calibrating');
        }



    } catch (error) {
        console.error('Error showing calibration error:', error);
    }
}

// Show calibration success
function showCalibrationSuccess() {
    try {
        console.log('Calibration success');



        // Update direction display if needed
        const qiblaDirection = document.getElementById('qiblaDirection');
        if (qiblaDirection && qiblaDirection.textContent === 'تمت المعايرة') {
            setTimeout(() => {
                if (qiblaDirection.textContent === 'تمت المعايرة') {
                    qiblaDirection.textContent = '--';
                    qiblaDirection.style.color = '';
                }
            }, 3000);
        }

    } catch (error) {
        console.error('Error showing calibration success:', error);
    }
}



// Enhanced qibla direction calculation
function calculateQiblaDirection() {
    if (!currentLocation) return;

    try {
        const lat1 = currentLocation.latitude * Math.PI / 180;
        const lat2 = KAABA_LAT * Math.PI / 180;
        const lng1 = currentLocation.longitude * Math.PI / 180;
        const lng2 = KAABA_LNG * Math.PI / 180;

        const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);

        qiblaAngle = Math.atan2(y, x) * 180 / Math.PI;

        // Normalize to 0-360
        qiblaAngle = (qiblaAngle + 360) % 360;

        // Calculate distance
        const distance = calculateDistance(
            currentLocation.latitude, currentLocation.longitude,
            KAABA_LAT, KAABA_LNG
        );

        displayQiblaDirection(qiblaAngle, distance);

        // Update compass arrow
        updateQiblaArrow(qiblaAngle);

    } catch (error) {
        console.error('Error calculating qibla direction:', error);
        showQiblaError();
    }
}

// Update qibla arrow
function updateQiblaArrow(angle) {
    try {
        const qiblaArrow = document.getElementById('qiblaArrow');
        if (qiblaArrow) {
            // Apply rotation to arrow
            qiblaArrow.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

            // Add pulse animation
            qiblaArrow.classList.add('pulse');
            setTimeout(() => qiblaArrow.classList.remove('pulse'), 1000);
        }

        // Optional: progress circle may not exist after UI changes
        const progressCircle = document.getElementById('progressCircle');
        if (progressCircle) {
            const circumference = 2 * Math.PI * 54; // 2πr
            const progress = (angle / 360) * circumference;
            progressCircle.style.strokeDashoffset = circumference - progress;
        }

    } catch (error) {
        console.error('Error updating qibla arrow:', error);
    }
}

// Show qibla error
function showQiblaError() {
    try {
        const directionText = document.getElementById('qiblaDirection');
        const distanceText = document.getElementById('qiblaDistance');
        const angleText = document.getElementById('qiblaAngle');

        if (directionText) directionText.textContent = 'خطأ في الحساب';
        if (distanceText) distanceText.textContent = '--';
        if (angleText) angleText.textContent = '--';



    } catch (error) {
        console.error('Error showing qibla error:', error);
    }
}

// Calculate distance between two points
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Display qibla direction with enhanced animation
function displayQiblaDirection(angle, distance) {
    try {
        const arrow = document.getElementById('qiblaArrow');
        const directionText = document.getElementById('qiblaDirection');
        const distanceText = document.getElementById('qiblaDistance');
        const angleText = document.getElementById('qiblaAngle');

        if (!arrow || !directionText || !distanceText || !angleText) {
            console.error('Qibla display elements not found');
            return;
        }

        // Rotate arrow smoothly
        arrow.style.transform = `rotate(${angle}deg)`;

        // Get direction name
        const direction = getDirectionName(angle);
        directionText.textContent = direction;

        // Display distance
        if (distance < 1) {
            distanceText.textContent = `${(distance * 1000).toFixed(0)} متر`;
        } else {
            distanceText.textContent = `${distance.toFixed(1)} كم`;
        }

        // Display angle
        angleText.textContent = `${angle.toFixed(1)}°`;

        // Add pulse animation
        arrow.classList.add('pulse');
        setTimeout(() => arrow.classList.remove('pulse'), 1000);

    } catch (error) {
        console.error('Error displaying qibla direction:', error);
        // Show error state
        const directionText = document.getElementById('qiblaDirection');
        const distanceText = document.getElementById('qiblaDistance');
        const angleText = document.getElementById('qiblaAngle');

        if (directionText) directionText.textContent = 'خطأ في العرض';
        if (distanceText) distanceText.textContent = '--';
        if (angleText) angleText.textContent = '--';
    }
}

// Get direction name in Arabic
function getDirectionName(angle) {
    const directions = [
        { name: 'شمال', range: [337.5, 22.5] },
        { name: 'شمال شرق', range: [22.5, 67.5] },
        { name: 'شرق', range: [67.5, 112.5] },
        { name: 'جنوب شرق', range: [112.5, 157.5] },
        { name: 'جنوب', range: [157.5, 202.5] },
        { name: 'جنوب غرب', range: [202.5, 247.5] },
        { name: 'غرب', range: [247.5, 292.5] },
        { name: 'شمال غرب', range: [292.5, 337.5] }
    ];

    for (let dir of directions) {
        if (angle >= dir.range[0] && angle < dir.range[1]) {
            return dir.name;
        }
    }

    return 'شمال';
}

// Update hijri date
function updateHijriDate() {
    try {
        const today = new Date();
        const hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(today);

        const parts = hijriDate.split(' ');
        if (parts.length >= 3) {
            const dayElement = document.getElementById('hijriDay');
            const monthElement = document.getElementById('hijriMonth');
            const yearElement = document.getElementById('hijriYear');

            if (dayElement) dayElement.textContent = parts[0];
            if (monthElement) monthElement.textContent = parts[1];
            if (yearElement) yearElement.textContent = parts[2];
        }
    } catch (error) {
        console.error('Error updating hijri date:', error);
        // Show fallback date
        const dayElement = document.getElementById('hijriDay');
        const monthElement = document.getElementById('hijriMonth');
        const yearElement = document.getElementById('hijriYear');

        if (dayElement) dayElement.textContent = '--';
        if (monthElement) monthElement.textContent = '--';
        if (yearElement) yearElement.textContent = '--';
    }
}

// Refresh location and data
function refreshLocation() {
    try {
        console.log('🔄 Refreshing location and data...');

        // Clear previous data
        if (prayerTimes) {
            prayerTimes = null;
        }
        if (nextPrayer) {
            nextPrayer = null;
        }

        // Reset displays - just update the text, don't recreate elements
        const prayerIds = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        prayerIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = '--:--';
                element.style.color = 'var(--text-muted)';
                element.style.fontWeight = '400';
            }
        });

        // Reset web countdown displays (countdownDisplay1 has SVG loader, don't reset)
        const heroPrayerCountdown = document.getElementById('heroPrayerCountdown');
        if (heroPrayerCountdown) {
            heroPrayerCountdown.textContent = '--:--:--';
        }

        // Update prayer date
        updatePrayerDate();

        // Clear any success/error messages
        const grid = document.getElementById('prayerTimesGrid');
        if (grid) {
            const alerts = grid.querySelectorAll('.alert');
            alerts.forEach(alert => alert.remove());
        }

        console.log('✅ Display reset completed, requesting new location...');

        // Request new location
        requestLocation();

    } catch (error) {
        console.error('❌ Error refreshing location:', error);
    }
}

// Utility functions
function formatTime(timeString) {
    if (!timeString) return '--:--';
    return timeString.substring(0, 5);
}

// Helper function to format time in 12-hour format with Arabic AM/PM
function formatTime12Hour(timeString) {
    if (!timeString) return '--:--';

    try {
        const [hours, minutes] = timeString.split(':').map(Number);
        let displayHours = hours;
        let period = '';

        if (hours === 0) {
            displayHours = 12;
            period = 'ص';
        } else if (hours === 12) {
            period = 'م';
        } else if (hours > 12) {
            displayHours = hours - 12;
            period = 'م';
        } else {
            period = 'ص';
        }

        return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
        console.error('Error formatting 12-hour time:', error);
        return '--:--';
    }
}

function timeToMinutes(timeString) {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

// Theme toggle function
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

// Go to reading page
function goToReading() {
    window.location.href = 'reading.html';
}

// Go to player page
function goToPlayer() {
    window.location.href = 'player.html';
}

// Language toggle function
function toggleLanguage() {
    const langText = document.getElementById('langText');
    const currentLang = langText.textContent;

    if (currentLang === 'English') {
        langText.textContent = 'العربية';
        // Add English language logic here
    } else {
        langText.textContent = 'English';
        // Add Arabic language logic here
    }
}

// Load saved theme
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme === 'auto' ? (prefersDark ? 'dark' : 'light') : savedTheme;

    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
}

// Initialize theme
loadSavedTheme();

// Test function to debug prayer times display
function testPrayerTimes() {
    console.log('🧪 Testing prayer times display...');

    // Test data
    const testPrayerTimes = {
        Fajr: '05:30',
        Dhuhr: '12:30',
        Asr: '15:45',
        Maghrib: '18:15',
        Isha: '19:45'
    };

    console.log('📅 Test prayer times:', testPrayerTimes);

    // Set test data
    prayerTimes = testPrayerTimes;

    // Try to display
    displayPrayerTimes();

    console.log('✅ Test completed');
}

// Test function to check HTML elements
function checkElements() {
    console.log('🔍 Checking HTML elements...');

    const requiredElements = [
        'prayerTimesGrid',
        'nextPrayerName',
        'prayerDate',
        'fajr',
        'dhuhr',
        'asr',
        'maghrib',
        'isha',
        'qiblaDirection',
        'qiblaDistance',
        'qiblaAngle'
    ];

    const results = {};

    requiredElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            results[id] = {
                found: true,
                tagName: element.tagName,
                className: element.className,
                textContent: element.textContent.substring(0, 50)
            };
        } else {
            results[id] = { found: false };
        }
    });

    console.table(results);
    return results;
}

// Function to fix missing prayer time elements
function fixMissingElements() {
    console.log('🔧 Fixing missing prayer time elements...');

    const prayerIds = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    let fixedCount = 0;

    prayerIds.forEach(id => {
        const element = document.getElementById(id);
        if (!element) {
            console.log(`⚠️ Creating missing element: ${id}`);
            const createdElement = createPrayerTimeElement(id);
            if (createdElement) {
                fixedCount++;
                console.log(`✅ Successfully created: ${id}`);
            }
        }
    });

    console.log(`🔧 Fixed ${fixedCount} missing elements`);
    return fixedCount;
}

// Function to restore prayer times grid to original state
function restorePrayerTimesGrid() {
    console.log('🔄 Restoring prayer times grid...');

    const grid = document.getElementById('prayerTimesGrid');
    if (!grid) {
        console.error('Prayer times grid not found');
        return false;
    }

    // Clear existing content
    grid.innerHTML = '';

    // Recreate all prayer time items
    const prayerItems = [
        { id: 'fajr', name: 'الفجر' },
        { id: 'dhuhr', name: 'الظهر' },
        { id: 'asr', name: 'العصر' },
        { id: 'maghrib', name: 'المغرب' },
        { id: 'isha', name: 'العشاء' }
    ];

    prayerItems.forEach(item => {
        const prayerItem = document.createElement('div');
        prayerItem.className = 'prayer-time-item';

        const prayerName = document.createElement('div');
        prayerName.className = 'prayer-name';
        prayerName.textContent = item.name;

        const prayerTime = document.createElement('div');
        prayerTime.className = 'prayer-time';
        prayerTime.id = item.id;
        prayerTime.textContent = '--:--';

        prayerItem.appendChild(prayerName);
        prayerItem.appendChild(prayerTime);
        grid.appendChild(prayerItem);
    });

    console.log('✅ Prayer times grid restored');
    return true;
}

// Test function to simulate API response
function simulateAPIResponse() {
    console.log('🔄 Simulating API response...');

    // Simulate successful API response
    const mockData = {
        status: 'OK',
        data: {
            timings: {
                Fajr: '05:30',
                Dhuhr: '12:30',
                Asr: '15:45',
                Maghrib: '18:15',
                Isha: '19:45'
            }
        }
    };

    console.log('📡 Mock API response:', mockData);

    // Process the mock data
    if (mockData.status === 'OK' && mockData.data && mockData.data.timings) {
        prayerTimes = mockData.data.timings;
        console.log('✅ Prayer times set from mock data:', prayerTimes);
        displayPrayerTimes();
        calculateNextPrayer();
    } else {
        console.error('❌ Invalid mock data format');
    }
}

// Make test functions available globally
window.testPrayerTimes = testPrayerTimes;
window.checkElements = checkElements;
window.simulateAPIResponse = simulateAPIResponse;
window.fixMissingElements = fixMissingElements;
window.restorePrayerTimesGrid = restorePrayerTimesGrid;

// Update hero stats with prayer times
function updateHeroStats() {
    if (!prayerTimes) return;

    // Update single prayer info card
    updatePrayerInfoCard();

    // Update mobile stats
    updateMobileStats();

    console.log('Hero stats updated, mobile stats should be visible now');
}

// Update single prayer info card
function updatePrayerInfoCard() {
    console.log('updatePrayerInfoCard called with nextPrayer:', nextPrayer);

    if (!nextPrayer) {
        console.log('No nextPrayer data available');
        return;
    }

    const nextPrayerNameElement = document.getElementById('nextPrayerName');
    const heroPrayerCountdownElement = document.getElementById('heroPrayerCountdown');
    const quranQuoteElement = document.querySelector('.quran-quote');

    console.log('Elements found:', {
        nextPrayerNameElement: !!nextPrayerNameElement,
        heroPrayerCountdownElement: !!heroPrayerCountdownElement,
        quranQuoteElement: !!quranQuoteElement
    });

    // Hide Quran quote with animation when prayer info is available
    if (quranQuoteElement && nextPrayer.name && nextPrayer.time) {
        console.log('Hiding Quran quote');
        quranQuoteElement.classList.add('hide');
    }

    if (nextPrayerNameElement) {
        // Find the text span inside the element
        const prayerNameText = nextPrayerNameElement.querySelector('.prayer-name-text');
        const prayerLoader = nextPrayerNameElement.querySelector('.prayer-loader');

        if (prayerNameText) {
            const prayerNames = {
                'الفجر': 'الفجر',
                'الظهر': 'الظهر',
                'العصر': 'العصر',
                'المغرب': 'المغرب',
                'العشاء': 'العشاء',
                'Fajr': 'الفجر',
                'Sunrise': 'الشروق',
                'Dhuhr': 'الظهر',
                'Asr': 'العصر',
                'Maghrib': 'المغرب',
                'Isha': 'العشاء'
            };
            const displayName = prayerNames[nextPrayer.name] || nextPrayer.name;
            console.log('Setting prayer name:', displayName);
            prayerNameText.textContent = displayName;

            // Hide the loader when we have data
            if (prayerLoader) {
                prayerLoader.style.display = 'none';
            }
        }
    }

    if (heroPrayerCountdownElement) {
        // Find the text span inside the element
        const countdownText = heroPrayerCountdownElement.querySelector('.countdown-text');
        const countdownLoader = heroPrayerCountdownElement.querySelector('.countdown-loader');

        if (countdownText) {
            // Show actual prayer time instead of countdown
            if (nextPrayer.time) {
                console.log('Processing prayer time:', nextPrayer.time);
                const [hours, minutes] = nextPrayer.time.split(':');
                const timeString = `${hours}:${minutes}`;
                console.log('Setting time display:', timeString);
                countdownText.textContent = timeString;

                // Hide the loader when we have data
                if (countdownLoader) {
                    countdownLoader.style.display = 'none';
                }
            } else {
                console.log('No prayer time available, showing --:--');
                countdownText.textContent = '--:--';
            }
        }
    }
}

// Update mobile stats with next prayer info
function updateMobileStats() {
    console.log('updateMobileStats called with nextPrayer:', nextPrayer);

    if (!nextPrayer) {
        console.log('No nextPrayer data available for mobile stats');
        return;
    }

    const nextPrayerNameMobile = document.getElementById('nextPrayerNameMobile');
    const nextPrayerTimeMobile = document.getElementById('nextPrayerTimeMobile');
    const prayerCountdownMobile = document.getElementById('prayerCountdownMobile');

    console.log('Mobile elements found:', {
        nextPrayerNameMobile: !!nextPrayerNameMobile,
        nextPrayerTimeMobile: !!nextPrayerTimeMobile,
        prayerCountdownMobile: !!prayerCountdownMobile
    });

    if (nextPrayerNameMobile) {
        const prayerNames = {
            'الفجر': 'الفجر',
            'الظهر': 'الظهر',
            'العصر': 'العصر',
            'المغرب': 'المغرب',
            'العشاء': 'العشاء',
            'Fajr': 'الفجر',
            'Sunrise': 'الشروق',
            'Dhuhr': 'الظهر',
            'Asr': 'العصر',
            'Maghrib': 'المغرب',
            'Isha': 'العشاء'
        };
        const displayName = prayerNames[nextPrayer.name] || nextPrayer.name;
        console.log('Setting mobile prayer name:', displayName);
        nextPrayerNameMobile.textContent = displayName;
    }

    if (nextPrayerTimeMobile) {
        // Show exact time when next prayer will be in 12-hour format
        if (nextPrayer.time) {
            console.log('Setting mobile prayer time:', nextPrayer.time);
            const [hours, minutes] = nextPrayer.time.split(':');
            const hour12 = parseInt(hours) % 12 || 12;
            const ampm = parseInt(hours) >= 12 ? 'م' : 'ص';
            const timeString12 = `${hour12}:${minutes} ${ampm}`;
            nextPrayerTimeMobile.textContent = timeString12;
        } else {
            console.log('No prayer time available for mobile');
            nextPrayerTimeMobile.textContent = '--:--';
        }
    }

    if (prayerCountdownMobile) {
        // Don't override the real-time countdown that's updated every second
        // Only set initial value if it's empty
        if (prayerCountdownMobile.textContent === '--:--:--' && nextPrayer.timeUntil) {
            prayerCountdownMobile.textContent = formatCountdownDigital(nextPrayer.timeUntil);
        }
    }
}

// Format countdown time
function formatCountdown(minutes) {
    if (minutes <= 0) return 'الآن';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}س ${mins.toString().padStart(2, '0')}د`;
    } else {
        return `${mins.toString().padStart(2, '0')}د`;
    }
}

// Format countdown time in digital format (HH:MM:SS)
function formatCountdownDigital(minutes) {
    if (minutes <= 0) return '00:00:00';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const secs = 0; // Seconds will be updated by the countdown timer

    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
}

// Update prayer date (Gregorian date)
function updatePrayerDate() {
    try {
        const today = new Date();
        const dateOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };

        // Format in Arabic locale
        const arabicDate = new Intl.DateTimeFormat('ar-SA', dateOptions).format(today);

        const prayerDateElement = document.getElementById('prayerDate');
        if (prayerDateElement) {
            prayerDateElement.textContent = arabicDate;
            console.log('✅ Prayer date updated to:', arabicDate);
        } else {
            console.warn('⚠️ Prayer date element not found');
        }
    } catch (error) {
        console.error('Error updating prayer date:', error);
        // Show fallback date
        const prayerDateElement = document.getElementById('prayerDate');
        if (prayerDateElement) {
            prayerDateElement.textContent = new Date().toLocaleDateString('ar-SA');
        }
    }
}

// ====== Traditional Cities for Prayer Times ======

// Traditional cities for prayer times
const TRADITIONAL_CITIES = [
    { name: 'مكة المكرمة', city: 'Mecca', country: 'Saudi Arabia', lat: 21.4225, lng: 39.8262, method: 4 },
    { name: 'المدينة المنورة', city: 'Medina', country: 'Saudi Arabia', lat: 24.5247, lng: 39.5692, method: 4 },
    { name: 'القاهرة', city: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357, method: 5 },
    { name: 'الرياض', city: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lng: 46.6753, method: 4 },
    { name: 'جدة', city: 'Jeddah', country: 'Saudi Arabia', lat: 21.4858, lng: 39.1925, method: 4 },
    { name: 'الإسكندرية', city: 'Alexandria', country: 'Egypt', lat: 31.2001, lng: 29.9187, method: 5 },
    { name: 'أبو ظبي', city: 'Abu Dhabi', country: 'UAE', lat: 24.4539, lng: 54.3773, method: 4 },
    { name: 'دبي', city: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708, method: 4 },
    { name: 'عمّان', city: 'Amman', country: 'Jordan', lat: 31.9454, lng: 35.9284, method: 4 },
    { name: 'بيروت', city: 'Beirut', country: 'Lebanon', lat: 33.8935, lng: 35.5018, method: 4 },
    { name: 'دمشق', city: 'Damascus', country: 'Syria', lat: 33.5138, lng: 36.2765, method: 4 },
    { name: 'بغداد', city: 'Baghdad', country: 'Iraq', lat: 33.3152, lng: 44.3661, method: 4 },
    { name: 'طهران', city: 'Tehran', country: 'Iran', lat: 35.6892, lng: 51.3890, method: 4 },
    { name: 'إسطنبول', city: 'Istanbul', country: 'Turkey', lat: 41.0082, lng: 28.9784, method: 13 },
    { name: 'كراتشي', city: 'Karachi', country: 'Pakistan', lat: 24.8607, lng: 67.0011, method: 4 },
    { name: 'نيودلهي', city: 'New Delhi', country: 'India', lat: 28.6139, lng: 77.2090, method: 4 },
    { name: 'جاكرتا', city: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456, method: 8 },
    { name: 'كوالالمبور', city: 'Kuala Lumpur', country: 'Malaysia', lat: 3.1390, lng: 101.6869, method: 8 },
    { name: 'مانيلا', city: 'Manila', country: 'Philippines', lat: 14.5995, lng: 120.9842, method: 8 }
];

// Current selected city (default to Cairo as requested)
let currentCityIndex = 2; // Cairo is at index 2

// Function to change city
async function changeCity() {
    currentCityIndex = (currentCityIndex + 1) % TRADITIONAL_CITIES.length;
    const selectedCity = TRADITIONAL_CITIES[currentCityIndex];

    console.log('Changed to city:', selectedCity.name);

    // Update city display
    updateCityDisplay();

    // Save selection to localStorage
    localStorage.setItem('selectedCityIndex', currentCityIndex);

    // Show notification
    if (typeof showEnhancedNotification === 'function') {
        showEnhancedNotification(`تم التبديل إلى ${selectedCity.name}`, 'success');
    }

    // Clear current prayer times
    clearPrayerTimes();

    // Get new prayer times for the selected city
    try {
        await getPrayerTimesFromAPI();

        // Update the display with new times
        if (prayerTimes && Object.keys(prayerTimes).length > 0) {
            displayPrayerTimesEnhanced();
            startTableCountdown();
        }
    } catch (error) {
        console.error('Error getting prayer times for new city:', error);
        if (typeof showEnhancedNotification === 'function') {
            showEnhancedNotification('حدث خطأ في جلب مواقيت الصلاة', 'error');
        }
    }
}

// Function to update city display
function updateCityDisplay() {
    const selectedCity = TRADITIONAL_CITIES[currentCityIndex];

    // Update city name in UI if element exists
    const cityNameElement = document.getElementById('cityName');
    if (cityNameElement) {
        cityNameElement.textContent = selectedCity.name;
    }

    // Update city display text
    const cityDisplayElement = document.getElementById('currentCityName');
    if (cityDisplayElement) {
        cityDisplayElement.textContent = selectedCity.name;
    }

    // Update prayer date with city info
    const prayerDateElement = document.getElementById('prayerDate');
    if (prayerDateElement) {
        const today = new Date();
        const dateStr = today.toLocaleDateString('ar-SA');
        prayerDateElement.innerHTML = `
            <span class="city-info">${selectedCity.name}</span><br>
            <small>${dateStr}</small>
        `;
    }
}

// Function to clear prayer times display
function clearPrayerTimes() {
    // Clear prayer times in the grid
    const prayerTimeElements = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    prayerTimeElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = '--:--';
        }
    });

    // Clear prayer date
    const prayerDateElement = document.getElementById('prayerDate');
    if (prayerDateElement) {
        prayerDateElement.textContent = '--';
    }

    // Clear countdown
    const countdownElement = document.getElementById('nextPrayerCountdown');
    if (countdownElement) {
        countdownElement.textContent = '';
    }
}

// Function to get user's country and set appropriate city automatically using GPS
async function getUserCountryAndSetCity() {
    try {
        // Show loading state
        const cityNameElement = document.getElementById('currentCityName');
        if (cityNameElement) {
            cityNameElement.textContent = 'جاري التحميل...';
        }

        // Get user's GPS location
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 60000
            });
        });

        const { latitude, longitude } = position.coords;
        console.log('GPS coordinates:', { latitude, longitude });

        // Use reverse geocoding to get country and city
        let country = null;
        let city = null;

        try {
            console.log('Trying bigdatacloud API...');
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ar`);
            console.log('Bigdatacloud response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Reverse geocoding response:', data);
                console.log('🔍 Full API response keys:', Object.keys(data));

                country = data.countryName;
                city = data.city;

                console.log('Extracted country:', country);
                console.log('Extracted city:', city);
                console.log('🔍 Country type:', typeof country, 'Value:', country);

                if (!country) {
                    console.log('No country found in response, trying alternative...');
                }
            } else {
                console.log('Bigdatacloud API failed with status:', response.status);
            }
        } catch (error) {
            console.log('Reverse geocoding failed with error:', error);
        }

        // If first API failed or no country, try OpenStreetMap Nominatim
        if (!country) {
            try {
                console.log('Trying Nominatim API...');
                const response2 = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`);
                console.log('Nominatim response status:', response2.status);

                if (response2.ok) {
                    const data = await response2.json();
                    console.log('Nominatim response:', data);
                    console.log('🔍 Nominatim response keys:', Object.keys(data));
                    console.log('🔍 Nominatim address keys:', data.address ? Object.keys(data.address) : 'No address');

                    country = data.address?.country;
                    city = data.address?.city || data.address?.town || data.address?.village;

                    console.log('Nominatim extracted country:', country);
                    console.log('Nominatim extracted city:', city);
                    console.log('🔍 Nominatim country type:', typeof country, 'Value:', country);
                } else {
                    console.log('Nominatim API failed with status:', response2.status);
                }
            } catch (error2) {
                console.log('Nominatim also failed with error:', error2);
            }
        }

        // If still no country, try a third API (using IP-based geolocation as fallback)
        if (!country) {
            try {
                console.log('Trying third API (ipapi.co IP-based)...');
                const response3 = await fetch(`https://ipapi.co/json/`);
                console.log('Third API response status:', response3.status);

                if (response3.ok) {
                    const data = await response3.json();
                    console.log('Third API response:', data);
                    console.log('🔍 Third API response keys:', Object.keys(data));

                    country = data.country_name;
                    city = data.city;

                    console.log('Third API extracted country:', country);
                    console.log('Third API extracted city:', city);
                    console.log('🔍 Third API country type:', typeof country, 'Value:', country);
                } else {
                    console.log('Third API failed with status:', response3.status);
                }
            } catch (error3) {
                console.log('Third API also failed with error:', error3);
            }
        }

        if (country) {
            console.log('✅ SUCCESS: User location by GPS:', { country, city, lat: latitude, lng: longitude });
            console.log('🔍 Country value analysis:');
            console.log('  - Raw value:', country);
            console.log('  - Type:', typeof country);
            console.log('  - Length:', country.length);
            console.log('  - Trimmed:', country.trim());
            console.log('  - Lowercase:', country.toLowerCase());
            console.log('  - Without quotes:', country.replace(/['"]/g, ''));

            // Find capital city of user's country
            let bestMatch = null;

            // First, try to find exact country match
            console.log('🔍 Looking for country:', country);
            console.log('📋 Available countries in list:', TRADITIONAL_CITIES.map(c => c.country));
            console.log('🔍 Country comparison details:');
            TRADITIONAL_CITIES.forEach((cityData, index) => {
                console.log(`  ${cityData.country} === ${country} = ${cityData.country === country}`);
            });

            TRADITIONAL_CITIES.forEach((cityData, index) => {
                console.log(`🔍 Checking city ${cityData.name} with country ${cityData.country} against ${country}`);
                console.log(`  - List country: "${cityData.country}" (type: ${typeof cityData.country}, length: ${cityData.country.length})`);
                console.log(`  - API country: "${country}" (type: ${typeof country}, length: ${country.length})`);

                // Try exact match first
                if (cityData.country === country) {
                    console.log(`✅ Exact match found! City: ${cityData.name}, Index: ${index}`);
                    // Prefer capital cities (usually first in list for each country)
                    if (!bestMatch || index < bestMatch.index) {
                        bestMatch = { index, cityData };
                        console.log(`🔄 Updated bestMatch to: ${cityData.name} at index ${index}`);
                    }
                }
                // Try partial match (in case of slight differences)
                else if (cityData.country.toLowerCase().includes(country.toLowerCase()) ||
                    country.toLowerCase().includes(cityData.country.toLowerCase())) {
                    console.log(`✅ Partial match found! City: ${cityData.name}, Index: ${index}`);
                    if (!bestMatch || index < bestMatch.index) {
                        bestMatch = { index, cityData };
                        console.log(`🔄 Updated bestMatch to: ${cityData.name} at index ${index}`);
                    }
                }
                // Try normalized comparison (remove extra spaces, quotes, etc.)
                else if (cityData.country.toLowerCase().trim().replace(/['"]/g, '') ===
                    country.toLowerCase().trim().replace(/['"]/g, '')) {
                    console.log(`✅ Normalized match found! City: ${cityData.name}, Index: ${index}`);
                    if (!bestMatch || index < bestMatch.index) {
                        bestMatch = { index, cityData };
                        console.log(`🔄 Updated bestMatch to: ${cityData.name} at index ${index}`);
                    }
                }

                // Log comparison details for debugging
                console.log(`  - Exact match: ${cityData.country === country}`);
                console.log(`  - Partial match: ${cityData.country.toLowerCase().includes(country.toLowerCase()) || country.toLowerCase().includes(cityData.country.toLowerCase())}`);
                console.log(`  - Normalized match: ${cityData.country.toLowerCase().trim().replace(/['"]/g, '') === country.toLowerCase().trim().replace(/['"]/g, '')}`);
            });

            // If no exact country match, find closest city by distance (if we have coordinates)
            if (!bestMatch && latitude && longitude) {
                console.log('🌍 No exact country match, finding closest city by distance...');
                let bestScore = 0;
                TRADITIONAL_CITIES.forEach((cityData, index) => {
                    const distance = calculateDistance(latitude, longitude, cityData.lat, cityData.lng);
                    const score = 1 / (1 + distance); // Higher score for closer cities
                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = { index, cityData };
                        console.log(`🌍 Closest city found: ${cityData.name} at distance ${distance.toFixed(2)}km`);
                    }
                });
            }

            if (bestMatch) {
                currentCityIndex = bestMatch.index;
                console.log('🎯 SUCCESS: Auto-selected city:', bestMatch.cityData.name, 'for country:', country);
                console.log('📍 City index set to:', currentCityIndex);

                // Update display
                updateCityDisplay();

                // Save selection
                localStorage.setItem('selectedCityIndex', currentCityIndex);

                // Clear current prayer times and get new ones
                clearPrayerTimes();
                await getPrayerTimesFromAPI();

                // Update the display with new times
                if (prayerTimes && Object.keys(prayerTimes).length > 0) {
                    displayPrayerTimesEnhanced();
                    startTableCountdown();
                }

                // Show success notification
                if (typeof showEnhancedNotification === 'function') {
                    showEnhancedNotification(`تم تحديد ${bestMatch.cityData.name} (${country}) تلقائياً`, 'success');
                }
            } else {
                console.log('❌ ERROR: No matching city found for country:', country);
                console.log('📋 Available cities:', TRADITIONAL_CITIES.map(c => `${c.name} (${c.country})`));
                throw new Error('No matching city found');
            }

        } else {
            console.log('❌ ERROR: Could not get country from any API');
            console.log('🔍 Final check - country:', country, 'city:', city);
            throw new Error('Could not get location from GPS');
        }

    } catch (error) {
        console.error('Error getting user location by GPS:', error);

        // Fallback to default city (Cairo)
        currentCityIndex = 2;

        updateCityDisplay();

        if (typeof showEnhancedNotification === 'function') {
            showEnhancedNotification('تعذر تحديد الموقع', 'warning');
        }
    }
}

// Function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Function to load saved city selection
function loadSavedCity() {
    const savedCityIndex = localStorage.getItem('selectedCityIndex');
    if (savedCityIndex !== null) {
        currentCityIndex = parseInt(savedCityIndex);
        if (currentCityIndex >= 0 && currentCityIndex < TRADITIONAL_CITIES.length) {
            console.log('Loaded saved city:', TRADITIONAL_CITIES[currentCityIndex].name);
            updateCityDisplay();
        }
    }
}

// ====== API-Based Prayer Times (No Location Required) ======

// Get prayer times from coordinates-based APIs
async function getPrayerTimesFromAPI() {
    try {
        console.log('Getting prayer times from coordinates-based APIs...');

        // Get selected city coordinates
        const selectedCity = TRADITIONAL_CITIES[currentCityIndex];
        console.log('Selected city for prayer times:', selectedCity.name, 'at coordinates:', selectedCity.lat, selectedCity.lng);

        // Try multiple API endpoints for better reliability
        let response = null;
        let data = null;

        // Try first API: aladhan.com with coordinates
        try {
            const today = new Date();
            const timestamp = Math.floor(today.getTime() / 1000);
            const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${selectedCity.lat}&longitude=${selectedCity.lng}&method=${selectedCity.method}`;
            console.log('Trying aladhan.com API with coordinates:', url);

            response = await fetch(url);
            if (response.ok) {
                const altData = await response.json();
                if (altData.status === 'OK' && altData.data && altData.data.timings) {
                    data = {
                        prayer_times: altData.data.timings,
                        date: {
                            date_en: new Date().toLocaleDateString('en-US'),
                            date_hijri: {
                                day: new Date().getDate(),
                                month: { ar: 'رمضان' },
                                year: 1445,
                                weekday: { ar: 'الأحد' }
                            }
                        }
                    };
                    console.log('✅ aladhan.com API success for', selectedCity.name, ':', data);
                }
            }
        } catch (error1) {
            console.log('❌ aladhan.com API failed:', error1);
        }

        // If first API failed, try second: prayertimes.org with coordinates
        if (!data || !data.prayer_times) {
            try {
                const today = new Date();
                const day = today.getDate();
                const month = today.getMonth() + 1;
                const year = today.getFullYear();

                const url = `https://www.prayertimes.org/api/times/${year}/${month}/${day}?latitude=${selectedCity.lat}&longitude=${selectedCity.lng}&timezone=3`;
                console.log('Trying prayertimes.org API with coordinates:', url);

                response = await fetch(url);
                if (response.ok) {
                    const altData = await response.json();
                    if (altData.times && altData.times.fajr) {
                        data = {
                            prayer_times: {
                                Fajr: altData.times.fajr,
                                Sunrise: altData.times.sunrise,
                                Dhuhr: altData.times.dhuhr,
                                Asr: altData.times.asr,
                                Maghrib: altData.times.maghrib,
                                Isha: altData.times.isha
                            },
                            date: {
                                date_en: new Date().toLocaleDateString('en-US'),
                                date_hijri: {
                                    day: new Date().getDate(),
                                    month: { ar: 'رمضان' },
                                    year: 1445,
                                    weekday: { ar: 'الأحد' }
                                }
                            }
                        };
                        console.log('✅ prayertimes.org API success for', selectedCity.name, ':', data);
                    }
                }
            } catch (error2) {
                console.log('❌ prayertimes.org API failed:', error2);
            }
        }

        // If second API failed, try third: muslimsalat.com with coordinates
        if (!data || !data.prayer_times) {
            try {
                const url = `https://muslimsalat.com/${selectedCity.lat}/${selectedCity.lng}/daily.json?key=free`;
                console.log('Trying muslimsalat.com API with coordinates:', url);

                response = await fetch(url);
                if (response.ok) {
                    const altData = await response.json();
                    if (altData.items && altData.items[0]) {
                        const today = altData.items[0];
                        data = {
                            prayer_times: {
                                Fajr: today.fajr,
                                Sunrise: today.shurooq,
                                Dhuhr: today.dhuhr,
                                Asr: today.asr,
                                Maghrib: today.maghrib,
                                Isha: today.isha
                            },
                            date: {
                                date_en: new Date().toLocaleDateString('en-US'),
                                date_hijri: {
                                    day: new Date().getDate(),
                                    month: { ar: 'رمضان' },
                                    year: 1445,
                                    weekday: { ar: 'الأحد' }
                                }
                            }
                        };
                        console.log('✅ muslimsalat.com API success for', selectedCity.name, ':', data);
                    }
                }
            } catch (error3) {
                console.log('❌ muslimsalat.com API failed:', error3);
            }
        }

        // If third API failed, try fourth: alquran.vip with coordinates
        if (!data || !data.prayer_times) {
            try {
                const url = `https://alquran.vip/APIs/getPrayerTimes?latitude=${selectedCity.lat}&longitude=${selectedCity.lng}`;
                console.log('Trying alquran.vip API with coordinates:', url);

                response = await fetch(url);
                if (response.ok) {
                    const altData = await response.json();
                    if (altData.prayer_times) {
                        data = altData;
                        console.log('✅ alquran.vip API success for', selectedCity.name, ':', data);
                    }
                }
            } catch (error4) {
                console.log('❌ alquran.vip API failed:', error4);
            }
        }

        // If fourth API failed, try fifth alternative (muslimsalat.com)
        if (!data || !data.prayer_times) {
            try {
                response = await fetch('https://muslimsalat.com/mecca.json?key=free');
                if (response.ok) {
                    const altData = await response.json();
                    if (altData.items && altData.items[0]) {
                        const today = altData.items[0];
                        data = {
                            prayer_times: {
                                Fajr: today.fajr,
                                Sunrise: today.shurooq,
                                Dhuhr: today.dhuhr,
                                Asr: today.asr,
                                Maghrib: today.maghrib,
                                Isha: today.isha
                            },
                            date: {
                                date_en: new Date().toLocaleDateString('en-US'),
                                date_hijri: {
                                    day: new Date().getDate(),
                                    month: { ar: 'رمضان' },
                                    year: 1445,
                                    weekday: { ar: 'الأحد' }
                                }
                            }
                        };
                        console.log('Fifth API response:', data);
                    }
                }
            } catch (error5) {
                console.log('Fifth API also failed');
            }
        }

        // If fifth API failed, try sixth alternative (prayertimes.org.uk)
        if (!data || !data.prayer_times) {
            try {
                const today = new Date();
                const day = today.getDate();
                const month = today.getMonth() + 1;
                const year = today.getFullYear();

                response = await fetch(`https://www.prayertimes.org.uk/api/times/${year}/${month}/${day}?latitude=21.4225&longitude=39.8262&timezone=3`);
                if (response.ok) {
                    const altData = await response.json();
                    if (altData.times && altData.times.fajr) {
                        data = {
                            prayer_times: {
                                Fajr: altData.times.fajr,
                                Sunrise: altData.times.sunrise,
                                Dhuhr: altData.times.dhuhr,
                                Asr: altData.times.asr,
                                Maghrib: altData.times.maghrib,
                                Isha: altData.times.isha
                            },
                            date: {
                                date_en: new Date().toLocaleDateString('en-US'),
                                date_hijri: {
                                    day: new Date().getDate(),
                                    month: { ar: 'رمضان' },
                                    year: 1445,
                                    weekday: { ar: 'الأحد' }
                                }
                            }
                        };
                        console.log('Sixth API response:', data);
                    }
                }
            } catch (error6) {
                console.log('Sixth API also failed');
            }
        }

        // If sixth API failed, try seventh alternative (prayertimes.org.au)
        if (!data || !data.prayer_times) {
            try {
                const today = new Date();
                const day = today.getDate();
                const month = today.getMonth() + 1;
                const year = today.getFullYear();

                response = await fetch(`https://www.prayertimes.org.au/api/times/${year}/${month}/${day}?latitude=21.4225&longitude=39.8262&timezone=3`);
                if (response.ok) {
                    const altData = await response.json();
                    if (altData.times && altData.times.fajr) {
                        data = {
                            prayer_times: {
                                Fajr: altData.times.fajr,
                                Sunrise: altData.times.sunrise,
                                Dhuhr: altData.times.dhuhr,
                                Asr: altData.times.asr,
                                Maghrib: altData.times.maghrib,
                                Isha: altData.times.isha
                            },
                            date: {
                                date_en: new Date().toLocaleDateString('en-US'),
                                date_hijri: {
                                    day: new Date().getDate(),
                                    month: { ar: 'رمضان' },
                                    year: 1445,
                                    weekday: { ar: 'الأحد' }
                                }
                            }
                        };
                        console.log('Seventh API response:', data);
                    }
                }
            } catch (error7) {
                console.log('Seventh API also failed');
            }
        }

        // If still no data, use fallback prayer times
        if (!data || !data.prayer_times) {
            console.warn('Using fallback prayer times');
            data = {
                prayer_times: {
                    Fajr: '05:30',
                    Sunrise: '06:45',
                    Dhuhr: '12:30',
                    Asr: '15:45',
                    Maghrib: '18:15',
                    Isha: '19:45'
                },
                date: {
                    date_en: new Date().toLocaleDateString('en-US'),
                    date_hijri: {
                        day: new Date().getDate(),
                        month: { ar: 'رمضان' },
                        year: 1445,
                        weekday: { ar: 'الأحد' }
                    }
                }
            };
            console.log('Fallback prayer times set:', data);
        }

        if (data.prayer_times && data.date) {
            // Extract prayer times
            const times = data.prayer_times;
            const dateInfo = data.date;

            // Convert to our format
            prayerTimes = {
                Fajr: times.Fajr,
                Sunrise: times.Sunrise,
                Dhuhr: times.Dhuhr,
                Asr: times.Asr,
                Maghrib: times.Maghrib,
                Isha: times.Isha
            };

            // Update prayer times display
            displayPrayerTimes();

            // Calculate next prayer
            calculateNextPrayer();

            // Start countdown
            startCountdown();

            // Update hero stats
            updateHeroStats();

            // Update date display
            updatePrayerDateFromAPI(dateInfo);





            return true;
        } else {
            throw new Error('Invalid API response format');
        }

    } catch (error) {
        console.error('Error getting prayer times from API:', error);

        return false;
    }
}

// Update prayer date from API response
function updatePrayerDateFromAPI(dateInfo) {
    try {
        // Update Gregorian date
        const gregorianDate = document.getElementById('gregorianDate');
        if (gregorianDate && dateInfo.date_en) {
            gregorianDate.textContent = dateInfo.date_en;
        }

        // Update Hijri date
        if (dateInfo.date_hijri) {
            const hijriDate = document.getElementById('hijriDate');
            if (hijriDate) {
                const hijri = dateInfo.date_hijri;
                hijriDate.innerHTML = `
                    <span class="hijri-day">${hijri.day}</span>
                    <span class="hijri-month">${hijri.month.ar}</span>
                    <span class="hijri-year">${hijri.year} هـ</span>
                `;
            }

            // Update weekday
            const weekdayElement = document.getElementById('weekday');
            if (weekdayElement && dateInfo.date_hijri.weekday) {
                weekdayElement.textContent = dateInfo.date_hijri.weekday.ar;
            }
        }

        // Update timezone info
        const timezoneElement = document.getElementById('timezone');
        if (timezoneElement && dateInfo.meta && dateInfo.meta.timezone) {
            timezoneElement.textContent = dateInfo.meta.timezone;
        }

    } catch (error) {
        console.error('Error updating prayer date from API:', error);
    }
}

// Enhanced prayer times initialization that tries API first
async function initializePrayerTimesSmart() {
    try {
        console.log('Initializing prayer times with smart approach...');

        // First, try to get prayer times from API (no location needed)
        const apiSuccess = await getPrayerTimesFromAPI();

        if (apiSuccess) {
            console.log('Prayer times loaded successfully from API');
            return true;
        }

        // If API fails, fall back to location-based approach
        console.log('API failed, falling back to location-based prayer times...');

        if (currentLocation) {
            await loadPrayerTimes();
            return true;
        } else {
            // Try to get location from IP first
            const ipLocation = await getLocationFromIP();
            if (ipLocation) {
                currentLocation = {
                    lat: ipLocation.lat,
                    lng: ipLocation.lng,
                    source: 'ip'
                };
                await loadPrayerTimes();
                return true;
            }
        }

        return false;

    } catch (error) {
        console.error('Error in smart prayer times initialization:', error);
        return false;
    }
}

// Enhanced refresh function that tries API first
async function refreshPrayerTimesSmart() {
    try {
        console.log('Refreshing prayer times with smart approach...');



        // Try API first
        const apiSuccess = await getPrayerTimesFromAPI();

        if (apiSuccess) {
            return true;
        }


        return await refreshPrayerTimes();

    } catch (error) {
        console.error('Error in smart prayer times refresh:', error);
        return false;
    }
}

// Close mode selection popup
function closeModePopup() {
    const popup = document.getElementById('modeSelectionPopup');
    if (popup) {
        popup.style.display = 'none';
    }
}

// Show mode selection popup
function showModePopup() {
    const popup = document.getElementById('modeSelectionPopup');
    if (popup) {
        popup.style.display = 'flex';
    }
}

// Toggle sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        if (sidebar.style.display === 'none' || sidebar.style.display === '') {
            // Show sidebar with animation
            sidebar.style.display = 'block';
            // Force reflow to ensure display change takes effect
            sidebar.offsetHeight;
            sidebar.classList.add('show');
        } else {
            // Hide sidebar with animation
            sidebar.classList.remove('show');
            sidebar.style.animation = 'slideOutRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            setTimeout(() => {
                sidebar.style.display = 'none';
                sidebar.style.animation = '';
            }, 400);
        }
    }
}



// Auto-refresh prayer times every hour if using API
function startAutoRefresh() {
    // Refresh every hour (3600000 ms)
    setInterval(async () => {
        console.log('Auto-refreshing prayer times...');
        await refreshPrayerTimesSmart();
    }, 3600000);
}

// ====== Enhanced Prayer Times Table Functions ======

// Update prayer status for table rows
function updatePrayerStatusForTable() {
    const now = new Date();
    const currentTime = now.getTime();

    const prayers = [
        { key: 'Fajr', element: 'fajrStatus', countdown: 'fajrCountdown' },
        { key: 'Sunrise', element: 'sunriseStatus', countdown: 'sunriseCountdown' },
        { key: 'Dhuhr', element: 'dhuhrStatus', countdown: 'dhuhrCountdown' },
        { key: 'Asr', element: 'asrStatus', countdown: 'asrCountdown' },
        { key: 'Maghrib', element: 'maghribStatus', countdown: 'maghribCountdown' },
        { key: 'Isha', element: 'ishaStatus', countdown: 'ishaCountdown' }
    ];

    prayers.forEach(prayer => {
        const statusElement = document.getElementById(prayer.element);
        const countdownElement = document.getElementById(prayer.countdown);

        if (statusElement && prayerTimes[prayer.key]) {
            const prayerTime = new Date();
            const [hours, minutes] = prayerTimes[prayer.key].split(':');
            prayerTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const timeDiff = prayerTime.getTime() - currentTime;
            const minutesDiff = Math.floor(timeDiff / (1000 * 60));

            // Update status
            if (timeDiff < 0) {
                // Prayer time has passed
                statusElement.textContent = 'مضت';
                statusElement.className = 'prayer-status past';
                if (countdownElement) countdownElement.textContent = '--:--';
            } else if (timeDiff < 300000) { // Less than 5 minutes
                // Prayer time is now
                statusElement.textContent = 'الآن';
                statusElement.className = 'prayer-status current';
                if (countdownElement) countdownElement.textContent = 'الآن';
            } else {
                // Prayer time is upcoming
                statusElement.textContent = 'قادمة';
                statusElement.className = 'prayer-status upcoming';

                // Update countdown
                if (countdownElement) {
                    const hours = Math.floor(minutesDiff / 60);
                    const mins = minutesDiff % 60;
                    countdownElement.textContent = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
                }
            }
        }
    });
}

// Set prayer reminder
function setPrayerReminder(prayerType) {
    const prayerNames = {
        'fajr': 'الفجر',
        'sunrise': 'الشروق',
        'dhuhr': 'الظهر',
        'asr': 'العصر',
        'maghrib': 'المغرب',
        'isha': 'العشاء'
    };

    const prayerName = prayerNames[prayerType];

    if ('Notification' in window && Notification.permission === 'granted') {
        // Set notification for 5 minutes before prayer
        const prayerTime = prayerTimes[prayerType.charAt(0).toUpperCase() + prayerType.slice(1)];
        if (prayerTime) {
            const [hours, minutes] = prayerTime.split(':');
            const prayerDate = new Date();
            prayerDate.setHours(parseInt(hours), parseInt(minutes) - 5, 0, 0);

            const timeUntilReminder = prayerDate.getTime() - Date.now();

            if (timeUntilReminder > 0) {
                setTimeout(() => {
                    new Notification('تذكير بالصلاة', {
                        body: `حان وقت صلاة ${prayerName} بعد 5 دقائق`,
                        icon: '/media/images/prayer-icon.svg'
                    });
                }, timeUntilReminder);

                showNotification(`تم تعيين تذكير لصلاة ${prayerName}`, 'success');
            } else {
                showNotification('وقت الصلاة قريب جداً', 'warning');
            }
        }
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                setPrayerReminder(prayerType);
            }
        });
    } else {
        showNotification('التطبيق لا يدعم الإشعارات', 'info');
    }
}

// ====== Prayer Adhkar Functions ======

// Toggle adhkar section
function toggleAdhkarSection() {
    const adhkarSection = document.getElementById('adhkarSection');
    if (adhkarSection) {
        const isVisible = adhkarSection.style.display !== 'none';
        adhkarSection.style.display = isVisible ? 'none' : 'block';

        const toggleBtn = document.querySelector('.prayer-adhkar-card .header-actions .btn');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.className = isVisible ? 'bi bi-chevron-down' : 'bi bi-chevron-up';
            }
        }
    }
}

// ====== Enhanced Tasbih System ======

// Variables already defined at top of file

// Show custom dhikr modal
function showCustomDhikrModal() {
    const modal = new bootstrap.Modal(document.getElementById('customDhikrModal'));
    modal.show();
}

// Add custom dhikr
function addCustomDhikr() {
    const text = document.getElementById('customDhikrText').value.trim();
    const count = parseInt(document.getElementById('customDhikrCount').value);

    if (!text || !count || count < 1) {
        showEnhancedNotification('يرجى إدخال نص الذكر وعدد صحيح', 'warning');
        return;
    }

    // Add to custom dhikrs list
    customDhikrs.push({ text, count });

    // Set as current dhikr
    setCustomDhikr(text, count);

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('customDhikrModal'));
    modal.hide();

    // Clear inputs
    document.getElementById('customDhikrText').value = '';
    document.getElementById('customDhikrCount').value = '';

    showEnhancedNotification(`تم إضافة الذكر: ${text} (${count} مرة)`, 'success');
}

// Set custom dhikr
function setCustomDhikr(text, count) {
    currentDhikr = { text, count };
    targetCount = count;
    tasbihCount = 0;

    updateTasbihDisplay();
    updateCurrentDhikrDisplay();

    // Save to localStorage
    saveTasbihState();
}

// Enhanced increment function
function incrementTasbih() {
    tasbihCount++;

    // Check if target reached
    if (currentDhikr && tasbihCount >= targetCount) {
        showCompletionCelebration();
    }

    // Play increment sound
    playIncrementSound();

    updateTasbihDisplay();
    updateCurrentDhikrDisplay(); // إضافة هذا السطر لتحديث عرض الذكر
    saveTasbihState();

    // Haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// Enhanced decrement function
function decrementTasbih() {
    if (tasbihCount > 0) {
        tasbihCount--;
        updateTasbihDisplay();
        updateCurrentDhikrDisplay(); // إضافة هذا السطر لتحديث عرض الذكر
        saveTasbihState();

        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }
    }
}

// Enhanced reset function
function resetTasbih() {
    tasbihCount = 0;
    currentDhikr = null;
    targetCount = 0;

    // Remove all progress rings
    hideTasbihProgress();

    updateTasbihDisplay();
    updateCurrentDhikrDisplay();
    saveTasbihState();

    showEnhancedNotification('تم إعادة تعيين العداد', 'info');

    // Haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate(200);
    }
}

// Enhanced preset function
function setTasbihPreset(count, text) {
    tasbihCount = 0;
    currentDhikr = { text, count };
    targetCount = count;

    // Remove all existing progress rings
    hideTasbihProgress();

    updateTasbihDisplay();
    updateCurrentDhikrDisplay();
    saveTasbihState();

    showEnhancedNotification(`تم تعيين: ${text} (${count} مرة)`, 'success');

    // Haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate(100);
    }
}

// Update tasbih display
function updateTasbihDisplay() {
    const counter = document.getElementById('tasbihCounter');
    if (!counter) return;

    counter.textContent = tasbihCount;

    // Add completion class if target reached
    if (currentDhikr && tasbihCount >= targetCount) {
        counter.classList.add('completed');
    } else {
        counter.classList.remove('completed');
    }

    // Add scale animation
    counter.style.transform = 'scale(1.1)';
    setTimeout(() => {
        counter.style.transform = 'scale(1)';
    }, 150);
}

// Update current dhikr display
function updateCurrentDhikrDisplay() {
    const dhikrElement = document.getElementById('currentDhikr');
    if (!dhikrElement) return;

    if (currentDhikr) {
        dhikrElement.textContent = `${currentDhikr.text} (${tasbihCount}/${targetCount})`;
        dhikrElement.classList.add('active');

        // Update progress bar
        updateTasbihProgress();
    } else {
        dhikrElement.textContent = 'اختر ذكراً للبدء';
        dhikrElement.classList.remove('active');

        // Hide progress bar
        hideTasbihProgress();
    }
}

// Update tasbih progress bar
function updateTasbihProgress() {
    let progressRing = document.querySelector('.tasbih-progress-ring:not(.completed)');

    if (!progressRing) {
        // Create circular progress ring if it doesn't exist
        const counter = document.getElementById('tasbihCounter');
        if (counter) {
            progressRing = document.createElement('div');
            progressRing.className = 'tasbih-progress-ring';
            progressRing.innerHTML = `
                <svg class="progress-ring-svg" viewBox="0 0 120 120">
                    <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
                            <stop offset="50%" style="stop-color:#059669;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#10b981;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    <circle class="progress-ring-circle-bg" cx="60" cy="60" r="54" stroke-width="8"/>
                    <circle class="progress-ring-circle" cx="60" cy="60" r="54" stroke-width="8"/>
                </svg>
                <div class="progress-ring-text">
                    <span class="progress-current">${tasbihCount}</span>
                    <span class="progress-separator">/</span>
                    <span class="progress-target">${targetCount}</span>
                </div>
            `;
            counter.appendChild(progressRing);
        }
    }

    if (progressRing && targetCount > 0) {
        const progress = (tasbihCount / targetCount) * 100;
        const circle = progressRing.querySelector('.progress-ring-circle');
        const currentText = progressRing.querySelector('.progress-current');
        const targetText = progressRing.querySelector('.progress-target');

        if (circle) {
            const radius = 54;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (progress / 100) * circumference;

            circle.style.strokeDasharray = circumference;
            circle.style.strokeDashoffset = offset;
        }

        if (currentText) currentText.textContent = tasbihCount;
        if (targetText) targetText.textContent = targetCount;

        // Check if target reached and create new ring
        if (tasbihCount >= targetCount && !progressRing.classList.contains('completed')) {
            completeProgressRing(progressRing);
            createNewProgressRing();
        }
    }
}

// Complete current progress ring (make it green)
function completeProgressRing(progressRing) {
    progressRing.classList.add('completed');

    // Change the circle color to green
    const circle = progressRing.querySelector('.progress-ring-circle');
    if (circle) {
        circle.style.stroke = '#10b981';
        circle.style.filter = 'drop-shadow(0 0 15px rgba(16, 185, 129, 0.8))';
    }

    // Add completion animation
    progressRing.style.animation = 'ringCompletion 1s ease-out';

    // Show completion text
    const progressText = progressRing.querySelector('.progress-ring-text');
    if (progressText) {
        progressText.innerHTML = `
            <div class="completion-text">
                <i class="bi bi-check-circle-fill"></i>
                <span>مكتمل!</span>
            </div>
        `;
    }
}

// Create new progress ring for next round
function createNewProgressRing() {
    const counter = document.getElementById('tasbihCounter');
    if (!counter) return;

    // Count completed rings to determine color
    const completedRings = document.querySelectorAll('.tasbih-progress-ring.completed');
    const roundNumber = completedRings.length + 1;

    // Different colors for different rounds
    const colors = [
        { primary: '#3b82f6', secondary: '#1d4ed8' }, // Blue for round 2
        { primary: '#8b5cf6', secondary: '#7c3aed' }, // Purple for round 3
        { primary: '#f59e0b', secondary: '#d97706' }, // Orange for round 4
        { primary: '#ef4444', secondary: '#dc2626' }, // Red for round 5
        { primary: '#06b6d4', secondary: '#0891b2' }  // Cyan for round 6+
    ];

    const colorIndex = (roundNumber - 2) % colors.length;
    const colorsForRound = colors[colorIndex];

    // Create new progress ring
    const newProgressRing = document.createElement('div');
    newProgressRing.className = 'tasbih-progress-ring new-ring';
    newProgressRing.innerHTML = `
        <svg class="progress-ring-svg" viewBox="0 0 120 120">
            <defs>
                <linearGradient id="progressGradientNew${roundNumber}" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:${colorsForRound.primary};stop-opacity:1" />
                    <stop offset="50%" style="stop-color:${colorsForRound.secondary};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${colorsForRound.primary};stop-opacity:1" />
                </linearGradient>
            </defs>
            <circle class="progress-ring-circle-bg" cx="60" cy="60" r="54" stroke-width="8"/>
            <circle class="progress-ring-circle" cx="60" cy="60" r="54" stroke-width="8" style="stroke: url(#progressGradientNew${roundNumber})"/>
        </svg>
        <div class="progress-ring-text">
            <span class="progress-current">0</span>
            <span class="progress-separator">/</span>
            <span class="progress-target">${targetCount}</span>
        </div>
    `;

    // Insert new ring after the completed one
    const completedRing = document.querySelector('.tasbih-progress-ring.completed');
    if (completedRing) {
        completedRing.parentNode.insertBefore(newProgressRing, completedRing.nextSibling);
    } else {
        counter.appendChild(newProgressRing);
    }

    // Reset counter for new round
    tasbihCount = 0;
    updateTasbihDisplay();

}

// Hide tasbih progress ring
function hideTasbihProgress() {
    const progressRings = document.querySelectorAll('.tasbih-progress-ring');
    progressRings.forEach(ring => ring.remove());
}

// Show completion celebration
function showCompletionCelebration() {
    // Show celebration notification
    showEnhancedNotification(` تم إكمال الذكر: ${currentDhikr.text}!`, 'success', 5000);

    // Play celebration sound if available
    playCelebrationSound();

    // Show Islamic-themed celebration
    const celebrationContainer = document.createElement('div');
    celebrationContainer.className = 'celebration-container islamic-celebration';
    celebrationContainer.innerHTML = `
        <div class="celebration-text">تم إكمال الذكر</div>
        <div class="celebration-patterns"></div>
        <div class="celebration-geometric"></div>
        <div class="celebration-ornaments"></div>
        <div class="celebration-glow"></div>
        <div class="celebration-dots"></div>
        <div class="celebration-lines"></div>
        <div class="celebration-circles"></div>
        <div class="celebration-squares"></div>
        <div class="celebration-triangles"></div>
    `;

    document.body.appendChild(celebrationContainer);

    // Remove celebration after animation
    setTimeout(() => {
        if (celebrationContainer.parentNode) {
            celebrationContainer.parentNode.removeChild(celebrationContainer);
        }
    }, 4000);

    // Auto-return to adhkar section after completion
    setTimeout(() => {
        returnToAdhkarSection();
    }, 2000); // Wait 2 seconds before returning
}

// Play celebration sound
function playCelebrationSound() {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

// Play increment sound
function playIncrementSound() {
    // Create a soft click sound for increment
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Soft click sound
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

// Save tasbih state to localStorage
function saveTasbihState() {
    const state = {
        count: tasbihCount,
        currentDhikr,
        targetCount,
        customDhikrs
    };
    localStorage.setItem('tasbihState', JSON.stringify(state));
}

// Load tasbih state from localStorage
function loadTasbihState() {
    try {
        const saved = localStorage.getItem('tasbihState');
        if (saved) {
            const state = JSON.parse(saved);
            tasbihCount = state.count || 0;
            currentDhikr = state.currentDhikr || null;
            targetCount = state.targetCount || 0;
            customDhikrs = state.customDhikrs || [];

            updateTasbihDisplay();
            updateCurrentDhikrDisplay();
        }
    } catch (error) {
        console.error('Error loading tasbih state:', error);
    }
}

// Make functions available globally
window.showCustomDhikrModal = showCustomDhikrModal;
window.addCustomDhikr = addCustomDhikr;
window.setTasbihPreset = setTasbihPreset;
window.returnToAdhkarSection = returnToAdhkarSection;
window.playCelebrationSound = playCelebrationSound;
window.showCompletionCelebration = showCompletionCelebration;
window.incrementTasbih = incrementTasbih;
window.decrementTasbih = decrementTasbih;
window.resetTasbih = resetTasbih;

// Function to link adhkar with tasbih
function linkAdhkarWithTasbih(dhikrText, count) {
    // Set the selected dhikr in tasbih
    setCustomDhikr(dhikrText, count);

    // Show success message
    showEnhancedNotification(`تم ربط الذكر: ${dhikrText} مع السبحة`, 'success');

    // Scroll to tasbih section
    const tasbihSection = document.querySelector('.tasbih-card');
    if (tasbihSection) {
        tasbihSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Function to return to adhkar section
function returnToAdhkarSection() {
    // Find the adhkar section
    const adhkarSection = document.querySelector('.adhkar-slider-card');
    if (adhkarSection) {
        // Scroll to adhkar section with smooth animation
        adhkarSection.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });

        // Add highlight animation class
        adhkarSection.classList.add('return-highlight');

        // Remove the class after animation completes
        setTimeout(() => {
            adhkarSection.classList.remove('return-highlight');
        }, 2000);
    }
}

// ====== Enhanced Prayer Times Display ======

// Enhanced function to display prayer times in card format
function displayPrayerTimesEnhanced() {
    if (!prayerTimes || Object.keys(prayerTimes).length === 0) {
        return;
    }

    // Update prayer times in cards
    const prayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    prayers.forEach(prayer => {
        const element = document.getElementById(prayer.toLowerCase());
        if (element && prayerTimes[prayer]) {
            element.textContent = formatTime(prayerTimes[prayer]);
        }
    });

    // Calculate next prayer before starting countdown
    calculateNextPrayer();

    // Update prayer status for cards
    updatePrayerStatus();

    // Update prayer date
    updatePrayerDate();

    // Start countdown for cards
    startCountdown();
}

// Start countdown for card display
function startTableCountdown() {
    if (prayerCountdownInterval) {
        clearInterval(prayerCountdownInterval);
    }

    prayerCountdownInterval = setInterval(() => {
        updatePrayerStatus();
        updateCountdown();
    }, 1000);
}

// ====== Initialize Enhanced Features ======

// Initialize enhanced prayer times features
function initializeEnhancedFeatures() {
    // Load tasbih count
    loadTasbihState();

    // Add keyboard shortcuts for tasbih
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            incrementTasbih();
        } else if (e.code === 'Backspace') {
            e.preventDefault();
            decrementTasbih();
        } else if (e.code === 'KeyR') {
            e.preventDefault();
            resetTasbih();
        }
    });
}

// ====== Enhanced Notification System ======

// Basic notification function (fallback)
function showNotification(message, type = 'info') {
    // Use enhanced notification if available
    if (typeof showEnhancedNotification === 'function') {
        showEnhancedNotification(message, type);
        return;
    }

    // Fallback to simple alert
    console.log(`${type.toUpperCase()}: ${message}`);
}

// Enhanced notification function
function showEnhancedNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `enhanced-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="bi ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="bi bi-x"></i>
        </button>
    `;

    document.body.appendChild(notification);

    // Add entrance animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Auto remove after duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, duration);
}

// Get notification icon based on type
function getNotificationIcon(type) {
    const icons = {
        'success': 'bi-check-circle-fill',
        'error': 'bi-exclamation-circle-fill',
        'warning': 'bi-exclamation-triangle-fill',
        'info': 'bi-info-circle-fill'
    };
    return icons[type] || icons.info;
}

// ====== Enhanced Prayer Times Grid Update ======

// Update the existing prayer times grid to work with cards
function updatePrayerTimesGridForTable() {
    const grid = document.getElementById('prayerTimesGrid');
    if (!grid) return;

    // Show the grid since we're using cards now
    grid.style.display = 'grid';
}

// ====== Enhanced Initialization ======

// Enhanced initialization function
async function initializeEnhancedPrayerTimes() {
    // Try to get user's location and set city automatically
    try {
        await getUserCountryAndSetCity();
    } catch (error) {
        console.log('Auto-location failed, using saved city');
        // Load saved city selection as fallback
        loadSavedCity();
    }

    // Initialize basic prayer times
    initializePrayerTimesSmart();

    // Initialize enhanced features
    initializeEnhancedFeatures();

    // Update prayer times grid for card compatibility
    updatePrayerTimesGridForTable();

    // Display prayer times with enhanced function
    if (prayerTimes && Object.keys(prayerTimes).length > 0) {
        displayPrayerTimesEnhanced();
    }

    // Start enhanced countdown
    startTableCountdown();

    // Display timezone information
    displayTimezoneInfo();
}

// ====== Export Enhanced Functions ======

// Make enhanced functions available globally
window.setPrayerReminder = setPrayerReminder;
window.toggleAdhkarSection = toggleAdhkarSection;
window.incrementTasbih = incrementTasbih;
window.decrementTasbih = decrementTasbih;
window.resetTasbih = resetTasbih;
window.setTasbihPreset = setTasbihPreset;
window.setCustomDhikr = setCustomDhikr;
window.updateTasbihDisplay = updateTasbihDisplay;
window.updateCurrentDhikrDisplay = updateCurrentDhikrDisplay;
window.saveTasbihState = saveTasbihState;
window.loadTasbihState = loadTasbihState;
window.showCustomDhikrModal = showCustomDhikrModal;
window.addCustomDhikr = addCustomDhikr;
window.returnToAdhkarSection = returnToAdhkarSection;
window.playIncrementSound = playIncrementSound;
window.playCelebrationSound = playCelebrationSound;
window.showCompletionCelebration = showCompletionCelebration;
window.updateTasbihProgress = updateTasbihProgress;
window.hideTasbihProgress = hideTasbihProgress;
window.createNewProgressRing = createNewProgressRing;
window.completeProgressRing = completeProgressRing;
window.setTasbihPreset = setTasbihPreset;
window.toggleAdhkarSection = toggleAdhkarSection;
window.setPrayerReminder = setPrayerReminder;
window.getNotificationIcon = getNotificationIcon;
window.showNotification = showNotification;
window.updateCityDisplay = updateCityDisplay;
window.loadSavedCity = loadSavedCity;
window.refreshPrayerTimesSmart = refreshPrayerTimesSmart;
window.getUserCountryAndSetCity = getUserCountryAndSetCity;
window.clearPrayerTimes = clearPrayerTimes;
window.displayPrayerTimesEnhanced = displayPrayerTimesEnhanced;
window.initializeEnhancedPrayerTimes = initializeEnhancedPrayerTimes;
window.linkAdhkarWithTasbih = linkAdhkarWithTasbih;
window.showEnhancedNotification = showEnhancedNotification;
window.getNotificationIcon = getNotificationIcon;
window.showNotification = showNotification;
window.updateCityDisplay = updateCityDisplay;
window.loadSavedCity = loadSavedCity;
window.refreshPrayerTimesSmart = refreshPrayerTimesSmart;
window.getUserCountryAndSetCity = getUserCountryAndSetCity;
window.clearPrayerTimes = clearPrayerTimes;
