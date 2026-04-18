import crypto from 'crypto';
import { ENV } from '../config';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export function validateTelegramWebAppData(initData: string): TelegramUser | null {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  if (!hash) return null;
  
  urlParams.delete('hash');
  urlParams.sort();

  let dataCheckString = '';
  for (const [key, value] of urlParams.entries()) {
    dataCheckString += `${key}=${value}\n`;
  }
  dataCheckString = dataCheckString.slice(0, -1);

  const secret = crypto.createHmac('sha256', 'WebAppData').update(ENV.BOT_TOKEN).digest();
  const calculatedHash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

  if (calculatedHash === hash) {
    const userStr = urlParams.get('user');
    return userStr ? JSON.parse(userStr) as TelegramUser : null;
  }
  return null;
}

export async function sendMessage(chatId: string | number, text: string, botToken: string = ENV.BOT_TOKEN, options: Record<string, unknown> = {}) {
  try {
    console.log(`[Telegram] Sending message to ${chatId}: ${text.substring(0, 50)}...`);
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...options
      })
    });
    const data = await res.json();
    if (!data.ok) {
      console.error('[Telegram] Send failed:', data.description);
    } else {
      console.log('[Telegram] Message sent successfully');
    }
    return data;
  } catch (err) {
    console.error('[Telegram] Send error:', err);
    throw err;
  }
}

export async function editMessageText(chatId: string | number, messageId: number, text: string, botToken: string = ENV.BOT_TOKEN, options: Record<string, unknown> = {}) {
  return fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      ...options
    })
  });
}

export async function answerCallbackQuery(callbackQueryId: string, botToken: string = ENV.BOT_TOKEN) {
  return fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId })
  });
}
