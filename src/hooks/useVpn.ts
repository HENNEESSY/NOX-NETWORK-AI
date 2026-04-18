import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '../store/useAuthStore';

// Servers Configuration
export const SERVERS = [
  { flag: '🇳🇱', name: 'Netherlands', code: 'NL', ping: '24ms' },
  { flag: '🇩🇪', name: 'Germany', code: 'DE', ping: '32ms' },
  { flag: '🇹🇷', name: 'Turkey', code: 'TR', ping: '45ms' },
  { flag: '🇱🇻', name: 'Latvia', code: 'LV', ping: '38ms' },
];

export const useVpn = () => {
  const { user } = useAuthStore();
  const [selectedServer, setSelectedServer] = useState(SERVERS[0]);
  const [serverDropdownOpen, setServerDropdownOpen] = useState(false);
  
  // A real VPN app might track active state from a backend connection toggle,
  // but for now, we tie it primarily to whether the user has balance left.
  const isActive = Boolean(user && user.balance_days > 0);
  const daysLeft = user?.balance_days || 0;

  const handleToggleVpn = useCallback(() => {
    if (isActive) {
      toast.success(`Подписка активна: ${daysLeft} дней`, { icon: '🟢' });
    } else {
      toast.error('Подписка истекла. Продлите тариф!', { icon: '🔴' });
    }
  }, [isActive, daysLeft]);

  return {
    isActive,
    daysLeft,
    selectedServer,
    setSelectedServer,
    serverDropdownOpen,
    setServerDropdownOpen,
    handleToggleVpn
  };
};
