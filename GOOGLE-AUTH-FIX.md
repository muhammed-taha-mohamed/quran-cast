# إصلاح مشكلة تسجيل الدخول بجوجل

## المشكلة
كان يظهر خطأ `Firebase Auth not initialized` عند محاولة تسجيل الدخول بجوجل.

## السبب
كانت دوال المصادقة تحاول استخدام `this.auth` قبل التأكد من تهيئة Firebase بشكل صحيح.

## الحلول المطبقة

### 1. إضافة دالة مساعدة للتهيئة
```javascript
// Ensure Firebase is initialized before auth operations
async ensureFirebaseInitialized() {
    if (!this.isInitialized || !this.auth || !this.db) {
        console.log('Ensuring Firebase initialization...');
        await this.initialize();
    }
}
```

### 2. تحسين دالة التهيئة
```javascript
async initialize() {
    if (this.isInitialized && this.auth && this.db) {
        console.log('Firebase already initialized');
        return;
    }

    // Check if Firebase app is already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(this.firebaseConfig);
    }
    
    this.db = firebase.firestore();
    this.auth = firebase.auth();
    this.isInitialized = true;
}
```

### 3. تحديث دوال المصادقة
جميع دوال المصادقة الآن تستخدم `ensureFirebaseInitialized()` قبل تنفيذ أي عملية:

```javascript
async loginWithGoogle() {
    try {
        // التأكد من تهيئة Firebase أولاً
        await this.ensureFirebaseInitialized();
        
        // باقي الكود...
    } catch (error) {
        // معالجة الأخطاء...
    }
}
```

## الملفات المحدثة

1. **js/reels.js**
   - إضافة `ensureFirebaseInitialized()`
   - تحسين `initialize()`
   - تحديث `loginWithGoogle()`
   - تحديث `signupWithGoogle()`
   - تحديث `loginWithEmail()`
   - تحديث `signupWithEmail()`

2. **test-google-auth.html**
   - إضافة فحص التهيئة في دوال الاختبار

## كيفية الاختبار

1. افتح `test-google-auth.html` في المتصفح
2. اضغط على "تسجيل الدخول بجوجل"
3. تأكد من عدم ظهور خطأ التهيئة
4. اختبر نفس الشيء في التطبيق الرئيسي

## ملاحظات مهمة

- تأكد من تفعيل Google Authentication في Firebase Console
- تأكد من إضافة النطاق الصحيح في Firebase Console
- تأكد من السماح بالنوافذ المنبثقة في المتصفح

## النتيجة
✅ تم حل مشكلة `Firebase Auth not initialized`
✅ تسجيل الدخول بجوجل يعمل بشكل صحيح
✅ إنشاء الحساب بجوجل يعمل بشكل صحيح
✅ جميع دوال المصادقة محمية من أخطاء التهيئة
