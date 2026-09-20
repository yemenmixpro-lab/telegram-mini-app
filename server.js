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

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function providerRequest(data) {
  return axios.post(SMMCPAN_API_URL, { key: SMMCPAN_API_KEY, ...data }, {
    timeout: 20000,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' }
  });
}

function publicService(service) {
  return {
    service: service.service,
    name: service.name || 'خدمة بدون اسم',
    type: service.type || '',
    category: service.category || 'عام',
    rate: service.rate,
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
    smmcpanConfigured: Boolean(SMMCPAN_API_KEY),
    servicesEndpoint: '/api/services'
  });
});

app.get('/api/config', (req, res) => {
  res.json({ ok: true, smmcpanConfigured: Boolean(SMMCPAN_API_KEY) });
});

// Read-only integration test: retrieves the real service list from SMMCPAN.
app.get('/api/services', async (req, res) => {
  if (!SMMCPAN_API_KEY) {
    return res.status(503).json({ ok: false, message: 'SMMCPAN_API_KEY is not configured in Railway.' });
  }

  try {
    const response = await providerRequest({ action: 'services' });
    const providerServices = Array.isArray(response.data)
      ? response.data
      : (Array.isArray(response.data?.services) ? response.data.services : null);

    if (!providerServices) {
      return res.status(502).json({ ok: false, message: 'Unexpected services response from SMMCPAN.', details: response.data });
    }

    return res.json({
      ok: true,
      source: 'SMMCPAN',
      count: providerServices.length,
      services: providerServices.filter((item) => item && !item.error).map(publicService)
    });
  } catch (error) {
    return res.status(502).json({
      ok: false,
      message: 'Unable to load services from SMMCPAN.',
      details: error.response?.data || error.message
    });
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

// Deliberately disabled: this phase is read-only and cannot spend provider balance.
app.post('/api/orders', (req, res) => {
  res.status(501).json({ ok: false, message: 'Ordering is disabled in the connection-test phase.' });
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
