import { Request, Response } from 'express';
import crypto from 'crypto';
import { ENV, IS_MOCK_DB, supabase } from '../config';
import { sendMessage, editMessageText, answerCallbackQuery } from '../services/telegram.service';
import sharp from 'sharp';

const IMAGE_PRICES: Record<string, number> = {
  'seedream_4_0': 15,
  qwen: 20,
  nano_banana: 35,
  nano_banana_pro: 50,
  kling_o3: 80,
};

const getFalSignature = (req: Request): string => {
  const header = req.headers['x-fal-signature'] || req.headers['fal-webhook-signature'];
  return typeof header === 'string' ? header : '';
};

const verifyFalWebhookSignature = (payload: string, signature: string): boolean => {
  if (!ENV.FAL_WEBHOOK_SECRET) return false;

  const expectedSig = crypto
    .createHmac('sha256', ENV.FAL_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return signature === expectedSig;
};

const fetchImageAsBuffer = async (imageUrl: string): Promise<ArrayBuffer> => {
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) {
    throw new Error(`Failed to download image: ${imageRes.status}`);
  }
  return imageRes.arrayBuffer();
};

const buildWatermarkedImage = async (imageBuffer: ArrayBuffer): Promise<Buffer> => {
  const watermarkSvg = `
    <svg width="200" height="80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.8"/>
        </filter>
      </defs>
      <g filter="url(#shadow)" transform="translate(20, 20)">
        <path d="M 10 5 L 14 15 L 24 19 L 14 23 L 10 33 L 6 23 L -4 19 L 6 15 Z" fill="rgba(255,255,255,0.95)" />
        <text x="34" y="25" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="rgba(255,255,255,0.95)" font-weight="800" letter-spacing="1">NOX AI</text>
      </g>
    </svg>
  `;

  return sharp(Buffer.from(imageBuffer))
    .composite([{ input: Buffer.from(watermarkSvg), gravity: 'southeast' }])
    .jpeg({ quality: 95 })
    .toBuffer();
};

