import { useState, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';

export interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

export const useTransactions = () => {
  const { token } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiFetch('/user/transactions');
      if (res.status === 'success') {
        setTransactions(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  return { transactions, loading, fetchTransactions };
};
