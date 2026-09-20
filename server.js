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

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function normalizeService(rawService) {
  const serviceId = rawService?.service ?? rawService?.id ?? rawService?.service_id ?? rawService?.code ?? '';
  const name = rawService?.name || rawService?.title || 'خدمة بدون اسم';
  const category = rawService?.category || rawService?.category_name || rawService?.type || 'عام';
  const originalPrice = Number(rawService?.rate ?? rawService?.price ?? rawService?.original_price ?? 0);
  const min = Number(rawService?.min ?? rawService?.min_amount ?? 0);
  const max = Number(rawService?.max ?? rawService?.max_amount ?? 0);

  return {
    service: String(serviceId),
    name,
    category: String(category),
    price: Number.isFinite(originalPrice) ? originalPrice : 0,
    min: Number.isFinite(min) ? min : 0,
    max: Number.isFinite(max) ? max : 0,
  };
}

async function fetchServicesFromSmmcpan() {
  const response = await axios.post(
    SMMCPAN_API_URL,
    {
      action: 'services',
      key: SMMCPAN_API_KEY,
    },
    {
      timeout: 20000,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }
  );

  const payload = response?.data;
  let serviceList = [];

  if (Array.isArray(payload)) {
    serviceList = payload;
  } else if (Array.isArray(payload?.services)) {
    serviceList = payload.services;
  } else if (Array.isArray(payload?.data)) {
    serviceList = payload.data;
  } else if (Array.isArray(payload?.result)) {
    serviceList = payload.result;
  }

  return serviceList.filter((item) => item && !item.error).map(normalizeService);
}

app.get('/health', (req, res) => {
  res.status(200).json({
    ok: true,
    service: 'telegram-mini-app',
    telegramBotConfigured: Boolean(BOT_TOKEN),
    webAppUrlConfigured: Boolean(WEBAPP_URL),
    smmcpanApiConfigured: Boolean(SMMCPAN_API_KEY),
    endpoint: '/api/services',
  });
});

app.get('/api/services', async (req, res) => {
  if (!SMMCPAN_API_URL) {
    return res.status(500).json({ ok: false, message: 'SMMCPAN_API_URL is not configured.' });
  }

  if (!SMMCPAN_API_KEY) {
    return res.status(503).json({ ok: false, message: 'SMMCPAN_API_KEY is not configured.' });
  }

  try {
    const services = await fetchServicesFromSmmcpan();
    return res.json({
      ok: true,
      count: services.length,
      services,
    });
  } catch (error) {
    const providerMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Unable to fetch services.';
    console.error('SMMCPAN services fetch failed:', providerMessage);
    return res.status(502).json({
      ok: false,
      message: 'تعذر تحميل الخدمات من SMMCPAN في الوقت الحالي.',
      details: providerMessage,
    });
  }
});

app.get('/api/config', (req, res) => {
  res.json({
    ok: true,
    telegramBotConfigured: Boolean(BOT_TOKEN),
    telegramWebAppConfigured: Boolean(WEBAPP_URL),
    smmcpanConfigured: Boolean(SMMCPAN_API_KEY),
  });
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (BOT_TOKEN) {
  const bot = new TelegramBot(BOT_TOKEN, { polling: true });

  bot.on('polling_error', (error) => {
    console.error('Telegram polling error:', error.message || error);
  });

  bot.onText(/^(?:\/start|\/help)(?:@\S+)?$/i, async (msg) => {
    const keyboard = {
      reply_markup: {
        inline_keyboard: [[{ text: 'فتح التطبيق', web_app: { url: WEBAPP_URL || 'https://example.com' } }]],
      },
    };

    try {
      await bot.sendMessage(msg.chat.id, 'مرحباً بك في التطبيق. اضغط الزر لفتح الخدمات.', keyboard);
    } catch (error) {
      console.error('Could not send Telegram startup message:', error.message || error);
    }
  });

  bot.setMyCommands([
    { command: 'start', description: 'فتح التطبيق' },
    { command: 'help', description: 'مساعدة' },
  ]).catch((error) => {
    console.error('Unable to set Telegram commands:', error.message || error);
  });
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health endpoint: http://0.0.0.0:${PORT}/health`);
  console.log(`Services endpoint: http://0.0.0.0:${PORT}/api/services`);
});

server.on('error', (error) => {
  console.error('HTTP server error:', error);
  process.exit(1);
});
