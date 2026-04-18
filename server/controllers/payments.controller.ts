import { Response } from 'express';
import { AuthRequest } from '../types';
import { ENV, supabase, IS_MOCK_DB } from '../config';
import { createOrUpdateMarzbanUser } from '../services/marzban.service';
import { sendMessage } from '../services/telegram.service';

// Pricing configuration
const SUBSCRIPTION_PRICES: Record<string, number> = {
  '1_month': 399,
  '3_months': 999,
  '6_months': 1990,
  '1_year': 2990,
};

const TOKEN_PACK_PRICES: Record<string, { rub: number; stars: number; nxc: number }> = {
  'pack_100': { rub: 99, stars: 99, nxc: 100 },
  'pack_500': { rub: 399, stars: 399, nxc: 500 },
  'pack_2000': { rub: 1290, stars: 1290, nxc: 2000 },
  'pack_5000': { rub: 2990, stars: 2990, nxc: 5000 },
  'pack_15000': { rub: 7990, stars: 7990, nxc: 15000 },
};

// Generate payment link via Telegram bot
export const generatePaymentLink = async (req: AuthRequest, res: Response) => {
  try {
    const { planId, type, method } = req.body;
    const tg_id = req.user?.tg_id;

    if (!tg_id) return res.status(401).json({ error: 'Unauthorized' });
    if (!planId || !type) return res.status(400).json({ error: 'planId and type are required' });

    if (IS_MOCK_DB) {
      // Mock success
      return res.json({ 
        status: 'success', 
        message: 'Счет отправлен в чат (Mock)',
        invoice_url: 'https://mock-payment.url'
      });
    }

    // Calculate amount
    let amountRub = 0;
    let amountStars = 0;
    let nxcAmount = 0;
    let planName = '';

    if (type === 'subscriptions') {
      amountRub = SUBSCRIPTION_PRICES[planId] || 399;
      planName = planId === '1_month' ? '1 месяц' : 
                 planId === '3_months' ? '3 месяца' :
                 planId === '6_months' ? '6 месяцев' : '1 год';
    } else {
      const pack = TOKEN_PACK_PRICES[planId];
      if (!pack) return res.status(400).json({ error: 'Invalid pack' });
      amountRub = pack.rub;
      amountStars = pack.stars;
      nxcAmount = pack.nxc;
      planName = `${pack.nxc} NXC`;
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([{
        tg_id,
        amount: amountRub,
        plan: planId,
        method: method || 'yookassa',
        status: 'pending'
      }])
      .select()
      .single();

    if (paymentError) {
      console.error('Payment insert error:', paymentError);
      return res.status(500).json({ error: 'Failed to create payment' });
    }

    // Send invoice via Telegram bot
    let invoiceMessage = '';
    if (method === 'stars') {
      invoiceMessage = `💫 Оплата ${planName}\n\nСумма: ${amountStars} ⭐️\n\nНажмите кнопку ниже для оплаты.`;
    } else {
      invoiceMessage = `💳 Оплата ${planName}\n\nСумма: ${amountRub} ₽\nСпособ: ${method === 'ton' ? 'TON' : 'ЮKassa'}\n\nДля оплаты перейдите в Mini App или свяжитесь с поддержкой.`;
    }

    await sendMessage(
      tg_id,
      invoiceMessage,
      ENV.BOT_TOKEN,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '💳 Оплатить', url: `https://t.me/${ENV.BOT_USERNAME}?start=pay_${payment.id}` },
              { text: '❌ Отмена', callback_data: `cancel_pay_${payment.id}` }
            ]
          ]
        }
      }
    );

    res.json({ 
      status: 'success', 
      message: 'Счет отправлен в чат',
      payment_id: payment.id
    });

  } catch (error) {
    console.error('Generate payment error:', error);
    res.status(500).json({ error: 'Failed to generate payment' });
  }
};

// Verify TON payment
export const verifyTonPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { boc, planId, type } = req.body;
    const tg_id = req.user?.tg_id;

    if (!tg_id) return res.status(401).json({ error: 'Unauthorized' });
    if (!boc || !planId) return res.status(400).json({ error: 'boc and planId are required' });

    if (IS_MOCK_DB) {
      return res.json({ status: 'success', message: 'Payment verified (Mock)' });
    }

    // Verify transaction via TON API
    const tonResponse = await fetch(`${ENV.TON_API_URL}/sendBocReturnHash`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ENV.TON_API_KEY && { 'X-API-Key': ENV.TON_API_KEY })
      },
      body: JSON.stringify({ boc })
    });

    if (!tonResponse.ok) {
      return res.status(400).json({ error: 'Invalid TON transaction' });
    }

    const tonData = await tonResponse.json();

    // Process the payment
    const success = await processSuccessfulPayment(tg_id, planId, type, 'ton', boc);

    if (success) {
      res.json({ status: 'success', message: 'Payment verified and processed' });
    } else {
      res.status(500).json({ error: 'Failed to process payment' });
    }

  } catch (error) {
    console.error('TON verification error:', error);
    res.status(500).json({ error: 'Failed to verify TON payment' });
  }
};

