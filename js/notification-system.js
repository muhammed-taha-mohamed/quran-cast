// نظام الإشعارات الموحد للتطبيق مع دعم PWA
class NotificationSystem {
    constructor() {
        this.container = null;
        this.isServiceWorkerSupported = 'serviceWorker' in navigator;
        this.isNotificationSupported = 'Notification' in window;
        this.permission = this.isNotificationSupported ? Notification.permission : 'denied';
        this.mediaSession = 'mediaSession' in navigator;
        this.init();
    }

    init() {
        // إنشاء حاوية الإشعارات
        this.container = document.createElement('div');
        this.container.id = 'notificationContainer';
        this.container.className = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 999999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
            pointer-events: none;
            align-items: flex-end;
        `;
        document.body.appendChild(this.container);
        
        // تسجيل Service Worker
        this.registerServiceWorker();
        
        // إعداد Media Session
        this.setupMediaSession();
        
        // إعداد مستمعي الرسائل من Service Worker
        this.setupMessageListeners();
        
        console.log('Notification container created and added to body:', this.container);
    }

    // عرض إشعار
    show(message, type = 'info', duration = 4000, options = {}) {
        console.log('Creating notification:', message, type);
        const notification = document.createElement('div');
        notification.className = `enhanced-notification ${type}`;

        // إعدادات إضافية
        const {
            title = '',
            icon = this.getIcon(type),
            showClose = true,
            autoClose = true,
            onClick = null
        } = options;

        notification.innerHTML = `
            <div class="notification-content" ${onClick ? 'style="cursor: pointer;"' : ''}>
                <i class="bi ${icon}"></i>
                <div class="notification-text">
                    ${title ? `<div class="notification-title">${title}</div>` : ''}
                    <div class="notification-message">${message}</div>
                </div>
                ${showClose ? '<button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>' : ''}
            </div>
        `;

        // إضافة تأثيرات بصرية - سيتم التحكم بها عبر CSS class

        this.container.appendChild(notification);
        console.log('Notification added to container:', this.container);

        // تأثير الدخول من الأعلى
        setTimeout(() => {
            notification.classList.add('show');
            console.log('Notification show class added');
        }, 100);

        // إضافة حدث النقر
        if (onClick) {
            notification.addEventListener('click', onClick);
        }

        // إغلاق تلقائي
        if (autoClose) {
            setTimeout(() => {
                this.hide(notification);
            }, duration);
        }

        return notification;
    }

    // إخفاء إشعار
    hide(notification) {
        if (!notification || !notification.parentNode) return;

        notification.classList.remove('show');

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // الحصول على الأيقونة المناسبة
    getIcon(type) {
        const icons = {
            'success': 'bi-check-circle-fill',
            'error': 'bi-exclamation-circle-fill',
            'warning': 'bi-exclamation-triangle-fill',
            'info': 'bi-info-circle-fill',
            'loading': 'bi-hourglass-split'
        };
        return icons[type] || icons.info;
    }

    // طرق مختصرة
    success(message, options = {}) {
        return this.show(message, 'success', 4000, options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', 6000, options);
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', 5000, options);
    }

    info(message, options = {}) {
        return this.show(message, 'info', 4000, options);
    }

    loading(message, options = {}) {
        return this.show(message, 'loading', 0, { ...options, autoClose: false });
    }

    // مسح جميع الإشعارات
    clear() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// إنشاء مثيل عام للنظام
const notificationSystem = new NotificationSystem();

// تصدير للاستخدام العام
window.showNotification = (message, type, duration, options) => {
    return notificationSystem.show(message, type, duration, options);
};

window.showSuccess = (message, options) => {
    return notificationSystem.success(message, options);
};

window.showError = (message, options) => {
    return notificationSystem.error(message, options);
};

window.showWarning = (message, options) => {
    return notificationSystem.warning(message, options);
};

window.showInfo = (message, options) => {
    return notificationSystem.info(message, options);
};

window.showLoading = (message, options) => {
    return notificationSystem.loading(message, options);
};

window.hideNotification = (notification) => {
    return notificationSystem.hide(notification);
};

window.clearNotifications = () => {
    return notificationSystem.clear();
};

    // تسجيل Service Worker
    async registerServiceWorker() {
        if (!this.isServiceWorkerSupported) {
            console.log('Service Worker not supported');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered successfully:', registration);
            
            // تحديث Service Worker عند توفر إصدار جديد
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.showUpdateAvailable();
                    }
                });
            });
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }

    // إعداد Media Session للتحكم في الموسيقى
    setupMediaSession() {
        if (!this.mediaSession) {
            console.log('Media Session not supported');
            return;
        }

        // إعداد أزرار التحكم
        navigator.mediaSession.setActionHandler('play', () => {
            this.handleMediaAction('play');
        });

        navigator.mediaSession.setActionHandler('pause', () => {
            this.handleMediaAction('pause');
        });

        navigator.mediaSession.setActionHandler('previoustrack', () => {
            this.handleMediaAction('previous');
        });

        navigator.mediaSession.setActionHandler('nexttrack', () => {
            this.handleMediaAction('next');
        });

        navigator.mediaSession.setActionHandler('seekbackward', () => {
            this.handleMediaAction('seekbackward');
        });

        navigator.mediaSession.setActionHandler('seekforward', () => {
            this.handleMediaAction('seekforward');
        });

        navigator.mediaSession.setActionHandler('stop', () => {
            this.handleMediaAction('stop');
        });
    }

    // إعداد مستمعي الرسائل من Service Worker
    setupMessageListeners() {
        if (!this.isServiceWorkerSupported) return;

        navigator.serviceWorker.addEventListener('message', (event) => {
            const { type, action, data } = event.data;
            
            switch (type) {
                case 'NOTIFICATION_ACTION':
                    this.handleNotificationAction(action);
                    break;
                case 'BACKGROUND_AUDIO_SYNC':
                    this.handleBackgroundAudioSync(data);
                    break;
                case 'PERIODIC_SYNC':
                    this.handlePeriodicSync(data);
                    break;
            }
        });
    }

    // طلب إذن الإشعارات
    async requestNotificationPermission() {
        if (!this.isNotificationSupported) {
            this.showError('المتصفح لا يدعم الإشعارات');
            return false;
        }

        if (this.permission === 'granted') {
            return true;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            
            if (permission === 'granted') {
                this.showSuccess('تم تفعيل الإشعارات بنجاح');
                return true;
            } else {
                this.showWarning('تم رفض الإشعارات');
                return false;
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            this.showError('خطأ في طلب إذن الإشعارات');
            return false;
        }
    }

    // عرض إشعار PWA
    async showPWANotification(title, options = {}) {
        if (!this.isNotificationSupported || this.permission !== 'granted') {
            // Fallback to in-app notification
            return this.show(title, 'info', 5000, options);
        }

        const defaultOptions = {
            body: options.body || '',
            icon: '/media/images/logo.jpg',
            badge: '/media/images/logo.jpg',
            vibrate: [200, 100, 200],
            requireInteraction: true,
            silent: false,
            actions: [
                {
                    action: 'play',
                    title: 'تشغيل',
                    icon: '/media/images/logo.jpg'
                },
                {
                    action: 'pause',
                    title: 'إيقاف',
                    icon: '/media/images/logo.jpg'
                },
                {
                    action: 'close',
                    title: 'إغلاق',
                    icon: '/media/images/logo.jpg'
                }
            ],
            ...options
        };

        try {
            const notification = new Notification(title, defaultOptions);
            
            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            return notification;
        } catch (error) {
            console.error('Error showing PWA notification:', error);
            return this.show(title, 'info', 5000, options);
        }
    }

    // تحديث Media Session
    updateMediaSession(metadata) {
        if (!this.mediaSession) return;

        navigator.mediaSession.metadata = new MediaMetadata({
            title: metadata.title || 'Quran Cast',
            artist: metadata.artist || 'القرآن الكريم',
            album: metadata.album || 'Quran Cast',
            artwork: [
                { src: '/media/images/logo.jpg', sizes: '96x96', type: 'image/jpeg' },
                { src: '/media/images/logo.jpg', sizes: '128x128', type: 'image/jpeg' },
                { src: '/media/images/logo.jpg', sizes: '192x192', type: 'image/jpeg' },
                { src: '/media/images/logo.jpg', sizes: '256x256', type: 'image/jpeg' },
                { src: '/media/images/logo.jpg', sizes: '384x384', type: 'image/jpeg' },
                { src: '/media/images/logo.jpg', sizes: '512x512', type: 'image/jpeg' }
            ]
        });
    }

    // تحديث حالة التشغيل
    updatePlaybackState(state) {
        if (!this.mediaSession) return;

        navigator.mediaSession.playbackState = state; // 'playing', 'paused', 'none'
    }

    // معالجة إجراءات الوسائط
    handleMediaAction(action) {
        console.log('Media action:', action);
        
        // إرسال الحدث إلى المكونات المناسبة
        window.dispatchEvent(new CustomEvent('mediaAction', {
            detail: { action }
        }));
    }

    // معالجة إجراءات الإشعارات
    handleNotificationAction(action) {
        console.log('Notification action:', action);
        this.handleMediaAction(action);
    }

    // معالجة مزامنة الصوت في الخلفية
    handleBackgroundAudioSync(data) {
        console.log('Background audio sync:', data);
        // تحديث حالة الصوت
    }

    // معالجة المزامنة الدورية
    handlePeriodicSync(data) {
        console.log('Periodic sync:', data);
        // تحديث المحتوى
    }

    // عرض إشعار التحديث المتاح
    showUpdateAvailable() {
        this.show('تحديث جديد متاح!', 'info', 0, {
            title: 'تحديث التطبيق',
            onClick: () => {
                window.location.reload();
            }
        });
    }

    // إشعار بدء التشغيل
    showPlaybackStarted(title, artist) {
        this.updateMediaSession({ title, artist });
        this.updatePlaybackState('playing');
        this.showPWANotification(`تشغيل: ${title}`, {
            body: `المؤدي: ${artist}`,
            tag: 'playback'
        });
    }

    // إشعار توقف التشغيل
    showPlaybackPaused() {
        this.updatePlaybackState('paused');
        this.showPWANotification('تم إيقاف التشغيل', {
            body: 'يمكنك متابعة التشغيل من الإشعار',
            tag: 'playback'
        });
    }

    // إشعار تغيير المحطة
    showStationChanged(stationName) {
        this.updateMediaSession({ title: stationName, artist: 'محطة إذاعية' });
        this.showPWANotification(`محطة جديدة: ${stationName}`, {
            body: 'تم تغيير المحطة الإذاعية',
            tag: 'station'
        });
    }
}

// Test function
window.testNotification = () => {
    console.log('Testing notification system...');
    showSuccess('اختبار الإشعارات - نجح!');
    setTimeout(() => showError('اختبار الإشعارات - خطأ!'), 1000);
    setTimeout(() => showWarning('اختبار الإشعارات - تحذير!'), 2000);
    setTimeout(() => showInfo('اختبار الإشعارات - معلومات!'), 3000);
};

// Test PWA notifications
window.testPWANotification = async () => {
    const notificationSystem = window.notificationSystem;
    await notificationSystem.requestNotificationPermission();
    notificationSystem.showPWANotification('اختبار إشعار PWA', {
        body: 'هذا اختبار للإشعارات الخارجية'
    });
};

// Test Media Session
window.testMediaSession = () => {
    const notificationSystem = window.notificationSystem;
    notificationSystem.updateMediaSession({
        title: 'سورة الفاتحة',
        artist: 'عبد الباسط عبد الصمد',
        album: 'Quran Cast'
    });
    notificationSystem.updatePlaybackState('playing');
    notificationSystem.showPlaybackStarted('سورة الفاتحة', 'عبد الباسط عبد الصمد');
};
