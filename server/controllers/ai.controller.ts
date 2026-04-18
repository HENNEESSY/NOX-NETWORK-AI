import { Response } from 'express';
import { generateTextAsync } from '../services/openrouter.service';
import { generateImageAsync } from '../services/fal.service';
import { AuthRequest } from '../types';
import { ENV, supabase, IS_MOCK_DB } from '../config';

type AspectRatio = 'square_hd' | 'square' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9';

const TEXT_PRICES: Record<string, number> = {
  'meta-llama/llama-3.1-8b-instruct': 2,
  'google/gemini-1.5-flash': 5,
  'qwen/qwen-2.5-72b-instruct': 10,
  'anthropic/claude-3-haiku': 12,
  'anthropic/claude-3.5-sonnet': 35,
};

const IMAGE_PRICES: Record<string, number> = {
  'seedream_4_0': 15,
  'qwen': 20,
  'nano_banana': 35,
  'nano_banana_pro': 50,
  'kling_o3': 80,
};

const getAdjustedPrice = async (tg_id: number, basePrice: number): Promise<number> => {
  if (IS_MOCK_DB) return basePrice;

  try {
    const { data: user } = await supabase
      .from('users')
      .select('balance_days')
      .eq('tg_id', tg_id)
      .single();

    if (user && user.balance_days > 0) {
      return Math.ceil(basePrice * 0.75);
    }
  } catch (error) {
    console.warn('Error checking subscription for discount:', error);
  }

  return basePrice;
};

const parsePrompt = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const parseModel = (value: unknown, defaultsTo: string): string => {
  if (typeof value !== 'string') return defaultsTo;
  return value.trim() || defaultsTo;
};

const parseBoolean = (value: unknown): boolean => value === true;

const parseAspectRatio = (value: unknown): AspectRatio => {
  const allowed: AspectRatio[] = ['square_hd', 'square', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'];
  const normalized = typeof value === 'string' ? value.trim() : '';
  return allowed.includes(normalized as AspectRatio) ? (normalized as AspectRatio) : 'square_hd';
};

async function refundNxc(tg_id: number, amount: number, reason: string): Promise<void> {
  if (IS_MOCK_DB || amount <= 0) return;

  await supabase.rpc('add_nxc_and_days', {
    target_tg_id: tg_id,
    days_to_add: 0,
    nxc_to_add: amount,
  });

  await supabase.from('transactions').insert([{
    tg_id,
    amount,
    type: 'ai_refund',
    description: `Возврат NXC: ${reason}`,
  }]);
}

export const getHistory = async (req: AuthRequest, res: Response) => {
  try {
    const tg_id = req.user?.tg_id;
    if (!tg_id) return res.status(401).json({ error: 'Unauthorized' });

    if (IS_MOCK_DB) {
      return res.json({ history: [] });
    }

    const { data, error } = await supabase
      .from('ai_history')
      .select('*')
      .eq('tg_id', tg_id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching history:', JSON.stringify(error, null, 2));
      const isMissingTable = error.message?.includes('Could not find the table') || error.code === '42P01';
      const errorMessage = isMissingTable
        ? 'Таблица ai_history не найдена. Выполните SQL из supabase/schema.sql'
        : `Failed to fetch history: ${error.message}`;
      return res.status(500).json({ error: errorMessage });
    }

    return res.json({ history: data || [] });
  } catch (error: unknown) {
    console.error('AI History Error:', error);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
};

export const chatCopilot = async (req: AuthRequest, res: Response) => {
  let deductedAmount = 0;
  let tg_id: number | null = null;

  try {
    const message = parsePrompt(req.body.message);
    const model = parseModel(req.body.model, 'google/gemini-1.5-flash');
    const isShadow = parseBoolean(req.body.shadow);
    tg_id = req.user?.tg_id ?? null;

    if (!message) return res.status(400).json({ error: 'Message is required' });
    if (!tg_id) return res.status(401).json({ error: 'Unauthorized' });

    const basePrice = TEXT_PRICES[model] || 5;
    const finalPrice = await getAdjustedPrice(tg_id, basePrice);

    if (!IS_MOCK_DB) {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('deduct_nxc', {
        target_tg_id: tg_id,
        amount: finalPrice,
      });

      if (rpcError || !rpcResult?.success) {
        return res.status(402).json({ error: rpcResult?.error || 'Недостаточно NXC' });
      }

      deductedAmount = finalPrice;

      await supabase.from('transactions').insert([{
        tg_id,
        amount: -finalPrice,
        type: 'ai_text',
        description: `Использование ИИ (${model})`,
      }]);
    }

    const reply = await generateTextAsync(message, model);

    if (!IS_MOCK_DB && reply && !isShadow) {
      await supabase.from('ai_history').insert([{
        tg_id,
        type: 'text',
        prompt: message,
        result: reply,
        model,
      }]);
    }

    return res.json({ reply });
  } catch (error: unknown) {
    if (tg_id && deductedAmount > 0) {
      await refundNxc(tg_id, deductedAmount, 'Текстовая генерация завершилась ошибкой');
    }

    console.error('AI Error:', error);
    return res.status(500).json({ error: 'Failed to generate AI response' });
  }
};

export const generateImage = async (req: AuthRequest, res: Response) => {
  let deductedAmount = 0;
  let tg_id: number | null = null;

  try {
    const prompt = parsePrompt(req.body.prompt);
    const style = parseModel(req.body.style, 'none');
    const aspect_ratio = parseAspectRatio(req.body.aspect_ratio);
    const model = parseModel(req.body.model, 'qwen');
    const isShadow = parseBoolean(req.body.shadow);
    tg_id = req.user?.tg_id ?? null;

    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    if (!tg_id) return res.status(401).json({ error: 'Unauthorized' });

    const basePrice = IMAGE_PRICES[model] || 20;
    const finalPrice = await getAdjustedPrice(tg_id, basePrice);

    if (!IS_MOCK_DB) {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('deduct_nxc', {
        target_tg_id: tg_id,
        amount: finalPrice,
      });

      if (rpcError || !rpcResult?.success) {
        return res.status(402).json({ error: rpcResult?.error || 'Недостаточно NXC' });
      }

      deductedAmount = finalPrice;

      await supabase.from('transactions').insert([{
        tg_id,
        amount: -finalPrice,
        type: 'ai_image',
        description: `Генерация изображения (${model})`,
      }]);
    }

    const webhookUrl = `${ENV.APP_URL}/api/webhook/fal`;

    const response = await generateImageAsync({
      prompt,
      style,
      aspect_ratio,
      model,
      webhookUrl,
    });

    if (!response.request_id) {
      throw new Error('Fal response does not contain request_id');
    }

    if (!IS_MOCK_DB && !isShadow) {
      await supabase.from('ai_history').insert([{
        tg_id,
        type: 'image',
        prompt,
        result: 'pending',
        model,
        request_id: response.request_id,
      }]);
    }

    return res.json({
      status: 'success',
      request_id: response.request_id,
      message: 'Генерация изображения запущена',
    });
  } catch (error: unknown) {
    if (tg_id && deductedAmount > 0) {
      await refundNxc(tg_id, deductedAmount, 'Генерация изображения не была запущена');
    }

    console.error('Fal AI Error:', error);
    return res.status(500).json({ error: 'Failed to start image generation' });
  }
};
