import { Response } from 'express';
import { supabase, IS_MOCK_DB } from '../config';
import { AuthRequest } from '../types';

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const tg_id = req.user?.tg_id;
    if (!tg_id) return res.status(401).json({ error: 'Unauthorized' });

    if (IS_MOCK_DB) {
      return res.json({ 
        status: 'success', 
        data: [
          { id: 1, amount: 500, type: 'purchase', description: 'Покупка NXC', created_at: new Date().toISOString() },
          { id: 2, amount: -15, type: 'ai_image', description: 'Генерация изображения', created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: 3, amount: -5, type: 'ai_text', description: 'Использование ИИ (Gemini)', created_at: new Date(Date.now() - 7200000).toISOString() },
        ] 
      });
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('tg_id', tg_id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Fetch transactions error:', JSON.stringify(error, null, 2));
      const isMissingTable = error.message?.includes('Could not find the table') || error.code === '42P01';
      const errorMessage = isMissingTable 
        ? 'Таблица transactions не найдена. Выполните SQL из supabase/schema.sql'
        : `Failed to fetch transaction history: ${error.message}`;
      return res.status(500).json({ error: errorMessage });
    }

    res.json({ status: 'success', data: data || [] });
  } catch (error) {
    console.error('Fetch transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
};

export const getTopAmbassadors = async (req: AuthRequest, res: Response) => {
  try {
    if (IS_MOCK_DB) {
      return res.json({
        status: 'success',
        data: [
          { tg_id: 111, name: "@alex_vortex", referral_count: 154, ambassador_points: 15400 },
          { tg_id: 222, name: "@serg_nox", referral_count: 89, ambassador_points: 8900 },
          { tg_id: 333, name: "@kristina_vpn", referral_count: 72, ambassador_points: 7200 },
          { tg_id: 444, name: "@mikhail_dev", referral_count: 45, ambassador_points: 4500 },
          { tg_id: 555, name: "@nox_fan", referral_count: 38, ambassador_points: 3800 },
        ]
      });
    }

    const { data, error } = await supabase
      .from('users')
      .select('tg_id, referral_count, ambassador_points')
      .order('ambassador_points', { ascending: false })
      .limit(10);

    if (error) throw error;

    res.json({ status: 'success', data: data || [] });
  } catch (error: any) {
    console.error('Fetch ambassadors error:', JSON.stringify(error, null, 2));
    const isMissingTable = error.message?.includes('Could not find the table') || error.code === '42P01';
    const errorMessage = isMissingTable 
      ? 'Таблица users не найдена в Supabase. Выполните SQL из supabase/schema.sql'
      : `Failed to fetch ranking: ${error.message}`;
    res.status(500).json({ error: errorMessage });
  }
};

export const getRank = async (req: AuthRequest, res: Response) => {
  try {
    const tg_id = req.user?.tg_id;
    if (!tg_id) return res.status(401).json({ error: 'Unauthorized' });

    if (IS_MOCK_DB) {
      return res.json({ status: 'success', data: { rank: 42, total: 1000 } });
    }

    const { data, error } = await supabase.rpc('get_user_rank', { user_tg_id: tg_id });
    if (error) {
      console.error('Fetch rank error detail:', JSON.stringify(error, null, 2));
      const isMissingFunction = error.message?.includes('function') && error.message?.includes('does not exist');
      const errorMessage = isMissingFunction 
        ? 'Функция get_user_rank не найдена в Supabase. Выполните SQL из supabase/schema.sql'
        : `Failed to fetch rank: ${error.message}`;
      return res.status(500).json({ error: errorMessage });
    }

    res.json({ status: 'success', data: data });
  } catch (error) {
    console.error('Fetch rank error:', error);
    res.status(500).json({ error: 'Failed to fetch rank' });
  }
};

export const enterGiveaway = async (req: AuthRequest, res: Response) => {
  try {
    const tg_id = req.user?.tg_id;
    const { giveaway_id } = req.body;
    
    if (!tg_id) return res.status(401).json({ error: 'Unauthorized' });
    if (!giveaway_id) return res.status(400).json({ error: 'Giveaway ID is required' });

    if (IS_MOCK_DB) {
      return res.json({ status: 'success', message: 'Вы успешно записаны на розыгрыш! (Mock)' });
    }

    const { error } = await supabase.from('giveaway_entries').insert([{ tg_id, giveaway_id }]);
    
    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Вы уже участвуете в этом розыгрыше' });
      }
      throw error;
    }

    res.json({ status: 'success', message: 'Вы успешно записаны на розыгрыш!' });
  } catch (error) {
    console.error('Enter giveaway error:', error);
    res.status(500).json({ error: 'Не удалось записаться на розыгрыш' });
  }
};

export const toggleAutoRefill = async (req: AuthRequest, res: Response) => {
  try {
    const tg_id = req.user?.tg_id;
    const { enabled } = req.body;
    
    if (!tg_id) return res.status(401).json({ error: 'Unauthorized' });

    if (IS_MOCK_DB) {
      return res.json({ status: 'success', auto_refill: enabled });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ auto_refill: enabled })
      .eq('tg_id', tg_id)
      .select('auto_refill')
      .single();

    if (error) throw error;

    res.json({ status: 'success', data });
  } catch (error) {
    console.error('Toggle auto-refill error:', error);
    res.status(500).json({ error: 'Не удалось обновить настройку автопродления' });
  }
};
