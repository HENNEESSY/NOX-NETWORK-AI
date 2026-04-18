import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { ENV, supabase, IS_MOCK_DB, IS_DEV } from '../config';
import { validateTelegramWebAppData } from '../services/telegram.service';
import { createOrUpdateMarzbanUser } from '../services/marzban.service';
import { AuthRequest } from '../types';

export const login = (req: AuthRequest, res: Response) => {
  if (!ENV.JWT_SECRET) {
    console.error('[AUTH] JWT_SECRET is not set. Refusing to issue tokens.');
    return res.status(500).json({ error: 'Сервер не настроен: отсутствует JWT_SECRET' });
  }

  const { initData } = req.body;

  // Mock auth is only allowed in development mode
  if ((!initData || initData === 'mock') && IS_DEV) {
    const token = jwt.sign({ tg_id: 123456789 }, ENV.JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token });
  }

  if (!initData || initData === 'mock') {
    // Fallback: use admin ID from env or reject
    if (!ENV.ADMIN_TG_ID || ENV.ADMIN_TG_ID === 123456789) {
      return res.status(401).json({ error: 'Требуется авторизация через Telegram' });
    }
    console.log('[AUTH] Using fallback auth for admin:', ENV.ADMIN_TG_ID);
    const token = jwt.sign({ tg_id: ENV.ADMIN_TG_ID }, ENV.JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, fallback: true });
  }

  const user = validateTelegramWebAppData(initData);
  if (!user) return res.status(401).json({ error: 'Неверные данные Telegram (попытка подмены)' });

  const token = jwt.sign({ tg_id: user.id }, ENV.JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  const tg_id = req.user?.tg_id;
  if (!tg_id) return res.status(401).json({ error: 'Unauthorized' });

  if (IS_MOCK_DB) {
    const vlessLink = await createOrUpdateMarzbanUser(tg_id, 3);
    return res.json({
      status: 'success',
      data: {
        tg_id,
        balance_days: 3,
        nxc_balance: 5000,
        role: 'user',
        vless_link: vlessLink,
        created_at: new Date().toISOString()
      }
    });
  }

  const { data, error } = await supabase.from('users').select('*').eq('tg_id', tg_id).single();
  
  if (error || !data) {
    const vlessLink = await createOrUpdateMarzbanUser(tg_id, 3);
    const { data: newUser, error: createError } = await supabase.from('users').insert([{ 
      tg_id, 
      balance_days: 3, 
      nxc_balance: 100, // 100 NXC Sign up bonus
      role: 'user',
      vless_link: vlessLink
    }]).select().single();
    
    if (createError) {
      console.error('Supabase create error:', JSON.stringify(createError, null, 2));
      const isMissingTable = createError.message?.includes('Could not find the table') || createError.code === '42P01';
      const errorMessage = isMissingTable 
        ? 'Таблицы не созданы в Supabase. Откройте SQL Editor в Supabase и выполните содержимое файла supabase/schema.sql'
        : `Error creating user: ${createError.message || 'Unknown'}`;
      return res.status(500).json({ error: errorMessage });
    }
    return res.json({ status: 'success', data: newUser });
  }
  
  res.json({ status: 'success', data });
};

export const registerReferral = async (req: AuthRequest, res: Response) => {
  const new_user_id = req.user?.tg_id;
  if (!new_user_id) return res.status(401).json({ error: 'Unauthorized' });

  const { referrer_id } = req.body;

  if (new_user_id === Number(referrer_id)) {
    return res.status(400).json({ status: 'error', message: 'You cannot refer yourself' });
  }

  if (IS_MOCK_DB) {
    return res.json({ status: 'success', message: 'Bonus applied to both users! (Mock)' });
  }

  try {
    const { data: check } = await supabase.from('users').select('tg_id').eq('tg_id', new_user_id).single();
    if (check) return res.json({ status: 'error', message: 'User already registered' });

    // The trigger tr_after_user_insert handles the increment and bonus for the referrer
    const { error: insertError } = await supabase.from('users').insert([{ 
      tg_id: new_user_id, 
      referred_by: referrer_id, 
      balance_days: 7 // 7 days gift for the new user (as per NOX context)
    }]);

    if (insertError) throw insertError;

    res.json({ status: 'success', message: 'Welcome to NOX! You received 7 days of premium.' });
  } catch (error: unknown) {
    console.error('Referral error:', JSON.stringify(error, null, 2));
    const msg = error instanceof Error ? error.message : 'Unknown error';
    const code = (error as { code?: string })?.code;
    const isMissingTable = msg.includes('Could not find the table') || code === '42P01';
    const errorMessage = isMissingTable 
      ? 'Таблица users не найдена в Supabase. Выполните SQL из supabase/schema.sql'
      : `Referral error: ${msg}`;
    res.status(500).json({ status: 'error', message: errorMessage });
  }
};
