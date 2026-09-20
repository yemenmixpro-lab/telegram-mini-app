# Telegram Mini App

واجهة عربية أنيقة داخل Telegram Mini App تعرض خدمات SMMCPAN فقط، مع تصميم حديث ومريح وأداء جيد على Railway.

## ماذا يتضمن المشروع

- واجهة RTL عربية متجاوبة مع الهاتف وTelegram WebApp.
- زر واضح: «تحميل الخدمات».
- واجهة ممتازة وعصرية ومناسب للأعمال.
- API داخلي: `GET /api/services`.
- ربط فعلي بـ `https://smmcpan.com/api/v2` من الخادم فقط.
- استخدام متغيرات البيئة فقط.
- عدم إرسال `SMMCPAN_API_KEY` إلى المتصفح أو Telegram.
- عرض الخدمات فقط:
  - اسم الخدمة
  - رقم الخدمة
  - التصنيف
  - السعر الأصلي
  - الحد الأدنى
  - الحد الأقصى

## متغيرات Railway

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBAPP_URL=https://your-railway-domain.up.railway.app
SMMCPAN_API_URL=https://smmcpan.com/api/v2
SMMCPAN_API_KEY=
```

## التشغيل محليًا

```bash
npm install
npm start
```

## نقاط النهاية

- `/health`
- `/api/services`

## ما تم استبعاده

لا توجد في هذه المرحلة:

- تسجيل دخول
- رصيد
- دفع
- إنشاء طلبات
- POST /api/orders
- إحالات
- مكافآت
- نظام نقاط
- لوحة إدارة

هذا الإصدار مصمم ليكون بسيطًا، نظيفًا، عمليًا، وجاهزًا للاستخدام داخل Telegram Mini App على Railway.
