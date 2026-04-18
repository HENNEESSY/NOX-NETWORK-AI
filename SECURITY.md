# Security Policy

## 🔐 Секреты и токены

**НИКОГДА не коммитьте реальные секреты в Git!**

### ✅ Правильный способ:

1. **Локально**: создайте `.env` файл (не коммитится в git)
2. **Production**: используйте переменные окружения хостинга

### 📝 Шаблон `.env`:

```env
# Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-key"

# Telegram
TELEGRAM_BOT_TOKEN="your-bot-token"
VITE_BOT_USERNAME="your_bot"
ADMIN_TG_ID="your-admin-id"
VITE_ADMIN_TG_ID="your-admin-id"

# Security (generate with: openssl rand -hex 32)
JWT_SECRET="your-32-char-secret"
CRON_SECRET="your-16-char-secret"

# AI
OPENROUTER_KEY="your-openrouter-key"
FAL_KEY="your-fal-key"
```

### 🔄 Ротация скомпрометированных секретов:

Если токен попал в git:

1. **Отзовите токен** в соответствующем сервисе (Telegram BotFather, Supabase, etc.)
2. **Сгенерируйте новый**
3. **Обновите в хостинге**
4. **Очистите историю git** (если нужно):
   ```bash
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch .env' \
   --prune-empty --tag-name-filter cat -- --all
   ```

### 🛡️ Проверка перед коммитом:

```bash
# Проверьте, что .env в .gitignore
git check-ignore -v .env

# Проверьте нет ли секретов в staged файлах
git diff --cached | grep -i "token\|key\|secret"
```

### 📞 Contact

При обнаружении уязвимости: создайте Issue с меткой `security`
