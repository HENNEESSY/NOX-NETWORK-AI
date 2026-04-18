import { Request } from 'express';

export interface User {
  id?: number;
  tg_id: number;
  role: 'user' | 'moderator' | 'admin';
  balance_days: number;
  nxc_balance: number;
  vless_link?: string;
  location?: string;
  created_at?: string;
}

export interface AuthRequest extends Request {
  user?: {
    tg_id: number;
    role?: string;
  };
  body: Record<string, unknown>;
}
