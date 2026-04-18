import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { rateLimit } from '../middlewares/rateLimit.middleware';
import * as authController from '../controllers/auth.controller';
import * as adminController from '../controllers/admin.controller';
import * as paymentsController from '../controllers/payments.controller';
import * as aiController from '../controllers/ai.controller';
import * as webhookController from '../controllers/webhook.controller';
import * as userController from '../controllers/user.controller';

const router = Router();

// Auth & User
router.post('/auth', authController.login);
router.get('/user', authenticate, authController.getUserProfile);
router.get('/user/transactions', authenticate, userController.getTransactions);
router.get('/user/rank', authenticate, userController.getRank);
router.get('/user/ambassadors', authenticate, userController.getTopAmbassadors);
router.post('/user/giveaway/enter', authenticate, userController.enterGiveaway);
router.post('/user/toggle-auto-refill', authenticate, userController.toggleAutoRefill);
router.post('/referral/register', authenticate, authController.registerReferral);

// Admin
router.get('/admin/payments', authenticate, requireAdmin, adminController.getPayments);
router.get('/admin/stats', authenticate, requireAdmin, adminController.getStats);
router.post('/admin/generate-post', authenticate, requireAdmin, adminController.generatePost);
router.post('/admin/send-for-review', authenticate, requireAdmin, adminController.sendForReview);
router.get('/admin/users/:tg_id', authenticate, requireAdmin, adminController.searchUser);
router.post('/admin/users/:tg_id/add-days', authenticate, requireAdmin, adminController.addDays);
router.post('/admin/users/:tg_id/add-nxc', authenticate, requireAdmin, adminController.addNxc);
router.post('/admin/broadcast', authenticate, requireAdmin, adminController.broadcast);
router.get('/admin/broadcast/status/:jobId', authenticate, requireAdmin, adminController.getBroadcastStatus);

// Payments & Cron
router.post('/pay', authenticate, paymentsController.generatePaymentLink);
router.post('/payments/verify-ton', authenticate, paymentsController.verifyTonPayment);
router.post('/webhook/payment', paymentsController.handlePaymentWebhook);
router.post('/cron/notify', authenticate, requireAdmin, paymentsController.cronNotify);

// AI (rate limited: 20 text/min, 10 image/min)
router.post('/chat', authenticate, rateLimit(20, 60_000), aiController.chatCopilot);
router.post('/generate-image', authenticate, rateLimit(10, 60_000), aiController.generateImage);
router.get('/ai/history', authenticate, aiController.getHistory);

// Telegram Webhooks
router.post('/webhook/telegram-editor', webhookController.handleTelegramEditorWebhook);
router.post('/webhook/fal', webhookController.handleFalWebhook);

export default router;
