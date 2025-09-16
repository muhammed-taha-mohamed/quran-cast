# دليل إعداد النظام الجديد (Firestore + GitHub)

## ✅ ما تم إنجازه

تم تحديث النظام ليأخذ إعدادات GitHub من Firestore بدلاً من الملفات المحلية، مما يجعل النظام أكثر أماناً ومرونة.

## 🔧 الإعدادات المطلوبة في Firestore

### الكولكشن: `admin_settings`
### المستند: `github`

```json
{
  "branch": "main",
  "repo": "https://github.com/muhammed-taha-mohamed/quran-cast-vedios",
  "token": "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",
  "updatedAt": "16 September 2025 at 14:37:49 UTC",
  "updatedBy": "admin@mail.com"
}
```

## 🚀 كيفية اختبار النظام

### 1. اختبار سريع في Console
```javascript
// افتح Developer Console (F12)
// ثم اكتب:

// اختبار شامل للنظام
reelsManager.testSystemConnection().then(result => {
    console.log('نتيجة الاختبار:', result);
});

// اختبار تحميل الإعدادات فقط
reelsManager.loadGitHubSettings().then(result => {
    console.log('تحميل الإعدادات:', result);
});

// اختبار GitHub فقط
reelsManager.testGitHubConnection().then(result => {
    console.log('اتصال GitHub:', result);
});
```

### 2. اختبار رفع صورة/فيديو
1. اذهب إلى قسم الـ Reels
2. اضغط على زر "إضافة منشور"
3. اختر صورة أو فيديو
4. راقب رسائل Console

## 🔍 رسائل النظام

### رسائل النجاح:
- ✅ `تم تحميل إعدادات GitHub بنجاح`
- ✅ `تم الاتصال بـ GitHub بنجاح`
- ✅ `جميع الاختبارات نجحت! النظام جاهز للاستخدام`

### رسائل الخطأ:
- ❌ `لم يتم العثور على إعدادات GitHub في Firestore`
- ❌ `فشل في تحميل الإعدادات من Firestore`
- ❌ `فشل في الاتصال بـ GitHub`

## 🛠️ استكشاف الأخطاء

### إذا ظهر خطأ "لم يتم العثور على إعدادات GitHub في Firestore":
1. تأكد من وجود الكولكشن `admin_settings`
2. تأكد من وجود المستند `github`
3. تأكد من صحة البيانات في المستند

### إذا ظهر خطأ "فشل في الاتصال بـ GitHub":
1. تأكد من صحة الـ token
2. تأكد من صلاحيات الـ token
3. تأكد من وجود المستودع

### إذا ظهر خطأ "فشل في تحميل الإعدادات":
1. تأكد من اتصال Firestore
2. تأكد من صلاحيات القراءة
3. تحقق من Console للأخطاء التفصيلية

## 📋 الميزات الجديدة

### 1. تحميل تلقائي للإعدادات
- يتم تحميل الإعدادات من Firestore تلقائياً
- لا حاجة لتحديث الكود عند تغيير الإعدادات

### 2. اختبار شامل
- اختبار Firestore + GitHub معاً
- رسائل واضحة لكل خطوة

### 3. معالجة أخطاء محسنة
- رسائل خطأ باللغة العربية
- إرشادات واضحة لحل المشاكل

### 4. أمان أفضل
- الـ token محفوظ في Firestore
- لا يوجد token في الكود

## 🔄 تحديث الإعدادات

لتحديث إعدادات GitHub:
1. اذهب إلى Firestore Console
2. افتح `admin_settings` → `github`
3. حدث القيم المطلوبة
4. احفظ التغييرات
5. جرب النظام مرة أخرى

## 📞 الدعم

إذا واجهت أي مشاكل:
1. افتح Developer Console (F12)
2. ابحث عن رسائل الخطأ
3. جرب الاختبارات المذكورة أعلاه
4. تأكد من صحة البيانات في Firestore
