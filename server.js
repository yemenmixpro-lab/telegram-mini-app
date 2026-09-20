require('dotenv').config();

const express = require('express');
const path = require('path');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
const WEBAPP_URL = (process.env.TELEGRAM_WEBAPP_URL || '').trim();
const SMMCPAN_API_URL = (process.env.SMMCPAN_API_URL || 'https://smmcpan.com/api/v2').trim().replace(/\/$/, '');
const SMMCPAN_API_KEY = (process.env.SMMCPAN_API_KEY || '').trim();

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function normalizeService(rawService) {
  if (!rawService || typeof rawService !== 'object') {
    return null;
  }

  const serviceNumber = rawService.service ?? rawService.service_id ?? rawService.id ?? rawService.serviceId ?? '';
  const category = rawService.category ?? rawService.category_name ?? rawService.type ?? 'عام';
  const name = rawService.name || rawService.title || rawService.service_name || 'خدمة';
  const price = rawService.price ?? rawService.rate ?? rawService.cost ?? rawService.original_price ?? 0;
  const min = rawService.min ?? rawService.minimum ?? rawService.min_amount ?? 0;
  const max = rawService.max ?? rawService.maximum ?? rawService.max_amount ?? 0;

  return {
    service: String(serviceNumber),
    name,
    category,
    price: Number(price) || 0,
    min: Number(min) || 0,
    max: Number(max) || 0
  };
}

async function fetchServicesFromSmmcpan() {
  const response = await axios.post(
    SMMCPAN_API_URL,
    { action: 'services', key: SMMCPAN_API_KEY },
    {
      timeout: 20000,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    }
  );

  const payload = response.data;
  const rawServices = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.services)
      ? payload.services
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

  return rawServices
    .map(normalizeService)
    .filter(Boolean);
}

app.get('/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    app: 'telegram-mini-app',
    telegramBotConfigured: Boolean(BOT_TOKEN),
    telegramWebAppConfigured: Boolean(WEBAPP_URL),
    smmcpanConfigured: Boolean(SMMCPAN_API_KEY),
    servicesEndpoint: '/api/services'
  });
});

app.get('/api/services', async (_req, res) => {
  if (!SMMCPAN_API_KEY) {
    return res.status(503).json({
      ok: false,
      message: 'SMMCPAN_API_KEY is not configured. Add it in Railway environment variables.'
    });
  }

  try {
    const services = await fetchServicesFromSmmcpan();
    return res.json({
      ok: true,
      source: 'SMMCPAN',
      count: services.length,
      services
    });
  } catch (error) {
    console.error('SMMCPAN services error:', error.response?.data || error.message);
    return res.status(502).json({
      ok: false,
      message: 'تعذر تحميل الخدمات من SMMCPAN في الوقت الحالي.'
    });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (BOT_TOKEN && WEBAPP_URL) {
  const bot = new TelegramBot(BOT_TOKEN, { polling: true });

  bot.on('polling_error', (error) => {
    console.error('Telegram polling error:', error.message);
  });

  bot.onText(/^\/(start|help)(?:@[^\s]+)?$/i, async (msg) => {
    const options = {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: 'فتح التطبيق', web_app: { url: WEBAPP_URL } }]]
      }
    };

    await bot.sendMessage(
      msg.chat.id,
      '<b>أهلاً بك</b>\nاضغط الزر لفتح التطبيق.',
      options
    );
  });

  console.log(`Telegram bot started. WebApp URL: ${WEBAPP_URL}`);
} else if (BOT_TOKEN) {
  console.warn('TELEGRAM_BOT_TOKEN is set but TELEGRAM_WEBAPP_URL is missing. Bot will not send a Mini App link.');
} else {
  console.warn('TELEGRAM_BOT_TOKEN is missing; app will run without Telegram bot integration.');
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mini app listening on http://0.0.0.0:${PORT}`);
  console.log(`Health check: http://0.0.0.0:${PORT}/health`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});
