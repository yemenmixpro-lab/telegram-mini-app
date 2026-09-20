# Telegram Mini App

نسخة أولية بسيطة بواجهة عربية RTL، جاهزة للنشر على Railway.

## متغيرات Railway المطلوبة

أضفها من **Service → Variables**:

```env
PORT=3000
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBAPP_URL=
SMMCPAN_API_URL=https://smmcpan.com/api/v2
SMMCPAN_API_KEY=
```

اترك `PORT` كما هو؛ Railway يمرر المنفذ تلقائياً. بعد أول Deploy انسخ رابط Railway العام وضعه في `TELEGRAM_WEBAPP_URL` مع `https://`، ثم أعد Deploy.

## التشغيل

1. أنشئ بوتاً من `@BotFather` وخذ `TELEGRAM_BOT_TOKEN`.
2. اربط المستودع في Railway واختر Deploy من GitHub.
3. أضف المتغيرات السابقة، خصوصاً التوكن والمفتاح.
4. افتح `https://رابط-التطبيق/health` وتأكد أن `ok` تساوي `true`.
5. افتح البوت وأرسل `/start` ثم اضغط «فتح التطبيق».

لا ترفع ملف `.env` إلى GitHub ولا تشارك التوكن أو المفتاح.
