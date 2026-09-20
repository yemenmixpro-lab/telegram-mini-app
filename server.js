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
const SERVICES_CACHE_MS = 5 * 60 * 1000;

let servicesCache = { expiresAt: 0, services: [] };
let servicesRequest = null;

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h' }));

function numericValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeService(rawService) {
  if (!rawService || typeof rawService !== 'object') return null;

  const service = rawService.service ?? rawService.service_id ?? rawService.id ?? rawService.serviceId;
  if (service === undefined || service === null || String(service).trim() === '') return null;

  return {
    service: String(service),
    name: String(rawService.name || rawService.title || rawService.service_name || 'خدمة بدون اسم'),
    category: String(rawService.category || rawService.category_name || rawService.type || 'عام'),
    price: numericValue(rawService.price ?? rawService.rate ?? rawService.cost ?? rawService.original_price),
    min: numericValue(rawService.min ?? rawService.minimum ?? rawService.min_amount),
    max: numericValue(rawService.max ?? rawService.maximum ?? rawService.max_amount)
  };
}

function extractServices(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.services)) return payload.services;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

async function requestServices() {
  if (Date.now() < servicesCache.expiresAt) return servicesCache.services;
  if (servicesRequest) return servicesRequest;

  servicesRequest = axios.post(
    SMMCPAN_API_URL,
    { action: 'services', key: SMMCPAN_API_KEY },
    {
      timeout: 20000,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      validateStatus: (status) => status >= 200 && status < 300
    }
  ).then(({ data }) => {
    const services = extractServices(data).map(normalizeService).filter(Boolean);
    servicesCache = { services, expiresAt: Date.now() + SERVICES_CACHE_MS };
    return services;
  }).finally(() => {
    servicesRequest = null;
  });

  return servicesRequest;
}

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    app: 'telegram-mini-app',
    telegramBotConfigured: Boolean(BOT_TOKEN),
    telegramWebAppConfigured: Boolean(WEBAPP_URL),
    smmcpanConfigured: Boolean(SMMCPAN_API_KEY),
    cachedServices: servicesCache.services.length,
    servicesEndpoint: '/api/services'
  });
});

app.get('/api/services', async (_req, res) => {
  if (!SMMCPAN_API_KEY) {
    return res.status(503).json({ ok: false, message: 'SMMCPAN_API_KEY غير مضبوط في Railway.' });
  }

  try {
    const services = await requestServices();
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    return res.json({ ok: true, source: 'SMMCPAN', count: services.length, services });
  } catch (error) {
    console.error('SMMCPAN services error:', error.response?.data || error.message);
    return res.status(502).json({ ok: false, message: 'تعذر تحميل الخدمات من SMMCPAN حاليًا.' });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (BOT_TOKEN && WEBAPP_URL) {
  const bot = new TelegramBot(BOT_TOKEN, { polling: true });
  bot.on('polling_error', (error) => console.error('Telegram polling error:', error.message));
  bot.onText(/^\/(start|help)(?:@[^\s]+)?$/i, async (msg) => {
    try {
      await bot.sendMessage(msg.chat.id, '<b>مرحبًا بك في SMMCPAN</b>\nافتح التطبيق لاستعراض الخدمات المتاحة.', {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [[{ text: 'فتح التطبيق', web_app: { url: WEBAPP_URL } }]] }
      });
    } catch (error) {
      console.error('Telegram message error:', error.message);
    }
  });
  console.log('Telegram bot polling started.');
} else {
  console.warn('Telegram bot is disabled until TELEGRAM_BOT_TOKEN and TELEGRAM_WEBAPP_URL are configured.');
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mini app listening on 0.0.0.0:${PORT}`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});
