# NOX NETWORK v2.5 - Инструкция по развёртыванию

## 1. Подготовка окружения

### Сгенерируйте секреты (выполните в терминале):
```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('CRON_SECRET=' + require('crypto').randomBytes(16).toString('hex'))"
```

### Заполните .env файл:
```env
# Supabase (из Dashboard -> Settings -> API)
SUPABASE_URL="https://xxxxxx.supabase.co"
SUPABASE_KEY="eyJ..."  # service_role key

# Telegram
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
ADMIN_CHAT_ID="your-admin-chat-id"
ADMIN_TG_ID="your-admin-telegram-id"
COPYWRITER_BOT_TOKEN="..."  # Для админ-бота

# Сгенерированные секреты
JWT_SECRET="..."  # 64 hex chars
CRON_SECRET="..."  # 32 hex chars

# AI API Keys
OPENROUTER_KEY="sk-or-v1-..."
FAL_KEY="..."
FAL_WEBHOOK_SECRET="..."
```

## 2. Настройка Supabase

### Шаг 1: Создайте проект
1. Перейдите на https://supabase.com
2. Создайте новый проект
3. Запомните URL и anon/service_role ключи

### Шаг 2: Выполните SQL скрипт
1. В Supabase Dashboard перейдите в SQL Editor
2. Создайте New Query
3. Вставьте содержимое файла `supabase/init.sql`
4. Нажмите Run

### Шаг 3: Создайте администратора
В SQL Editor выполните:
```sql
INSERT INTO users (tg_id, role, balance_days, nxc_balance) 
VALUES (YOUR_ADMIN_TG_ID, 'admin', 365, 10000)
ON CONFLICT (tg_id) DO UPDATE SET role = 'admin';
```

## 3. Запуск приложения

### Локально:
```bash
npm install
npm run dev
```

### Продакшн:
```bash
npm install
npm run build
npm start
```

## 4. Настройка Telegram Bot

### Webhook для основного бота:
```
POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook
{
  "url": "https://your-domain.com/api/webhook/telegram-editor"
}
```

### Для Admin Bot (polling):
Admin bot автоматически запускается при старте сервера и использует polling.

## 5. Fal.ai Webhook

Настройте в Fal Dashboard:
```
Webhook URL: https://your-domain.com/api/webhook/fal
Secret: YOUR_FAL_WEBHOOK_SECRET
```

## 6. Проверка работы

Откройте Mini App:
```
https://t.me/NOX_NETWORK_VPN_bot/app
```

Или напишите боту /start для получения ссылки.

## Проблемы?

Проверьте логи:
```bash
# Локально
npm run dev

# Продакшн (Cloud Run)
gcloud logs read service/your-service-name --limit=50
```
