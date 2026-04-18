import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory rate limiter (per tg_id, sliding window)
const limits: Map<string, RateLimitEntry> = new Map();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of limits.entries()) {
    if (now > entry.resetAt) {
      limits.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function rateLimit(maxRequests: number, windowMs: number) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const tg_id = req.user?.tg_id;
    if (!tg_id) return next(); // Skip if no user (auth middleware handles it)

    const key = `${tg_id}:${req.path}`;
    const now = Date.now();
    const entry = limits.get(key);

    if (!entry || now > entry.resetAt) {
      limits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      return res.status(429).json({ error: 'Слишком много запросов. Попробуйте позже.' });
    }

    entry.count++;
    next();
  };
}