export const handleFalWebhook = async (req: Request, res: Response) => {
  try {
    const rawBody = (req as Request & { rawBody?: string }).rawBody || JSON.stringify(req.body);
    const signature = getFalSignature(req);

    if (ENV.NODE_ENV === 'production') {
      const isValidSignature = verifyFalWebhookSignature(rawBody, signature);
      if (!isValidSignature) {
        return res.status(401).json({ error: 'Неверная подпись webhook' });
      }
    }

    const payload = req.body as {
      status?: string;
      request_id?: string;
      payload?: { images?: Array<{ url?: string }> };
      error?: string;
    };

    const request_id = payload.request_id;
    if (!request_id) {
      return res.status(400).json({ error: 'Отсутствует request_id' });
    }

    if (IS_MOCK_DB) {
      return res.json({ status: 'success' });
    }

    const { data: historyItem, error: historyError } = await supabase
      .from('ai_history')
      .select('tg_id, model, result')
      .eq('request_id', request_id)
      .single();

    if (historyError || !historyItem) {
      return res.status(404).json({ error: 'История генерации не найдена' });
    }

    if (payload.status === 'OK' && payload.payload?.images?.[0]?.url) {
      const imageUrl = payload.payload.images[0].url;

      await supabase
        .from('ai_history')
        .update({ result: imageUrl })
        .eq('request_id', request_id)
        .eq('result', 'pending');

      const imageBuffer = await fetchImageAsBuffer(imageUrl);
      const watermarkedBuffer = await buildWatermarkedImage(imageBuffer);

      const formData = new FormData();
      formData.append('chat_id', String(historyItem.tg_id));
      formData.append('photo', new Blob([watermarkedBuffer], { type: 'image/jpeg' }), 'image.jpg');
      formData.append('caption', '🎨 Ваше изображение готово!');

      await fetch(`https://api.telegram.org/bot${ENV.BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        body: formData,
      });
    } else {
      await supabase
        .from('ai_history')
        .update({ result: 'failed' })
        .eq('request_id', request_id)
        .eq('result', 'pending');

      const refundAmount = IMAGE_PRICES[historyItem.model] || 20;
      await supabase.rpc('add_nxc_and_days', {
        target_tg_id: historyItem.tg_id,
        days_to_add: 0,
        nxc_to_add: refundAmount,
      });

      await supabase.from('transactions').insert([{
        tg_id: historyItem.tg_id,
        amount: refundAmount,
        type: 'ai_refund',
        description: `Возврат NXC: ошибка генерации (${historyItem.model})`,
      }]);

      await sendMessage(
        historyItem.tg_id,
        `❌ Ошибка при генерации изображения. ${refundAmount} NXC автоматически возвращены на баланс.`,
        ENV.BOT_TOKEN
      );
    }

    return res.json({ status: 'success' });
  } catch (error) {
    console.error('Fal Webhook Error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Admin command handlers
const isAdmin = async (tgId: number): Promise<boolean> => {
  if (tgId === ENV.ADMIN_TG_ID) return true;
  if (IS_MOCK_DB) return true;
  
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('tg_id', tgId)
    .single();
  
  return data?.role === 'admin' || data?.role === 'moderator';
};

const handleAdminCommand = async (msg: any): Promise<void> => {
  const chatId = msg.chat.id;
  const text = msg.text || '';
  const tgId = msg.from?.id;
  
  if (!tgId || !(await isAdmin(tgId))) {
    await sendMessage(chatId, '⛔ У вас нет прав администратора.', ENV.BOT_TOKEN);
    return;
  }
  
  const parts = text.split(' ');
  const command = parts[0].toLowerCase();
  
  switch (command) {
    case '/stats': {
      const { data: stats } = await supabase.rpc('get_detailed_stats');
      const message = `📊 *Статистика NOX NETWORK*

` +
        `👥 Пользователей: ${stats?.total_users || 0}\n` +
        `🟢 Активных: ${stats?.active_users || 0}\n` +
        `💰 NXC в обороте: ${stats?.total_nxc || 0}\n` +
        `📅 Новых за 24ч: ${stats?.new_users_24h || 0}`;
      await sendMessage(chatId, message, ENV.BOT_TOKEN, { parse_mode: 'Markdown' });
      break;
    }
    
    case '/user': {
      if (parts.length < 2) {
        await sendMessage(chatId, 'Использование: /user <tg_id>', ENV.BOT_TOKEN);
        return;
      }
      const targetId = parseInt(parts[1]);
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('tg_id', targetId)
        .single();
      
      if (!user) {
        await sendMessage(chatId, '❌ Пользователь не найден', ENV.BOT_TOKEN);
        return;
      }
      
      const msg = `👤 *Пользователь ${user.tg_id}*\n\n` +
        `Роль: ${user.role}\n` +
        `NXC: ${user.nxc_balance}\n` +
        `Дней: ${user.balance_days}\n` +
        `Рефералов: ${user.referral_count}`;
      await sendMessage(chatId, msg, ENV.BOT_TOKEN, { parse_mode: 'Markdown' });
      break;
    }
    
    case '/addnxc': {
      if (parts.length < 3) {
        await sendMessage(chatId, 'Использование: /addnxc <tg_id> <amount>', ENV.BOT_TOKEN);
        return;
      }
      const targetId = parseInt(parts[1]);
      const amount = parseInt(parts[2]);
      
      await supabase.rpc('add_nxc_and_days', {
        target_tg_id: targetId,
        days_to_add: 0,
        nxc_to_add: amount
      });
      
      await sendMessage(chatId, `✅ Добавлено ${amount} NXC пользователю ${targetId}`, ENV.BOT_TOKEN);
      break;
    }
    
    case '/adddays': {
      if (parts.length < 3) {
        await sendMessage(chatId, 'Использование: /adddays <tg_id> <days>', ENV.BOT_TOKEN);
        return;
      }
      const targetId = parseInt(parts[1]);
      const days = parseInt(parts[2]);
      
      await supabase.rpc('add_nxc_and_days', {
        target_tg_id: targetId,
        days_to_add: days,
        nxc_to_add: 0
      });
      
      await sendMessage(chatId, `✅ Добавлено ${days} дней пользователю ${targetId}`, ENV.BOT_TOKEN);
      break;
    }
    
    case '/help':
    default: {
      const helpText = `🛠 *Команды администратора:*\n\n` +
        `/stats - статистика\n` +
        `/user <tg_id> - информация о пользователе\n` +
        `/addnxc <tg_id> <amount> - добавить NXC\n` +
        `/adddays <tg_id> <days> - добавить дни VPN\n` +
        `/help - справка`;
      await sendMessage(chatId, helpText, ENV.BOT_TOKEN, { parse_mode: 'Markdown' });
      break;
    }
  }
};

export const handleTelegramEditorWebhook = async (req: Request, res: Response) => {
  try {
    const { callback_query, message } = req.body;

    // Handle admin commands from messages
    if (message && message.text?.startsWith('/')) {
      await handleAdminCommand(message);
      return res.json({ status: 'success' });
    }

    if (callback_query) {
      const chatId = callback_query.message.chat.id;
      const messageId = callback_query.message.message_id;
      const action = callback_query.data;

      const originalText = callback_query.message.text.replace('📝 Новый пост на проверку:\n\n', '');

      if (action === 'approve_post') {
        if (ENV.NEWS_CHANNEL_ID) {
          await sendMessage(ENV.NEWS_CHANNEL_ID, originalText, ENV.BOT_TOKEN);
        }

        await editMessageText(chatId, messageId, `✅ *Пост опубликован!*\n\n${originalText}`, ENV.BOT_TOKEN, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [] },
        });
      } else if (action === 'reject_post') {
        await editMessageText(chatId, messageId, `❌ *Пост отклонен.*\n\n~${originalText}~`, ENV.BOT_TOKEN, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [] },
        });
      }

      await answerCallbackQuery(callback_query.id, ENV.BOT_TOKEN);
    }

    return res.json({ status: 'success' });
  } catch (error) {
    console.error('Telegram Webhook Error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};
