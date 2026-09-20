<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>خدمات SMMCPAN</title>
    <style>
      :root {
        --bg: #f3f6fb;
        --card: #ffffff;
        --border: #e7edf7;
        --text: #1e2a39;
        --muted: #64748b;
        --primary: #2f6df6;
        --primary-soft: #eaf1ff;
        --success: #0d9488;
        --warning: #fff7d6;
        --danger: #e11d48;
      }

      * { box-sizing: border-box; }

      html, body {
        margin: 0;
        min-height: 100%;
        background: var(--bg);
        color: var(--text);
        font-family: Tahoma, Arial, sans-serif;
      }

      body {
        padding: 18px;
      }

      main {
        max-width: 760px;
        margin: 0 auto;
      }

      .panel {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 18px;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
        padding: 20px;
        margin-bottom: 16px;
      }

      .tag {
        display: inline-block;
        padding: 7px 12px;
        border-radius: 999px;
        background: var(--primary-soft);
        color: var(--primary);
        font-size: 12px;
        font-weight: 700;
        margin-bottom: 12px;
      }

      h1 {
        font-size: clamp(24px, 4vw, 32px);
        margin: 0 0 8px;
      }

      .subtitle {
        color: var(--muted);
        line-height: 1.7;
        margin: 0 0 14px;
      }

      .actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      button {
        border: none;
        border-radius: 12px;
        min-height: 46px;
        padding: 0 16px;
        background: var(--primary);
        color: white;
        font-weight: 700;
        cursor: pointer;
        font-size: 15px;
      }

      button:hover {
        opacity: 0.98;
      }

      .notice {
        margin-top: 14px;
        background: var(--warning);
        border: 1px solid #f7e7a5;
        color: #7a5a00;
        border-radius: 12px;
        padding: 12px 14px;
        display: none;
        line-height: 1.6;
      }

      .notice.show {
        display: block;
      }

      .empty {
        color: var(--muted);
        text-align: center;
        padding: 24px 10px 6px;
      }

      .services {
        display: grid;
        gap: 12px;
      }

      .service-card {
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 16px;
        background: #fdfdff;
      }

      .service-name {
        font-size: 18px;
        margin: 0 0 8px;
      }

      .meta {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px 12px;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.8;
      }

      .meta span {
        display: block;
      }

      .strong {
        color: var(--text);
        font-weight: 700;
      }

      @media (max-width: 480px) {
        body { padding: 12px; }
        .panel { padding: 16px; }
        .meta { grid-template-columns: 1fr; }
        button { width: 100%; }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="panel">
        <span class="tag">Telegram Mini App</span>
        <h1>خدمات SMMCPAN</h1>
        <p class="subtitle">عرض الخدمات المتاحة من الموقع الرسمي فقط. لا توجد طلبات أو دفع أو حسابات داخل التطبيق في هذه المرحلة.</p>
        <div class="actions">
          <button id="loadServices">تحميل الخدمات</button>
        </div>
        <div id="message" class="notice"></div>
      </section>

      <section class="panel">
        <div id="services" class="empty">اضغط على زر «تحميل الخدمات» لعرض البيانات.</div>
      </section>
    </main>

    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <script>
      const tg = window.Telegram && window.Telegram.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
      }

      const servicesContainer = document.getElementById('services');
      const messageBox = document.getElementById('message');

      function setMessage(text, isError = false) {
        if (!text) {
          messageBox.classList.remove('show');
          messageBox.textContent = '';
          return;
        }

        messageBox.textContent = text;
        messageBox.classList.add('show');
        messageBox.style.borderColor = isError ? '#fecdd3' : '#f7e7a5';
        messageBox.style.background = isError ? '#fff1f2' : '#fff7d6';
        messageBox.style.color = isError ? '#9f1239' : '#7a5a00';
      }

      function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (char) => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[char]));
      }

      function renderServices(items) {
        if (!items.length) {
          servicesContainer.className = 'empty';
          servicesContainer.textContent = 'لا توجد خدمات متاحة في الوقت الحالي.';
          return;
        }

        servicesContainer.className = 'services';
        servicesContainer.innerHTML = items.map((service) => `
          <article class="service-card">
            <h2 class="service-name">${escapeHtml(service.name || 'خدمة بدون اسم')}</h2>
            <div class="meta">
              <span>رقم الخدمة: <span class="strong">${escapeHtml(service.service || '-')}</span></span>
              <span>التصنيف: <span class="strong">${escapeHtml(service.category || 'عام')}</span></span>
              <span>السعر الأصلي: <span class="strong">${Number(service.price || 0).toLocaleString('ar-SA')}</span></span>
              <span>الحد الأدنى: <span class="strong">${Number(service.min || 0).toLocaleString('ar-SA')}</span></span>
              <span>الحد الأقصى: <span class="strong">${Number(service.max || 0).toLocaleString('ar-SA')}</span></span>
            </div>
          </article>
        `).join('');
      }

      async function loadServices() {
        servicesContainer.className = 'empty';
        servicesContainer.textContent = 'جاري تحميل الخدمات...';
        setMessage('');

        try {
          const response = await fetch('/api/services');
          const payload = await response.json();

          if (!response.ok) {
            throw new Error(payload?.message || 'تعذر تحميل الخدمات');
          }

          const services = Array.isArray(payload.services) ? payload.services : [];
          renderServices(services);
          setMessage(`تم تحميل ${services.length} خدمة بنجاح.`);
        } catch (error) {
          servicesContainer.className = 'empty';
          servicesContainer.textContent = 'تعذر تحميل الخدمات.';
          setMessage(error.message || 'حدث خطأ غير متوقع.', true);
        }
      }

      document.getElementById('loadServices').addEventListener('click', loadServices);
    </script>
  </body>
</html>