// Handle payment webhook from providers
export const handlePaymentWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const { event, object } = req.body;

    // Validate webhook signature for YooKassa (if needed)
    // For now, simple handling

    if (event === 'payment.succeeded' || event === 'payment.captured') {
      const paymentId = object?.metadata?.payment_id;
      const tg_id = object?.metadata?.tg_id;
      const planId = object?.metadata?.plan_id;
      const type = object?.metadata?.type;

      if (paymentId && tg_id && planId) {
        // Update payment status
        await supabase
          .from('payments')
          .update({ 
            status: 'success',
            external_id: object.id 
          })
          .eq('id', paymentId);

        // Process the payment
        await processSuccessfulPayment(parseInt(tg_id), planId, type, 'yookassa', object.id);
      }
    }

    res.json({ status: 'success' });

  } catch (error) {
    console.error('Payment webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Cron job: Notify users about expiring subscriptions
export const cronNotify = async (req: AuthRequest, res: Response) => {
  try {
    // Verify cron secret
    const cronSecret = req.headers['x-cron-secret'];
    if (cronSecret !== ENV.CRON_SECRET) {
      return res.status(401).json({ error: 'Invalid cron secret' });
    }

    if (IS_MOCK_DB) {
      return res.json({ status: 'success', notified: 0, message: 'Mock mode - no notifications sent' });
    }

    // Find users with balance_days <= 3 and > 0
    const { data: expiringUsers, error } = await supabase
      .from('users')
      .select('tg_id, balance_days')
      .lte('balance_days', 3)
      .gt('balance_days', 0);

    if (error) {
      console.error('Cron notify error:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    let notifiedCount = 0;

    for (const user of expiringUsers || []) {
      try {
        await sendMessage(
          user.tg_id,
          `⚠️ Ваша подписка NOX VPN истекает через ${user.balance_days} ${user.balance_days === 1 ? 'день' : user.balance_days < 5 ? 'дня' : 'дней'}!\n\nПродлите сейчас, чтобы не потерять доступ.`,
          ENV.BOT_TOKEN,
          {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔄 Продлить подписку', url: `https://t.me/${ENV.BOT_USERNAME}/app` }]
              ]
            }
          }
        );
        notifiedCount++;
      } catch (e) {
        console.error(`Failed to notify user ${user.tg_id}:`, e);
      }
    }

    res.json({ 
      status: 'success', 
      notified: notifiedCount,
      message: `Notified ${notifiedCount} users about expiring subscriptions`
    });

  } catch (error) {
    console.error('Cron notify error:', error);
    res.status(500).json({ error: 'Cron job failed' });
  }
};

// Helper: Process successful payment
async function processSuccessfulPayment(
  tg_id: number, 
  planId: string, 
  type: string, 
  method: string,
  externalId: string
): Promise<boolean> {
  try {
    if (type === 'subscriptions') {
      // Calculate days
      const days = planId === '1_month' ? 30 :
                   planId === '3_months' ? 90 :
                   planId === '6_months' ? 180 : 365;

      // Create/update Marzban user
      const vlessLink = await createOrUpdateMarzbanUser(tg_id, days);

      // Update user in database
      await supabase.rpc('add_nxc_and_days', {
        target_tg_id: tg_id,
        days_to_add: days,
        nxc_to_add: 0
      });

      // Set vless_link if provided
      if (vlessLink) {
        await supabase
          .from('users')
          .update({ vless_link: vlessLink })
          .eq('tg_id', tg_id);
      }

      // Log transaction
      const price = SUBSCRIPTION_PRICES[planId] || 399;
      await supabase.from('transactions').insert([{
        tg_id,
        amount: -price,
        type: 'subscription',
        description: `Подписка ${planId}`
      }]);

    } else {
      // Token pack
      const pack = TOKEN_PACK_PRICES[planId];
      if (!pack) return false;

      // Add NXC
      await supabase.rpc('add_nxc_and_days', {
        target_tg_id: tg_id,
        days_to_add: 0,
        nxc_to_add: pack.nxc
      });

      // Log transaction
      await supabase.from('transactions').insert([{
        tg_id,
        amount: pack.nxc,
        type: 'token_purchase',
        description: `Покупка ${pack.nxc} NXC`
      }]);
    }

    // Send confirmation
    await sendMessage(
      tg_id,
      `✅ Оплата успешно получена!\n\n${type === 'subscriptions' ? 'Ваша VPN подписка активирована.' : 'NXC начислены на баланс.'}\n\nСпасибо за доверие к NOX NETWORK!`,
      ENV.BOT_TOKEN
    );

    return true;

  } catch (error) {
    console.error('Process payment error:', error);
    return false;
  }
}
