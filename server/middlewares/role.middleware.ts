import { Response, NextFunction } from 'express';
import { supabase, IS_MOCK_DB } from '../config';
import { AuthRequest } from '../types';

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const tg_id = req.user?.tg_id;
  if (!tg_id) return res.status(401).json({ error: 'Unauthorized' });

  if (IS_MOCK_DB) {
    // In mock mode, allow the dev user (tg_id 123456789) as admin
    if (tg_id === 123456789) {
      if (req.user) req.user.role = 'admin';
      return next();
    }
    return res.status(403).json({ error: 'Доступ запрещён: только администраторы' });
  }

  const { data } = await supabase.from('users').select('role').eq('tg_id', tg_id).single();
  if (data && (data.role === 'admin' || data.role === 'moderator')) {
    if (req.user) req.user.role = data.role;
    next();
  } else {
    res.status(403).json({ error: 'Доступ запрещён: только администраторы' });
  }
};
