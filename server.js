require('dotenv').config();

const express = require('express');
const path = require('path');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').trim();

// Prefer the Railway variable. Railway may also expose RAILWAY_PUBLIC_DOMAIN.
// The fallback keeps the initial bot usable if TELEGRAM_WEBAPP_URL was omitted.
const configuredWebAppUrl = (process.env.TELEGRAM_WEBAPP_URL || '').trim();
const railwayDomain = (process.env.RAILWAY_PUBLIC_DOMAIN || '').trim();
const WEBAPP_URL = configuredWebAppUrl || (railwayDomain ? `https://${railwayDomain}` : 'https://telegram-mini-app-production-a7ba.up.railway.app');

const SMMCPAN_API_URL = (process.env.SMMCPAN_API_URL || 'https://smmcpan.com/api/v2').trim().replace(/\/$/, '');
const SMMCPAN_API_KEY = (process.env.SMMCPAN_API_KEY || '').trim();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.status(200).json({
    ok: true,
    service: 'telegram-mini-app',
    telegramBotConfigured: Boolean(BOT_TOKEN),
    webAppUrlConfigured: Boolean(WEBAPP_URL),
    webAppUrlSource: configuredWebAppUrl ? 'TELEGRAM_WEBAPP_URL' : (railwayDomain ? 'RAILWAY_PUBLIC_DOMAIN' : 'fallback'),
    smmcpanConfigured: Boolean(SMMCPAN_API_KEY)
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    ok: true,
    telegramBotConfigured: Boolean(BOT_TOKEN),
    webAppUrlConfigured: Boolean(WEBAPP_URL),
    smmcpanConfigured: Boolean(SMMCPAN_API_KEY)
  });
});

app.get('/api/smmcpan/status', async (req, res) => {
  if (!SMMCPAN_API_KEY) {
    return res.status(400).json({ ok: false, message: 'SMMCPAN_API_KEY is not configured.' });
  }

  try {
    const response = await axios.post(SMMCPAN_API_URL, {
      key: SMMCPAN_API_KEY,
      action: 'balance'
    }, { timeout: 15000 });
    return res.json({ ok: true, data: response.data });
  } catch (error) {
    return res.status(502).json({
      ok: false,
      message: 'SMMCPAN API request failed.',
      details: error.response?.data || error.message
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (BOT_TOKEN) {
  const bot = new TelegramBot(BOT_TOKEN, { polling: true });

  bot.on('polling_error', (error) => {
    console.error('Telegram polling error:', error.message);
  });

  bot.on('error', (error) => {
    console.error('Telegram bot error:', error.message);
  });

  bot.setMyCommands([
    { command: 'start', description: 'فتح التطبيق' },
    { command: 'help', description: 'مساعدة' }
  ]).catch((error) => console.error('Unable to set bot commands:', error.message));

  bot.onText(/^\/(start|help)(?:@[^ ]+)?(?:\s|$)/i, async (msg) => {
    const replyMarkup = /^https:\/\//i.test(WEBAPP_URL)
      ? { inline_keyboard: [[{ text: 'فتح التطبيق', web_app: { url: WEBAPP_URL } }]] }
      : undefined;

    const options = replyMarkup ? { parse_mode: 'HTML', reply_markup: replyMarkup } : { parse_mode: 'HTML' };
    const text = replyMarkup
      ? '<b>مرحباً بك</b>\nاضغط الزر لفتح التطبيق.'
      : '<b>مرحباً بك</b>\nرابط التطبيق غير صالح. يجب أن يبدأ بـ https://.';

    try {
      await bot.sendMessage(msg.chat.id, text, options);
    } catch (error) {
      console.error('Unable to send Telegram message:', error.message);
    }
  });

  console.log(`Telegram bot polling started. WebApp URL: ${WEBAPP_URL}`);
} else {
  console.warn('TELEGRAM_BOT_TOKEN is missing; the web app will run but the bot will not start.');
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Web app listening on port ${PORT}`);
  console.log(`WebApp URL: ${WEBAPP_URL}`);
});
