# Telegram Mini App

نسخة عربية بسيطة تعرض الخدمات الحقيقية من SMMCPAN مع زيادة 10% على السعر المعروض.

## المتغيرات

```env
PORT=3000
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBAPP_URL=https://your-railway-domain.up.railway.app
SMMCPAN_API_URL=https://smmcpan.com/api/v2
SMMCPAN_API_KEY=
```

## ما يعمل الآن

- Telegram Mini App بواجهة RTL متجاوبة.
- تحميل قائمة الخدمات مباشرة من SMMCPAN.
- عرض السعر بعد زيادة 10%: `سعر المزود × 1.10`.
- لا يتم عرض مفتاح SMMCPAN في المتصفح.

## مهم قبل تفعيل الطلبات

تم إبقاء إنشاء الطلبات معطلاً عمدًا في هذه المرحلة، لأن المشروع لا يحتوي بعد على دفع أو رصيد للمستخدم. تفعيل `/api/orders` قبل إضافة ذلك سيسمح لأي زائر باستهلاك رصيد حساب SMMCPAN. بعد تحديد طريقة الدفع/الرصيد يمكن إضافة الطلبات بأمان مع التحقق من Telegram WebApp.

## التشغيل على Railway

1. اربط المستودع في Railway.
2. أضف المتغيرات السابقة من **Service → Variables**.
3. نفّذ Deploy.
4. افتح رابط Railway ثم اضغط **تحميل الخدمات**.
5. من Telegram أرسل `/start` واضغط **فتح التطبيق**.
