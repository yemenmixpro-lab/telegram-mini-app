# Telegram Mini App

تطبيق Telegram Mini App بسيط ومخصص لعرض خدمات SMMCPAN فقط، جاهز للنشر على Railway.

## ما يتضمن هذا المشروع

- واجهة عربية RTL متوافقة مع Telegram
- زر واضح: "تحميل الخدمات"
- API داخلي: `GET /api/services`
- ربط بالخادم الخارجي: `https://smmcpan.com/api/v2`
- استخدام متغيرات ENV فقط:
  - `TELEGRAM_BOT_TOKEN`
  - `TELEGRAM_WEBAPP_URL`
  - `SMMCPAN_API_URL`
  - `SMMCPAN_API_KEY`
- لا يتم إرسال `SMMCPAN_API_KEY` إلى الواجهة أو Telegram
- عرض البيانات التالية فقط:
  - اسم الخدمة
  - رقم الخدمة
  - التصنيف
  - السعر الأصلي
  - الحد الأدنى
  - الحد الأقصى

## متغيرات البيئة

```env
PORT=3000
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBAPP_URL=https://your-railway-app.up.railway.app
SMMCPAN_API_URL=https://smmcpan.com/api/v2
SMMCPAN_API_KEY=
```

## نقاط النهاية

- `GET /health`
- `GET /api/services`

## التشغيل محليًا

```bash
npm install
npm start
```

## النشر على Railway

1. أضف المتغيرات المذكورة أعلاه في Railway.
2. تأكد أن `SMMCPAN_API_URL` يساوي `https://smmcpan.com/api/v2`.
3. ربط المشروع بــ Railway وابدأ النشر.
4. أضف رابط التطبيق في Telegram WebApp باستخدام `TELEGRAM_WEBAPP_URL`.

## ملاحظات مهمة

- لا توجد ميزات للدخول أو الرصيد أو الدفع أو الطلبات أو العروض.
- لا يوجد POST إلى `/api/orders` في هذه المرحلة.
- المشروع مصمم ليكون بسيطًا ونظيفًا وقابلًا للتشغيل مباشرة على Railway.

















































































































































































































































































































































