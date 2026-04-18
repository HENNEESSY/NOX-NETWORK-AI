import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import path from 'path';
import { ENV, supabase, IS_MOCK_DB } from './server/config';
import apiRoutes from './server/routes';
import { sendMessage } from './server/services/telegram.service';

// Direct command handler for polling
const handleDirectCommand = async (update: any): Promise<void> => {
  const msg = update.message;
  if (!msg?.text?.startsWith('/')) return;
  
  const chatId = msg.chat.id;
  const text = msg.text;
  const tgId = msg.from?.id;
  const parts = text.split(' ');
  const command = parts[0].toLowerCase();
  
  console.log(`[Bot] Processing command: ${command} from ${tgId}`);
  
  // Check admin
  const isAdmin = tgId === ENV.ADMIN_TG_ID || IS_MOCK_DB;
  if (!isAdmin && !IS_MOCK_DB) {
    const { data } = await supabase.from('users').select('role').eq('tg_id', tgId).single();
    if (data?.role !== 'admin' && data?.role !== 'moderator') {
      await sendMessage(chatId, '⛔ У вас нет прав администратора.', ENV.BOT_TOKEN);
      return;
    }
  }
  
  try {
    switch (command) {
      case '/stats': {
        const { data: users } = await supabase.from('users').select('balance_days, nxc_balance');
        const total = users?.length || 0;
        const active = users?.filter(u => u.balance_days > 0).length || 0;
        const totalNxc = users?.reduce((sum, u) => sum + (u.nxc_balance || 0), 0) || 0;
        
        const message = `📊 Статистика NOX NETWORK:\n\n` +
          `👥 Пользователей: ${total}\n` +
          `🟢 Активных VPN: ${active}\n` +
          `💰 NXC в обороте: ${totalNxc}`;
        await sendMessage(chatId, message, ENV.BOT_TOKEN);
        console.log('[Bot] Stats sent');
        break;
      }
      
      case '/user': {
        if (parts.length < 2) {
          await sendMessage(chatId, 'Использование: /user <tg_id>', ENV.BOT_TOKEN);
          return;
        }
        const targetId = parseInt(parts[1]);
        const { data: user } = await supabase.from('users').select('*').eq('tg_id', targetId).single();
        
        if (!user) {
          await sendMessage(chatId, '❌ Пользователь не найден', ENV.BOT_TOKEN);
          return;
        }
        
        const info = `👤 Пользователь ${user.tg_id}:\n\n` +
          `Роль: ${user.role}\n` +
          `NXC: ${user.nxc_balance}\n` +
          `Дней VPN: ${user.balance_days}\n` +
          `Рефералов: ${user.referral_count}`;
        await sendMessage(chatId, info, ENV.BOT_TOKEN);
        console.log('[Bot] User info sent');
        break;
      }
      
      case '/addnxc': {
        if (parts.length < 3) {
          await sendMessage(chatId, 'Использование: /addnxc <tg_id> <amount>', ENV.BOT_TOKEN);
          return;
        }
        const targetId = parseInt(parts[1]);
        const amount = parseInt(parts[2]);
        await supabase.rpc('add_nxc_and_days', { target_tg_id: targetId, days_to_add: 0, nxc_to_add: amount });
        await sendMessage(chatId, `✅ Добавлено ${amount} NXC пользователю ${targetId}`, ENV.BOT_TOKEN);
        console.log('[Bot] NXC added');
        break;
      }
      
      case '/adddays': {
        if (parts.length < 3) {
          await sendMessage(chatId, 'Использование: /adddays <tg_id> <days>', ENV.BOT_TOKEN);
          return;
        }
        const targetId = parseInt(parts[1]);
        const days = parseInt(parts[2]);
        await supabase.rpc('add_nxc_and_days', { target_tg_id: targetId, days_to_add: days, nxc_to_add: 0 });
        await sendMessage(chatId, `✅ Добавлено ${days} дней пользователю ${targetId}`, ENV.BOT_TOKEN);
        console.log('[Bot] Days added');
        break;
      }
      
      case '/help':
      default: {
        const helpText = `🛠 Команды администратора:\n\n` +
          `/stats - статистика\n` +
          `/user <tg_id> - информация о пользователе\n` +
          `/addnxc <tg_id> <amount> - добавить NXC\n` +
          `/adddays <tg_id> <days> - добавить дни VPN\n` +
          `/help - справка`;
        await sendMessage(chatId, helpText, ENV.BOT_TOKEN);
        console.log('[Bot] Help sent');
        break;
      }
    }
  } catch (err) {
    console.error('[Bot] Command error:', err);
    await sendMessage(chatId, '❌ Ошибка выполнения команды', ENV.BOT_TOKEN);
  }
};

// Simple bot polling for development
let botOffset = 0;
const pollBot = async () => {
  try {
    const res = await fetch(`https://api.telegram.org/bot${ENV.BOT_TOKEN}/getUpdates?offset=${botOffset}&limit=10`);
    const data = await res.json();
    if (data.ok && data.result.length > 0) {
      for (const update of data.result) {
        botOffset = update.update_id + 1;
        const msg = update.message?.text || '';
        console.log(`[Bot] Received: ${msg} from ${update.message?.from?.id}`);
        
        // Handle commands directly
        if (msg.startsWith('/')) {
          await handleDirectCommand(update);
        }
      }
    }
  } catch (e) {
    console.error('[Bot] Polling error:', e);
  }
  setTimeout(pollBot, 2000);
};

const app = express();

app.use(express.json({
  limit: '1mb',
  verify: (req, _res, buf) => {
    (req as express.Request & { rawBody?: string }).rawBody = buf.toString('utf8');
  }
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ENV.NODE_ENV !== 'production') return callback(null, true);

    if (ENV.ALLOWED_ORIGINS.length === 0) {
      return callback(new Error('CORS is not configured'));
    }

    if (ENV.ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Mount all API routes
app.use('/api', apiRoutes);

async function startServer() {
  if (ENV.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    console.log('[Server] Production mode, serving static files from:', distPath);
    console.log('[Server] NODE_ENV:', ENV.NODE_ENV);
    
    // Check if dist folder exists
    try {
      const fs = await import('fs');
      if (!fs.existsSync(distPath)) {
        console.error('[Server] ERROR: dist folder not found at', distPath);
      } else {
        console.log('[Server] dist folder found, contents:', fs.readdirSync(distPath).slice(0, 10));
      }
    } catch (e) {
      console.error('[Server] Error checking dist folder:', e);
    }
    
    // Serve static files with proper fallthrough
    app.use(express.static(distPath, { 
      maxAge: '1y',
      immutable: true,
      fallthrough: true
    }));
    
    // SPA fallback - only for non-file requests
    app.get('*', (req, res, next) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) {
        return next();
      }
      
      const filePath = path.join(distPath, req.path);
      const fs = require('fs');
      
      // If file exists, let express.static handle it
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        return next();
      }
      
      // Otherwise serve index.html for SPA
      res.sendFile(path.join(distPath, 'index.html'), (err) => {
        if (err) {
          console.error('[Server] Error sending index.html:', err);
          res.status(500).send('Server Error');
        }
      });
    });
  }

  const port = Number(ENV.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`NOX NETWORK Secure Server running on port ${port}`);
    
    // Start bot polling in development
    if (ENV.NODE_ENV !== 'production') {
      console.log('[Bot] Starting polling for commands...');
      pollBot();
    }
  });
}

startServer();
