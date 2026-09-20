# Telegram Mini App

واجهة Telegram Mini App عربية وسريعة لعرض كتالوج خدمات SMMCPAN، ومجهزة للعمل على Railway.

## الوظائف الحالية

- واجهة RTL متجاوبة مع الهاتف وTelegram WebApp.
- تحميل الخدمات من SMMCPAN عبر `GET /api/services`.
- بحث فوري بالاسم أو التصنيف أو رقم الخدمة.
- عرض اسم الخدمة، الرقم، التصنيف، السعر الأصلي، الحد الأدنى والحد الأقصى.
- تخزين مؤقت للخدمات لمدة خمس دقائق لتقليل الضغط وتسريع الاستخدام.
- حماية `SMMCPAN_API_KEY` داخل الخادم وعدم إرساله إلى الواجهة أو Telegram.
- زر `/start` في Telegram لفتح الـMini App.

## متغيرات Railway

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBAPP_URL=https://your-railway-domain.up.railway.app
SMMCPAN_API_URL=https://smmcpan.com/api/v2
SMMCPAN_API_KEY=
```

يستخدم التطبيق `PORT` الذي توفره Railway تلقائيًا، ويمكن ضبطه محليًا عند الحاجة.

## التشغيل

```bash
npm install
npm start
```

اختبر:

- `/health`
- `/api/services`

## Railway

1. اربط المشروع `yemenmixpro-lab/telegram-mini-app`.
2. أنشئ Domain للخدمة من Networking.
3. ضع رابط Domain في `TELEGRAM_WEBAPP_URL`.
4. أضف `TELEGRAM_BOT_TOKEN` و`SMMCPAN_API_KEY` وباقي المتغيرات.
5. أعد النشر ثم افتح رابط Domain.

## النطاق

هذا الإصدار مخصص لعرض الخدمات فقط. لا يحتوي على تسجيل دخول أو رصيد أو دفع أو إنشاء طلبات أو إحالات أو مكافآت أو لوحة إدارة.
