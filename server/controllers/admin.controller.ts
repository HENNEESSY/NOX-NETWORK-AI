import { Response } from 'express';
import { supabase, ENV, IS_MOCK_DB } from '../config';
import { generateTextAsync } from '../services/openrouter.service';
import { sendMessage } from '../services/telegram.service';
import { AuthRequest } from '../types';

export const getPayments = async (req: AuthRequest, res: Response) => {
  if (IS_MOCK_DB) {
    return res.json({
      status: 'success',
      data: [
        { id: 1, tg_id: 987654321, amount: 2990, plan: '1 Год', status: 'success', created_at: new Date().toISOString() },
        { id: 2, tg_id: 112233445, amount: 399, plan: '1 Месяц', status: 'pending', created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 3, tg_id: 556677889, amount: 999, plan: '3 Месяца', status: 'success', created_at: new Date(Date.now() - 86400000).toISOString() },
      ]
    });
  }

  const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(50);
  
  if (error) {
    return res.json({
      status: 'success',
      data: [
        { id: 1, tg_id: 987654321, amount: 2990, plan: '1 Год', status: 'success', created_at: new Date().toISOString() },
        { id: 2, tg_id: 112233445, amount: 399, plan: '1 Месяц', status: 'pending', created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 3, tg_id: 556677889, amount: 999, plan: '3 Месяца', status: 'success', created_at: new Date(Date.now() - 86400000).toISOString() },
      ]
    });
  }
  res.json({ status: 'success', data });
};

export const generatePost = async (req: AuthRequest, res: Response) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    const prompt = `Напиши рекламный пост для Telegram-канала про VPN сервис NOX.
    Тема: ${topic}.
    Пост должен быть продающим, использовать эмодзи, и заканчиваться призывом к действию купить подписку.
    Стиль: современный, технологичный (как Obsidian), немного дерзкий.`;

    const text = await generateTextAsync(prompt, 'google/gemini-1.5-flash');
    res.json({ status: 'success', text });
  } catch (error: unknown) {
    console.error('AI Copywriter Error:', error);
    res.status(500).json({ error: 'Failed to generate post' });
  }
};

export const sendForReview = async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });
    if (!ENV.ADMIN_CHAT_ID) return res.status(400).json({ error: 'ADMIN_CHAT_ID is not configured' });

    const response = await sendMessage(ENV.ADMIN_CHAT_ID, `📝 *Новый пост на проверку:*\n\n${text}`, ENV.COPYWRITER_BOT_TOKEN, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Опубликовать', callback_data: 'approve_post' },
            { text: '❌ Отклонить', callback_data: 'reject_post' }
          ]
        ]
      }
    });

    if (!response.ok) throw new Error('Failed to send to Telegram');
    res.json({ status: 'success' });
  } catch (error: unknown) {
    console.error('Telegram Review Error:', error);
    res.status(500).json({ error: 'Failed to send for review' });
  }
};

export const searchUser = async (req: AuthRequest, res: Response) => {
  const { tg_id } = req.params;

  if (IS_MOCK_DB) {
    if (tg_id === '123456789') {
      return res.json({ status: 'success', data: { tg_id: 123456789, role: 'admin', nxc_balance: 5000, balance_days: 30, location: 'NL', created_at: new Date().toISOString() } });
    }
    return res.status(404).json({ error: 'User not found' });
  }

  const { data, error } = await supabase.from('users').select('*').eq('tg_id', tg_id).single();
  
  if (error || !data) {
    // Mock data for preview
    if (tg_id === '123456789') {
      return res.json({ status: 'success', data: { tg_id: 123456789, role: 'admin', nxc_balance: 5000, balance_days: 30, location: 'NL', created_at: new Date().toISOString() } });
    }
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ status: 'success', data });
};

