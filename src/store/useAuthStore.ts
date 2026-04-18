import { create } from 'zustand';
import { apiFetch } from '../lib/api';

export type UserRole = 'user' | 'moderator' | 'admin';

export interface User {
  tg_id: number;
  role: UserRole;
  balance_days: number;
  nxc_balance: number;
  auto_refill: boolean;
  referral_count?: number;
  ambassador_points?: number;
  vless_link?: string;
  created_at?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('nox_token'),
  isLoading: true,
  
  setUser: (user) => set({ user }),
  
  setToken: (token) => {
    if (token) localStorage.setItem('nox_token', token);
    else localStorage.removeItem('nox_token');
    set({ token });
  },
  
  login: async (force = false) => {
    set({ isLoading: true });
    try {
      let currentToken = get().token;
      
      // Force re-login if requested (e.g., after role change)
      if (force) {
        currentToken = null;
        localStorage.removeItem('nox_token');
      }
      
      // Try to get initData from Telegram WebApp or URL hash
      let tgInitData = window.Telegram?.WebApp?.initData;
      
      if (!tgInitData) {
        // Fallback: extract from URL hash (tgWebAppData)
        const hash = window.location.hash;
        if (hash.includes('tgWebAppData=')) {
          tgInitData = hash.substring(1); // Remove #
          console.log('[Auth] Extracted initData from URL hash');
        }
      }
      
      if (!tgInitData) {
        tgInitData = 'mock';
        console.log('[Auth] Using mock initData');
      }

      const fetchProfile = async () => {
        const userData = await apiFetch('/user');
        if (userData.status === 'success') {
          const user = { 
            ...userData.data, 
            role: userData.data.role || 'user'
          };
          set({ user });
        }
      };

      if (!currentToken) {
        const authData = await apiFetch('/auth', { 
          method: 'POST', 
          body: JSON.stringify({ initData: tgInitData })
        });
        currentToken = authData.token;
        get().setToken(currentToken);
        await fetchProfile();
      } else {
        try {
          await fetchProfile();
        } catch (error: unknown) {
          const isInvalidToken = error instanceof Error && (error.message === 'Invalid token' || error.message === 'Unauthorized' || (error as Error & { status?: number }).status === 401);
          if (isInvalidToken) {
            get().setToken(null);
            const authData = await apiFetch('/auth', { 
              method: 'POST', 
              body: JSON.stringify({ initData: tgInitData })
            });
            currentToken = authData.token;
            get().setToken(currentToken);
            await fetchProfile();
          } else {
            console.error('Failed to fetch profile:', error);
          }
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      get().setToken(null);
    } finally {
      set({ isLoading: false });
    }
  }
}));
