require('dotenv').config();

const express = require('express');
const path = require('path');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
const configuredWebAppUrl = (process.env.TELEGRAM_WEBAPP_URL || '').trim();
const railwayDomain = (process.env.RAILWAY_PUBLIC_DOMAIN || '').trim();
const WEBAPP_URL = configuredWebAppUrl || (railwayDomain ? `https://${railwayDomain}` : 'https://telegram-mini-app-production-a7ba.up.railway.app');
const SMMCPAN_API_URL = (process.env.SMMCPAN_API_URL || 'https://smmcpan.com/api/v2').trim().replace(/\/$/, '');
const SMMCPAN_API_KEY = (process.env.SMMCPAN_API_KEY || '').trim();
const PRICE_MARKUP = 1.10;

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function providerRequest(data) {
  return axios.post(SMMCPAN_API_URL, { key: SMMCPAN_API_KEY, ...data }, {
    timeout: 20000,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' }
  });
}

function publicService(service) {
  const baseRate = Number(service.rate);
  return {
    service: service.service,
    name: service.name,
    type: service.type,
    category: service.category,
    rate: Number.isFinite(baseRate) ? Number((baseRate * PRICE_MARKUP).toFixed(4)) : service.rate,
    providerRate: service.rate,
    min: service.min,
    max: service.max,
    refill: service.refill,
    cancel: service.cancel
  };
}

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'telegram-mini-app',
    telegramBotConfigured: Boolean(BOT_TOKEN),
    webAppUrlConfigured: Boolean(WEBAPP_URL),
    webAppUrlSource: configuredWebAppUrl ? 'TELEGRAM_WEBAPP_URL' : (railwayDomain ? 'RAILWAY_PUBLIC_DOMAIN' : 'fallback'),
    smmcpanConfigured: Boolean(SMMCPAN_API_KEY),
    markupPercent: 10
  });
});

app.get('/api/config', (req, res) => {
  res.json({ ok: true, markupPercent: 10, smmcpanConfigured: Boolean(SMMCPAN_API_KEY) });
});

app.get('/api/services', async (req, res) => {
  if (!SMMCPAN_API_KEY) return res.status(503).json({ ok: false, message: 'SMMCPAN_API_KEY is not configured.' });
  try {
    const response = await providerRequest({ action: 'services' });
    if (!Array.isArray(response.data)) {
      return res.status(502).json({ ok: false, message: 'Unexpected services response from SMMCPAN.', details: response.data });
    }
    const services = response.data.filter((item) => !item.error).map(publicService);
    res.json({ ok: true, markupPercent: 10, services });
  } catch (error) {
    res.status(502).json({ ok: false, message: 'Unable to load services from SMMCPAN.', details: error.response?.data || error.message });
  }
});

app.get('/api/smmcpan/status', async (req, res) => {
  if (!SMMCPAN_API_KEY) return res.status(503).json({ ok: false, message: 'SMMCPAN_API_KEY is not configured.' });
  try {
    const response = await providerRequest({ action: 'balance' });
    res.json({ ok: true, data: response.data });
  } catch (error) {
    res.status(502).json({ ok: false, message: 'SMMCPAN API request failed.', details: error.response?.data || error.message });
  }
});

// Ordering is intentionally not enabled yet: there is no user payment/credit system.
// This prevents anonymous visitors from spending the provider account balance.
app.post('/api/orders', (req, res) => {
  res.status(501).json({ ok: false, message: 'Ordering is disabled until a payment or user-credit system is added.' });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

if (BOT_TOKEN) {
  const bot = new TelegramBot(BOT_TOKEN, { polling: true });
  bot.on('polling_error', (error) => console.error('Telegram polling error:', error.message));
  bot.on('error', (error) => console.error('Telegram bot error:', error.message));
  bot.setMyCommands([
    { command: 'start', description: 'فتح التطبيق' },
    { command: 'help', description: 'مساعدة' }
  ]).catch((error) => console.error('Unable to set bot commands:', error.message));
  bot.onText(/^\/(start|help)(?:@[^ ]+)?(?:\s|$)/i, async (msg) => {
    const replyMarkup = /^https:\/\//i.test(WEBAPP_URL)
      ? { inline_keyboard: [[{ text: 'فتح التطبيق', web_app: { url: WEBAPP_URL } }]] }
      : undefined;
    const options = replyMarkup ? { parse_mode: 'HTML', reply_markup: replyMarkup } : { parse_mode: 'HTML' };
    const text = replyMarkup ? '<b>مرحباً بك</b>\nاضغط الزر لفتح التطبيق.' : '<b>مرحباً بك</b>\nرابط التطبيق غير صالح.';
    try { await bot.sendMessage(msg.chat.id, text, options); } catch (error) { console.error('Unable to send Telegram message:', error.message); }
  });
  console.log(`Telegram bot polling started. WebApp URL: ${WEBAPP_URL}`);
} else {
  console.warn('TELEGRAM_BOT_TOKEN is missing; the web app will run but the bot will not start.');
}

app.listen(PORT, '0.0.0.0', () => console.log(`Web app listening on port ${PORT}`));
