import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '../store/useAuthStore';

interface AIHistoryItem {
  id: number;
  type: 'text' | 'image';
  prompt: string;
  result: string;
  model: string;
  created_at: string;
}

export const useAi = () => {
  const { user, login } = useAuthStore();
  const [isTextGenerating, setIsTextGenerating] = useState(false);
  const [isPhotoGenerating, setIsPhotoGenerating] = useState(false);
  const [history, setHistory] = useState<AIHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await apiFetch('/ai/history');
      if (res.history) {
        setHistory(res.history);
      }
    } catch (e) {
      console.error('Failed to fetch AI history', e);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const generateText = async (prompt: string, model: string, price: number, shadow: boolean = false) => {
    if (!prompt.trim()) {
      toast.error('Введите запрос');
      return null;
    }

    if ((user?.nxc_balance || 0) < price) {
      toast.error(`Недостаточно NXC. Требуется ${price} NXC`);
      return null;
    }

    setIsTextGenerating(true);
    try {
      const res = await apiFetch('/chat', {
        method: 'POST',
        body: JSON.stringify({ message: prompt, model, shadow })
      });
      if (res.reply) {
        await login(); // Refetch token/balance
        if (!shadow) await fetchHistory(); // update history only if not shadow
        return res.reply;
      }
    } catch (error) {
      console.error('Text gen error', error);
      return null;
    } finally {
      setIsTextGenerating(false);
    }
  };

  const generatePhoto = async (prompt: string, style: string, aspect_ratio: string, model: string, price: number, shadow: boolean = false) => {
    if (!prompt.trim()) {
      toast.error('Введите описание для генерации');
      return false;
    }

    if ((user?.nxc_balance || 0) < price) {
      toast.error(`Недостаточно NXC. Требуется ${price} NXC`);
      return false;
    }

    setIsPhotoGenerating(true);
    try {
      const res = await apiFetch('/generate-image', {
        method: 'POST',
        body: JSON.stringify({ prompt, style, aspect_ratio, model, shadow })
      });

      if (res.status === 'success') {
        toast.success('Генерация запущена! Результат придет в бота.');
        await login(); // Refetch balance
        if (!shadow) await fetchHistory();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Image gen error:', error);
      return false;
    } finally {
      setIsPhotoGenerating(false);
    }
  };

  return {
    generateText,
    generatePhoto,
    isTextGenerating,
    isPhotoGenerating,
    history,
    historyLoading,
    fetchHistory
  };
};
