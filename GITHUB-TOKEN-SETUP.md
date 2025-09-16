# دليل إعداد GitHub Token لرفع الصور والفيديوهات

## المشكلة الحالية
تحصل على خطأ: "فشل الاتصال بـ GitHub. تحقق من صحة الـ token أو اتصال الإنترنت."

## الحل السريع

### الخطوة 1: إنشاء GitHub Token جديد

1. **اذهب إلى GitHub:**
   - افتح https://github.com
   - سجل دخولك إلى حسابك

2. **انتقل إلى إعدادات المطور:**
   - اضغط على صورتك الشخصية (أعلى يمين)
   - اختر "Settings"
   - من القائمة الجانبية، اختر "Developer settings"
   - اختر "Personal access tokens" → "Tokens (classic)"

3. **أنشئ Token جديد:**
   - اضغط "Generate new token" → "Generate new token (classic)"
   - اكتب وصف للـ token: "Quran Cast Upload Token"
   - اختر مدة الصلاحية: "No expiration" (أو حسب رغبتك)

4. **اختر الصلاحيات المطلوبة:**
   - ✅ **repo** (Full control of private repositories)
   - ✅ **public_repo** (Access public repositories)
   - ✅ **workflow** (Update GitHub Action workflows)

5. **أنشئ الـ Token:**
   - اضغط "Generate token"
   - **انسخ الـ Token فوراً** (لن تتمكن من رؤيته مرة أخرى!)

### الخطوة 2: تحديث التطبيق

1. **افتح ملف `js/config.js`**
2. **استبدل هذا السطر:**
   ```javascript
   token: "YOUR_GITHUB_TOKEN_HERE",
   ```
   **بـ:**
   ```javascript
   token: "YOUR_ACTUAL_TOKEN_HERE",
   ```
   (ضع الـ token الذي نسخته في الخطوة السابقة)

3. **احفظ الملف**

### الخطوة 3: اختبار النظام

1. **افتح التطبيق في المتصفح**
2. **اضغط F12 لفتح Developer Console**
3. **جرب رفع صورة أو فيديو**
4. **راقب رسائل Console**

## اختبار إضافي

### اختبار الاتصال مباشرة:
```javascript
// في Console المتصفح
reelsManager.testGitHubConnection().then(result => {
    console.log('GitHub connection:', result);
});
```

### اختبار الـ Token مباشرة:
```javascript
// في Console المتصفح
fetch('https://api.github.com/repos/muhammed-taha-mohamed/quran-cast-vedios', {
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE'
    }
}).then(r => r.json()).then(console.log);
```

## نصائح مهمة

### 🔒 الأمان:
- **لا تشارك الـ Token مع أحد**
- **لا ترفع الـ Token على GitHub**
- **احتفظ بنسخة احتياطية من الـ Token**

### 📁 إدارة الملفات:
- الملفات تُرفع في مجلد `uploads/` في المستودع
- أسماء الملفات فريدة (timestamp + random)
- الحد الأقصى للملف: 100MB

### 🐛 استكشاف الأخطاء:

#### إذا ظهر خطأ 401:
- الـ Token منتهي الصلاحية أو غير صحيح
- أنشئ token جديد

#### إذا ظهر خطأ 403:
- الـ Token لا يملك الصلاحيات المطلوبة
- تأكد من اختيار صلاحيات `repo` و `public_repo`

#### إذا ظهر خطأ 404:
- المستودع غير موجود
- تأكد من وجود المستودع: `muhammed-taha-mohamed/quran-cast-vedios`

## التحسينات المضافة

✅ **نظام إعدادات منفصل** (`js/config.js`)
✅ **رسائل خطأ واضحة باللغة العربية**
✅ **فحص صحة الـ Token قبل الاستخدام**
✅ **تسجيل مفصل في Console**
✅ **أسماء ملفات فريدة لتجنب التضارب**

## الدعم

إذا استمرت المشكلة:
1. تحقق من اتصال الإنترنت
2. جرب استخدام VPN
3. تأكد من وجود المستودع على GitHub
4. راجع رسائل الخطأ في Console