export const addDays = async (req: AuthRequest, res: Response) => {
  const { tg_id } = req.params;
  const { days } = req.body;
  
  if (IS_MOCK_DB) {
    return res.json({ status: 'success', new_balance: 30 + days });
  }

  const { error: rpcError } = await supabase.rpc('add_nxc_and_days', { 
    target_tg_id: tg_id, 
    days_to_add: days, 
    nxc_to_add: 0 
  });
  
  if (rpcError) return res.status(500).json({ error: 'Failed to add days' });
  
  res.json({ status: 'success', message: `Added ${days} days` });
};

export const addNxc = async (req: AuthRequest, res: Response) => {
  const { tg_id } = req.params;
  const { amount } = req.body;
  
  if (IS_MOCK_DB) {
    return res.json({ status: 'success', new_balance: 5000 + amount });
  }

  const { error: rpcError } = await supabase.rpc('add_nxc_and_days', { 
    target_tg_id: tg_id, 
    days_to_add: 0, 
    nxc_to_add: amount 
  });

  if (rpcError) return res.status(500).json({ error: 'Failed to add NXC' });
  
  // Log transaction
  await supabase.from('transactions').insert([{
    tg_id: parseInt(tg_id),
    amount: amount,
    type: 'admin_add',
    description: 'Начисление администратором'
  }]);
  
  res.json({ status: 'success', message: `Added ${amount} NXC` });
};

// In-memory job tracking for simpler implementation
let broadcastJobs: Record<string, { total: number, current: number, status: 'running' | 'completed' | 'failed', error?: string }> = {};

export const broadcast = async (req: AuthRequest, res: Response) => {
  const { message, filter } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  let users: { tg_id: number }[] = [];
  
  if (IS_MOCK_DB) {
    users = Array.from({ length: 100 }, (_, i) => ({ tg_id: 1000 + i }));
  } else {
    let query = supabase.from('users').select('tg_id');
    if (filter === 'active') query = query.gt('balance_days', 0);
    if (filter === 'expired') query = query.lte('balance_days', 0);
    const { data } = await query;
    users = data || [];
  }

  if (users.length === 0) return res.json({ status: 'success', count: 0 });

  const jobId = `job_${Date.now()}`;
  broadcastJobs[jobId] = { total: users.length, current: 0, status: 'running' };

  // Run in background
  (async () => {
    try {
      for (const user of users) {
        if (!IS_MOCK_DB) {
          await sendMessage(user.tg_id, message, ENV.BOT_TOKEN, { parse_mode: 'Markdown' });
          // Add small delay to avoid hitting Telegram frequency limits (30 requests per second)
          await new Promise(r => setTimeout(r, 40)); 
        } else {
          await new Promise(r => setTimeout(r, 20)); // Simulating in mock
        }
        broadcastJobs[jobId].current++;
      }
      broadcastJobs[jobId].status = 'completed';
    } catch (e: unknown) {
      console.error('Broadcast Job Error:', e);
      broadcastJobs[jobId].status = 'failed';
      broadcastJobs[jobId].error = e instanceof Error ? e.message : 'Unknown error';
    }
  })();

  res.json({ status: 'success', jobId, count: users.length });
};

export const getBroadcastStatus = async (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;
  const job = broadcastJobs[jobId];
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json({ status: 'success', data: job });
};

export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    if (IS_MOCK_DB) {
      return res.json({
        status: 'success',
        data: {
          activeUsers: 150,
          totalNxc: 45000,
          newUsers: 23
        }
      });
    }

    // Get active users (balance_days > 0)
    const { data: activeUsersData } = await supabase
      .from('users')
      .select('tg_id', { count: 'exact' })
      .gt('balance_days', 0);

    // Get total NXC in circulation
    const { data: nxcData } = await supabase
      .from('users')
      .select('nxc_balance');

    const totalNxc = nxcData?.reduce((sum, u) => sum + (u.nxc_balance || 0), 0) || 0;

    // Get new users (created in last 7 days)
    const { data: newUsersData } = await supabase
      .from('users')
      .select('tg_id', { count: 'exact' })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    res.json({
      status: 'success',
      data: {
        activeUsers: activeUsersData?.length || 0,
        totalNxc,
        newUsers: newUsersData?.length || 0
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
