import { toast } from 'sonner';
import { useAuthStore } from '../store/useAuthStore';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      Object.assign(error, { status: response.status });
      throw error;
    }

    return await response.json();
  } catch (error: unknown) {
    console.error('API Error:', error);
    
    // Don't show toast for 401 Unauthorized as it's handled by the auth store
    const isUnauthorized = error instanceof Error && (
      (error as Error & { status?: number }).status === 401 || 
      error.message === 'Invalid token' || 
      error.message === 'Unauthorized'
    );

    if (!isUnauthorized) {
      const message = error instanceof Error ? error.message : 'Ошибка соединения с сервером';
      toast.error(message);
    }
    
    throw error;
  }
}
