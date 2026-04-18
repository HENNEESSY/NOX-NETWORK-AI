# NOX NETWORK - Настройка окружения

## Как заполнить .env файл

### 1. Supabase (ОБЯЗАТЕЛЬНО)
```env
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_KEY="your-supabase-service-role-key"
```

### 2. Telegram
```env
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
VITE_BOT_USERNAME="your_bot_username"
ADMIN_CHAT_ID="your-admin-chat-id"
ADMIN_TG_ID="your-admin-telegram-id"
VITE_ADMIN_TG_ID="your-admin-telegram-id"
```

### 3. Безопасность (СГЕНЕРИРУЙТЕ!)
Выполните в терминале:
```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('CRON_SECRET=' + require('crypto').randomBytes(16).toString('hex'))"
```

### 4. AI API Ключи
- OpenRouter: https://openrouter.ai/keys
- Fal.ai: https://fal.ai/dashboard/keys

### 5. TON (опционально)
```env
VITE_TON_RECEIVER_ADDRESS="EQ...your-ton-wallet"
TON_API_KEY="your-toncenter-api-key"
```

## Загрузка в Supabase

1. Откройте Supabase Dashboard
2. Перейдите в SQL Editor
3. Выполните содержимое файла `supabase/init.sql`
4. Готово!
