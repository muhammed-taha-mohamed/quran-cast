// إعدادات التطبيق
const AppConfig = {
    // إعدادات GitHub - سيتم تحميلها من Firestore
    github: {
        token: null,
        repository: null,
        branch: "main",
        uploadPath: "uploads"
    },
    
    // إعدادات أخرى
    app: {
        name: "Quran Cast",
        version: "1.0.0"
    },
    
    // حالة تحميل الإعدادات
    isLoaded: false
};

// تصدير الإعدادات
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppConfig;
}
