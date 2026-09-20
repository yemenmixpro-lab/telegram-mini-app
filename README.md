# Telegram Mini App

نسخة عربية بسيطة لاختبار الاتصال الحقيقي مع SMMCPAN فقط.

## ما يعمل في هذه المرحلة

- فتح التطبيق من Telegram WebApp.
- الاتصال بالخادم `https://smmcpan.com/api/v2` من جهة الخادم فقط.
- جلب قائمة الخدمات الحقيقية عبر `action=services`.
- عرض اسم الخدمة ورقمها وسعرها الأصلي والحد الأدنى والأقصى.
- مفتاح SMMCPAN لا يصل إلى المتصفح ولا يظهر في الواجهة.
- لا توجد طلبات أو دفع أو رصيد أو هامش ربح في هذه المرحلة.

## متغيرات Railway

```env
PORT=3000
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBAPP_URL=https://your-railway-domain.up.railway.app
SMMCPAN_API_URL=https://smmcpan.com/api/v2
SMMCPAN_API_KEY=
```

## الاختبار

1. أضف `TELEGRAM_BOT_TOKEN` و`SMMCPAN_API_KEY` في Railway.
2. تأكد أن `SMMCPAN_API_URL` تساوي `https://smmcpan.com/api/v2`.
3. أعد النشر بعد حفظ المتغيرات.
4. افتح رابط التطبيق من Telegram.
5. اضغط **تحميل الخدمات**.
6. يمكنك اختبار الحالة من:
   `https://your-railway-domain.up.railway.app/health`
7. نقطة الاتصال للقراءة هي:
   `https://your-railway-domain.up.railway.app/api/services`

إذا ظهر خطأ، ستظهر رسالة عامة في التطبيق، ويمكن مراجعة Railway Logs لمعرفة رد SMMCPAN. لا تشارك مفتاح API في السجلات أو المحادثات.
