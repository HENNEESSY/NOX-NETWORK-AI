import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

export const ENV = {
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://mock.supabase.co',
  SUPABASE_KEY: process.env.SUPABASE_KEY || 'mock-key',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  JWT_SECRET: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'nox-dev-secret-key-2026'),
  BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || 'mock_token',
  OPENROUTER_KEY: process.env.OPENROUTER_KEY || 'mock-key',
  ADMIN_CHAT_ID: process.env.ADMIN_CHAT_ID || '',
  ADMIN_TG_ID: Number(process.env.ADMIN_TG_ID) || 123456789,
  NEWS_CHANNEL_ID: process.env.NEWS_CHANNEL_ID || '',
  MARZBAN_URL: process.env.MARZBAN_URL || 'https://marzban.example.com',
  MARZBAN_USERNAME: process.env.MARZBAN_USERNAME || 'admin',
  MARZBAN_PASSWORD: process.env.MARZBAN_PASSWORD || 'admin',
  CRON_SECRET: process.env.CRON_SECRET || '',
  FAL_KEY: process.env.FAL_KEY || '',
  FAL_WEBHOOK_SECRET: process.env.FAL_WEBHOOK_SECRET || '',
  CRYPTO_PAY_TOKEN: process.env.CRYPTO_PAY_TOKEN || '',
  STARS_WEBHOOK_SECRET: process.env.STARS_WEBHOOK_SECRET || '',
  TON_API_URL: process.env.TON_API_URL || 'https://toncenter.com/api/v2',
  TON_API_KEY: process.env.TON_API_KEY || '',
  TON_RECEIVER_ADDRESS: process.env.TON_RECEIVER_ADDRESS || '',
  TON_VERIFICATION_ENABLED: process.env.TON_VERIFICATION_ENABLED === 'true',
  BOT_USERNAME: process.env.VITE_BOT_USERNAME || 'NOX_NETWORK_VPN_bot',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean),
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
};

export const IS_MOCK_DB = ENV.SUPABASE_URL.includes('mock.supabase.co');
export const IS_DEV = ENV.NODE_ENV !== 'production';

// Feature flags for launch phases
export const IS_MOCK_MARZBAN = !ENV.MARZBAN_URL || ENV.MARZBAN_URL.includes('example.com') || process.env.MOCK_MARZBAN === 'true';
export const IS_MOCK_PAYMENTS = !process.env.YOOKASSA_SHOP_ID || process.env.MOCK_PAYMENTS === 'true';
export const IS_AI_ENABLED = !!ENV.OPENROUTER_KEY && ENV.OPENROUTER_KEY !== 'mock-key';
export const IS_FAL_ENABLED = !!ENV.FAL_KEY;

export const supabase = IS_MOCK_DB
  ? createClient(ENV.SUPABASE_URL, ENV.SUPABASE_KEY)
  : createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.SUPABASE_KEY);
