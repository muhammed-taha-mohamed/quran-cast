# دليل استكشاف أخطاء رفع الصور والفيديوهات على GitHub

## المشاكل المحتملة والحلول

### 1. مشكلة GitHub Token
**المشكلة**: الـ token منتهي الصلاحية أو غير صالح
**الحل**:
1. اذهب إلى GitHub → Settings → Developer settings → Personal access tokens
2. أنشئ token جديد مع الصلاحيات التالية:
   - `repo` (Full control of private repositories)
   - `public_repo` (Access public repositories)
3. استبدل الـ token في الكود

### 2. مشكلة صلاحيات المستودع
**المشكلة**: المستودع غير موجود أو لا توجد صلاحيات للكتابة
**الحل**:
1. تأكد من وجود المستودع: `muhammed-taha-mohamed/quran-cast-vedios`
2. تأكد من أن الـ token له صلاحيات الكتابة على المستودع
3. تأكد من أن المستودع عام (public)

### 3. مشكلة حجم الملف
**المشكلة**: الملفات كبيرة جداً لـ GitHub
**الحل**:
- GitHub له حد أقصى 100MB للملف الواحد
- استخدم ضغط الصور قبل الرفع
- للفيديوهات الكبيرة، استخدم خدمة أخرى مثل Cloudinary

### 4. مشكلة اتصال الإنترنت
**المشكلة**: مشاكل في الاتصال
**الحل**:
- تحقق من اتصال الإنترنت
- جرب استخدام VPN إذا كان هناك حجب

## كيفية اختبار النظام

### 1. فتح Developer Console
- اضغط F12 في المتصفح
- اذهب إلى تبويب Console

### 2. اختبار الاتصال
```javascript
// في Console
reelsManager.testGitHubConnection().then(result => {
    console.log('GitHub connection:', result);
});
```

### 3. مراقبة الأخطاء
- راقب رسائل الخطأ في Console
- ابحث عن رسائل مثل:
  - "GitHub connection failed"
  - "خطأ في المصادقة"
  - "تم رفض الطلب"

## التحسينات المضافة

### 1. معالجة أخطاء محسنة
- رسائل خطأ واضحة باللغة العربية
- كود خطأ محدد لكل مشكلة
- تسجيل مفصل في Console

### 2. أسماء ملفات فريدة
- تجنب تضارب أسماء الملفات
- استخدام timestamp + random string
- تنظيم الملفات في مجلد `uploads/`

### 3. اختبار الاتصال
- فحص صحة الـ token قبل الرفع
- رسائل واضحة عن حالة الاتصال

## خطوات الإصلاح السريع

1. **تحقق من الـ token**:
   ```javascript
   // في Console
   fetch('https://api.github.com/repos/muhammed-taha-mohamed/quran-cast-vedios', {
       headers: {
           'Authorization': 'Bearer YOUR_TOKEN_HERE'
       }
   }).then(r => r.json()).then(console.log);
   ```

2. **تحقق من المستودع**:
   - اذهب إلى: https://github.com/muhammed-taha-mohamed/quran-cast-vedios
   - تأكد من وجوده وأنه عام

3. **اختبر رفع ملف صغير**:
   - جرب رفع صورة صغيرة أولاً
   - راقب رسائل الخطأ في Console

## نصائح إضافية

- استخدم صور مضغوطة (أقل من 1MB)
- للفيديوهات، استخدم تنسيقات مضغوطة
- راقب Console دائماً عند الرفع
- احتفظ بنسخة احتياطية من الـ token
