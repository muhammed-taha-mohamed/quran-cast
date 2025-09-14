// نظام الإشعارات الموحد للتطبيق
class NotificationSystem {
    constructor() {
        this.container = null;
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

// Test function
window.testNotification = () => {
    console.log('Testing notification system...');
    showSuccess('اختبار الإشعارات - نجح!');
    setTimeout(() => showError('اختبار الإشعارات - خطأ!'), 1000);
    setTimeout(() => showWarning('اختبار الإشعارات - تحذير!'), 2000);
    setTimeout(() => showInfo('اختبار الإشعارات - معلومات!'), 3000);
};
