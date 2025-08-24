// Prayer Times and Qibla Combined JavaScript
// يجمع بين وظائف مواقيت الصلاة واتجاه القبلة

// Global variables
let currentLocation = null;
let prayerTimes = null;
let nextPrayer = null;
let countdownInterval = null;
let qiblaAngle = 0;

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
        'sunrise',
        'dhuhr',
        'asr',
        'maghrib',
        'isha',
        'qiblaDirection',
        'qiblaDistance',
        'qiblaAngle'
    ];

    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements);
        return;
    }

    console.log('All required elements found, proceeding with initialization...');

    // Request location only when needed
    requestLocation();

    // Update prayer date
    updatePrayerDate();

    // Start countdown timer
    startCountdown();
});

// Show location permission popup
function showLocationPermissionPopup() {
    return new Promise((resolve) => {
        // Create popup container
        const popup = document.createElement('div');
        popup.className = 'location-permission-popup';
        popup.innerHTML = `
            <div class="popup-content">
                <div class="popup-header">
                    <h5>طلب إذن الموقع</h5>
                </div>
                <div class="popup-body">
                    <p>نحتاج إلى موقعك لتحديد مواقيت الصلاة واتجاه القبلة بدقة</p>
                    <div class="popup-actions">
                        <button class="btn btn-primary" id="allowLocation">
                            موافق
                        </button>
                        <button class="btn btn-outline-secondary" id="denyLocation">
                            رفض
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add popup to page
        document.body.appendChild(popup);

        // Add event listeners
        document.getElementById('allowLocation').addEventListener('click', () => {
            document.body.removeChild(popup);
            resolve('allow');
        });

        document.getElementById('denyLocation').addEventListener('click', () => {
            document.body.removeChild(popup);
            resolve('deny');
        });

        // Don't auto-close, let user decide
        // User must click one of the buttons to proceed
    });
}

// Request location with enhanced error handling
async function requestLocation() {
    try {
        console.log('Requesting location...');

        // Show location permission popup
        const userChoice = await showLocationPermissionPopup();

        if (userChoice === 'allow') {
            // User allowed location access
            console.log('Getting current position...');
            const position = await getCurrentPosition();
            console.log('Position received:', position);

            currentLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };

            console.log('Current location set to:', currentLocation);
        } else {
            // User denied location access, use Cairo as default
            console.log('User denied location access, using Cairo as default');
            currentLocation = {
                latitude: 30.0444,
                longitude: 31.2357
            };
            console.log('Default location set to Cairo:', currentLocation);
        }

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
                const response2 = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent('Mecca')}&country=${encodeURIComponent('Saudi Arabia')}&method=4`);
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

    // Map different possible prayer time keys
    const prayerMappings = {
        'fajr': ['Fajr', 'fajr', 'الفجر'],
        'sunrise': ['Sunrise', 'sunrise', 'الشروق'],
        'dhuhr': ['Dhuhr', 'dhuhr', 'الظهر'],
        'asr': ['Asr', 'asr', 'العصر'],
        'maghrib': ['Maghrib', 'maghrib', 'المغرب'],
        'isha': ['Isha', 'isha', 'العشاء']
    };

    let updatedCount = 0;

    // Find and display prayer times
    Object.keys(prayerMappings).forEach(prayerId => {
        let element = document.getElementById(prayerId);

        // If element doesn't exist, try to create it
        if (!element) {
            console.warn(`⚠️ Element '${prayerId}' not found, attempting to create it...`);
            element = createPrayerTimeElement(prayerId);
        }

        if (element) {
            // Try to find the prayer time using different possible keys
            let prayerTime = null;
            let usedKey = null;

            for (let key of prayerMappings[prayerId]) {
                if (prayerTimes[key]) {
                    prayerTime = prayerTimes[key];
                    usedKey = key;
                    break;
                }
            }

            if (prayerTime) {
                const formattedTime = formatTime12Hour(prayerTime);
                element.textContent = formattedTime;
                element.style.color = 'white';
                element.style.fontWeight = '600';
                updatedCount++;
                console.log(`✅ Updated ${prayerId} to: ${formattedTime} (from key: ${usedKey})`);
            } else {
                element.textContent = '--:--';
                element.style.color = 'var(--text-muted)';
                element.style.fontWeight = '400';
                console.log(`❌ No time found for ${prayerId}`);
            }
        } else {
            console.error(`❌ Failed to create element with id '${prayerId}'`);
        }
    });

    console.log(`Prayer times display completed. Updated: ${updatedCount}/5 times`);



    // Update prayer status based on current time
    updatePrayerStatus();
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

                const prayerItem = timeElement.closest('.enhanced-prayer-item');
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
    if (!prayerTimes) return;

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
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    countdownInterval = setInterval(updateCountdown, 1000);

    // Initial update of mobile stats
    if (nextPrayer) {
        updateMobileStats();
    }

    // Initial update of prayer status
    updatePrayerStatus();
}

// Update countdown display
function updateCountdown() {
    try {
        if (!nextPrayer || !prayerTimes) return;

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

        // countdownDisplay1 now contains SVG loader, don't update with text

        const heroPrayerCountdown = document.getElementById('heroPrayerCountdown');
        if (heroPrayerCountdown) {
            heroPrayerCountdown.textContent = countdownString;
            console.log('Web countdown 2 updated:', countdownString);
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

        // Show error toast or notification
        showNotification('خطأ في المعايرة', message, 'error');

    } catch (error) {
        console.error('Error showing calibration error:', error);
    }
}

// Show calibration success
function showCalibrationSuccess() {
    try {
        console.log('Calibration success');

        // Show success notification
        showNotification('تمت المعايرة', 'البوصلة جاهزة للاستخدام', 'success');

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

// Show notification
function showNotification(title, message, type = 'info') {
    try {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-header">
                <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info-circle'}"></i>
                <span>${title}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="notification-body">
                ${message}
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

    } catch (error) {
        console.error('Error showing notification:', error);
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

        // Show error notification
        showNotification('خطأ في القبلة', 'تعذر حساب اتجاه القبلة', 'error');

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
    const countdownDisplayElement = document.getElementById('countdownDisplay');
    const quranQuoteElement = document.querySelector('.quran-quote');

    console.log('Elements found:', {
        nextPrayerNameElement: !!nextPrayerNameElement,
        countdownDisplayElement: !!countdownDisplayElement,
        quranQuoteElement: !!quranQuoteElement
    });

    // Hide Quran quote with animation when prayer info is available
    if (quranQuoteElement && nextPrayer.name && nextPrayer.time) {
        console.log('Hiding Quran quote');
        quranQuoteElement.classList.add('hide');
    }

    if (nextPrayerNameElement) {
        const prayerNames = {
            'الفجر': 'الفجر',
            'الظهر': 'الظهر',
            'العصر': 'العصر',
            'المغرب': 'المغرب',
            'العشاء': 'العشاء'
        };
        const displayName = prayerNames[nextPrayer.name] || nextPrayer.name;
        console.log('Setting prayer name:', displayName);
        nextPrayerNameElement.textContent = displayName;
    }

    if (countdownDisplayElement) {
        // Show actual prayer time instead of countdown
        if (nextPrayer.time) {
            console.log('Processing prayer time:', nextPrayer.time);
            const [hours, minutes] = nextPrayer.time.split(':');
            const timeString = `${hours}:${minutes}`;
            console.log('Setting time display:', timeString);
            countdownDisplayElement.textContent = timeString;
        } else {
            console.log('No prayer time available, showing --:--');
            countdownDisplayElement.textContent = '--:--';
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
