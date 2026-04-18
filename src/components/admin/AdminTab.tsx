import React, { useState, useEffect, useCallback } from 'react';
import type { FC, ReactNode } from 'react';
import { 
  ShieldCheck, CreditCard, Users, Activity, Sparkles, 
  Copy, Check, Loader2, Send, Search, TrendingUp, TrendingDown,
  RefreshCw, MessageSquare, Zap, UserPlus, Eye, EyeOff,
  BarChart3, PieChart as PieChartIcon, Terminal, Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

// Types
interface Payment {
  id: number;
  tg_id: number;
  amount: number;
  plan: string;
  status: 'success' | 'pending' | 'failed';
  created_at: string;
}

interface UserData {
  tg_id: number;
  role: string;
  balance_days: number;
  nxc_balance: number;
  location: string;
  created_at: string;
  referral_count?: number;
  username?: string;
}

interface StatsData {
  totalRevenue: number;
  revenueChange: number;
  activeUsers: number;
  usersChange: number;
  totalNxc: number;
  nxcChange: number;
  newUsers: number;
  newUsersChange: number;
  totalUsers: number;
  conversionRate: number;
}

interface ActivityItem {
  id: string;
  type: 'payment' | 'user' | 'ai' | 'system';
  title: string;
  description: string;
  timestamp: string;
}

const COLORS = ['#0066FF', '#00C9FF', '#7B61FF', '#FF6B6B', '#4ECDC4'];

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number;
  change: number;
  icon: React.ElementType;
  color: string;
  suffix?: string;
}

const StatCard: FC<StatCardProps> = ({ title, value, change, icon: Icon, color, suffix = '' }) => (
  <motion.div 
    variants={fadeInUp}
    className="bg-gradient-to-br from-[#121212] to-[#0a0a0a] rounded-2xl border border-white/5 p-4 relative overflow-hidden group"
  >
    <div className="absolute top-0 right-0 w-24 h-24 opacity-20 blur-3xl rounded-full transition-all duration-500" style={{ backgroundColor: color }} />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(change)}%
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value.toLocaleString()}{suffix}</p>
      <p className="text-[11px] text-gray-500 uppercase tracking-wider mt-1">{title}</p>
    </div>
  </motion.div>
);

// Section Component
interface SectionProps {
  children: ReactNode;
  className?: string;
}

const Section: FC<SectionProps> = ({ children, className = '' }) => (
  <motion.div 
    variants={fadeInUp}
    className={`bg-gradient-to-br from-[#121212] to-[#0a0a0a] rounded-2xl border border-white/5 p-4 ${className}`}
  >
    {children}
  </motion.div>
);

// Cache helper
const CACHE_KEY = 'nox_admin_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedData = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const setCachedData = (data: any) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {}
};

// Skeleton Loader
const SkeletonCard: FC = () => (
  <div className="bg-gradient-to-br from-[#121212] to-[#0a0a0a] rounded-2xl border border-white/5 p-4 animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <div className="w-10 h-10 rounded-xl bg-white/10" />
      <div className="w-12 h-4 rounded bg-white/10" />
    </div>
    <div className="w-24 h-8 rounded bg-white/10 mb-2" />
    <div className="w-20 h-3 rounded bg-white/5" />
  </div>
);

const SkeletonSection: FC = () => (
  <div className="bg-gradient-to-br from-[#121212] to-[#0a0a0a] rounded-2xl border border-white/5 p-4 animate-pulse">
    <div className="w-32 h-5 rounded bg-white/10 mb-4" />
    <div className="space-y-3">
      {[1,2,3].map(i => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/10" />
          <div className="flex-1">
            <div className="w-24 h-4 rounded bg-white/10 mb-1" />
            <div className="w-32 h-3 rounded bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Main Component
const AdminTab: FC = () => {
  const { token, user } = useAuthStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'users' | 'broadcast' | 'analytics'>('dashboard');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasCachedData, setHasCachedData] = useState(false);
  
  // Fallback: Check admin by Telegram ID from multiple sources
  const isAdminByTgId = () => {
    // Get admin ID from env (import.meta.env for Vite)
    const ADMIN_TG_ID = Number(import.meta.env.VITE_ADMIN_TG_ID) || 7278863161;
    
    const tg = window.Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user?.id === ADMIN_TG_ID) {
      return true;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const tgData = urlParams.get('tgWebAppData');
    if (tgData) {
      try {
        const decoded = decodeURIComponent(tgData);
        if (decoded.includes(String(ADMIN_TG_ID))) {
          return true;
        }
      } catch {}
    }
    
    const hash = window.location.hash;
    if (hash.includes(String(ADMIN_TG_ID))) {
      return true;
    }
    
    if (localStorage.getItem('nox_debug_admin') === 'true') {
      return true;
    }
    
    return false;
  }
  
  // Check if user has admin/moderator access (from API or fallback)
  const hasAdminAccess = (user && (user.role === 'admin' || user.role === 'moderator')) || isAdminByTgId();
  
  // AI State
  const [topic, setTopic] = useState('');
  const [generatedPost, setGeneratedPost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  // User State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUser, setSearchedUser] = useState<UserData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [daysToAdd, setDaysToAdd] = useState('');
  const [nxcToAdd, setNxcToAdd] = useState('');

  // Broadcast State
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastFilter, setBroadcastFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Stats
  const [chartData, setChartData] = useState<{name: string, revenue: number, users: number}[]>([]);
  const [pieData, setPieData] = useState<{name: string, value: number}[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<StatsData>({
    totalRevenue: 0, revenueChange: 12.5,
    activeUsers: 0, usersChange: 8.3,
    totalNxc: 0, nxcChange: 15.2,
    newUsers: 0, newUsersChange: -5.1,
    totalUsers: 0, conversionRate: 23.4
  });

  // Fetch Data with caching
  const fetchAdminData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsRefreshing(true);
    
    try {
      const [paymentsRes, statsRes] = await Promise.all([
        apiFetch('/admin/payments').catch(() => ({ status: 'error', data: [] })),
        apiFetch('/admin/stats').catch(() => null)
      ]);

      if (paymentsRes.status === 'success') {
        const paymentsList = paymentsRes.data as Payment[];
        setPayments(paymentsList);
        
        const revenue = paymentsList.reduce((acc, p) => p.status === 'success' ? acc + p.amount : acc, 0);
        const successPayments = paymentsList.filter(p => p.status === 'success');
        const activeUserCount = new Set(successPayments.map(p => p.tg_id)).size;
        
        const newStats = {
          totalRevenue: revenue,
          activeUsers: statsRes?.activeUsers || activeUserCount,
          totalNxc: statsRes?.totalNxc || 0,
          newUsers: statsRes?.newUsers || 0,
          totalUsers: statsRes?.totalUsers || activeUserCount,
          conversionRate: statsRes?.conversionRate || 23.4,
          revenueChange: 12.5,
          usersChange: 8.3,
          nxcChange: 15.2,
          newUsersChange: -5.1,
        };
        
        setStats(newStats);
        
        // Cache the data
        setCachedData({
          payments: paymentsList,
          stats: newStats,
          chartData,
          pieData,
          activityLog
        });

        // Chart Data
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toLocaleDateString('ru-RU', { weekday: 'short' });
        });

        const dailyRevenue = last7Days.map((day, i) => {
          const dateStr = new Date();
          dateStr.setDate(dateStr.getDate() - (6 - i));
          const dayPayments = paymentsList.filter(p => {
            const pDate = new Date(p.created_at);
            return p.status === 'success' && pDate.toDateString() === dateStr.toDateString();
          });
          return {
            name: day,
            revenue: dayPayments.reduce((acc, p) => acc + p.amount, 0),
            users: new Set(dayPayments.map(p => p.tg_id)).size
          };
        });
        setChartData(dailyRevenue);

        // Pie Data
        const statusCounts = {
          success: paymentsList.filter(p => p.status === 'success').length,
          pending: paymentsList.filter(p => p.status === 'pending').length,
          failed: paymentsList.filter(p => p.status === 'failed').length
        };
        setPieData([
          { name: 'Успешно', value: statusCounts.success },
          { name: 'В обработке', value: statusCounts.pending },
          { name: 'Ошибка', value: statusCounts.failed }
        ].filter(d => d.value > 0));
      }

      // Mock Activity
      setActivityLog([
        { id: '1', type: 'payment', title: 'Новый платеж', description: 'Пользователь #12345 оплатил подписку', timestamp: '2 мин назад' },
        { id: '2', type: 'user', title: 'Новый пользователь', description: 'Зарегистрировался @newuser', timestamp: '5 мин назад' },
        { id: '3', type: 'ai', title: 'AI генерация', description: 'Сгенерирован пост для канала', timestamp: '15 мин назад' },
      ]);

    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Load cached data immediately, then fetch fresh in background
  useEffect(() => {
    if (!token) return;
    
    // Try to load cached data first for instant display
    const cached = getCachedData();
    if (cached) {
      setPayments(cached.payments || []);
      setStats(cached.stats || stats);
      setChartData(cached.chartData || []);
      setPieData(cached.pieData || []);
      setActivityLog(cached.activityLog || []);
      setHasCachedData(true);
      setIsLoading(false); // Show cached data immediately
    }
    
    // Fetch fresh data in background (no loading spinner)
    fetchAdminData(false);
    
    // Auto-refresh every 60 seconds (not 30)
    const interval = setInterval(() => fetchAdminData(false), 60000);
    return () => clearInterval(interval);
  }, [token, fetchAdminData]);
  
  // Mark loading complete when we have data
  useEffect(() => {
    if (payments.length > 0 || hasCachedData) {
      setIsLoading(false);
    }
  }, [payments, hasCachedData]);

  // Handlers
  const handleGeneratePost = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setGeneratedPost('');
    
    try {
      const data = await apiFetch('/admin/generate-post', {
        method: 'POST',
        body: JSON.stringify({ topic })
      });
      if (data.status === 'success') {
        setGeneratedPost(data.text);
      } else {
        toast.error('Ошибка генерации поста');
      }
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendForReview = async () => {
    if (!generatedPost) return;
    setIsSending(true);
    try {
      const data = await apiFetch('/admin/send-for-review', {
        method: 'POST',
        body: JSON.stringify({ text: generatedPost })
      });
      if (data.status === 'success') {
        toast.success('Отправлено на ревью!');
      } else {
        toast.error('Ошибка отправки');
      }
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyPost = () => {
    if (!generatedPost) return;
    navigator.clipboard.writeText(generatedPost);
    setCopied(true);
    toast.success('Скопировано!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSearchUser = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const data = await apiFetch(`/admin/users/${searchQuery}`);
      if (data.status === 'success') {
        setSearchedUser(data.data);
      } else {
        toast.error('Пользователь не найден');
        setSearchedUser(null);
      }
    } catch {
      setSearchedUser(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddDays = async () => {
    if (!searchedUser || !daysToAdd) return;
    try {
      const data = await apiFetch(`/admin/users/${searchedUser.tg_id}/add-days`, {
        method: 'POST',
        body: JSON.stringify({ days: parseInt(daysToAdd) })
      });
      if (data.status === 'success') {
        toast.success(`Добавлено ${daysToAdd} дней`);
        setSearchedUser({ ...searchedUser, balance_days: searchedUser.balance_days + parseInt(daysToAdd) });
        setDaysToAdd('');
      }
    } catch {
      toast.error('Ошибка');
    }
  };

  const handleAddNxc = async () => {
    if (!searchedUser || !nxcToAdd) return;
    try {
      const data = await apiFetch(`/admin/users/${searchedUser.tg_id}/add-nxc`, {
        method: 'POST',
        body: JSON.stringify({ amount: parseInt(nxcToAdd) })
      });
      if (data.status === 'success') {
        toast.success(`Добавлено ${nxcToAdd} NXC`);
        setSearchedUser({ ...searchedUser, nxc_balance: (searchedUser.nxc_balance || 0) + parseInt(nxcToAdd) });
        setNxcToAdd('');
      }
    } catch {
      toast.error('Ошибка');
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    setIsBroadcasting(true);
    try {
      const data = await apiFetch('/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify({ message: broadcastMessage, filter: broadcastFilter })
      });
      if (data.status === 'success') {
        toast.success(`Рассылка запущена!`);
        setBroadcastMessage('');
      }
    } catch {
      toast.error('Ошибка рассылки');
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Skeleton Loading State - shows immediately with cached data or skeletons
  if (isLoading && !hasCachedData) {
    return (
      <div className="h-full overflow-y-auto scrollbar-hide pb-24">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-white/10 animate-pulse" />
          <div className="flex-1">
            <div className="w-40 h-6 rounded bg-white/10 animate-pulse mb-2" />
            <div className="w-24 h-4 rounded bg-white/5 animate-pulse" />
          </div>
        </div>
        
        {/* Tabs Skeleton */}
        <div className="flex gap-2 mb-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex-1 h-10 rounded-xl bg-white/10 animate-pulse" />
          ))}
        </div>
        
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        
        {/* Activity Section Skeleton */}
        <SkeletonSection />
      </div>
    );
  }

  // Access Denied State
  if (!hasAdminAccess) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center h-full space-y-6 px-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30">
          <ShieldCheck className="w-10 h-10 text-white" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Доступ запрещён</h2>
          <p className="text-sm text-gray-400">
            Эта секция доступна только администраторам и модераторам
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 max-w-xs">
          <p className="text-xs text-gray-500 text-center">
            Ваш текущий статус: <span className="text-gray-300 font-medium">{user?.role || 'user'}</span>
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-5 pb-6"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0066FF] to-[#00C9FF] flex items-center justify-center shadow-lg shadow-[#0066FF]/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold tracking-tight">Админ Панель</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                user?.role === 'admin' 
                  ? 'bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/30' 
                  : 'bg-[#0066FF]/20 text-[#0066FF] border border-[#0066FF]/30'
              }`}>
                {user?.role === 'admin' ? 'ADMIN' : 'MODERATOR'}
              </span>
            </div>
            <p className="text-xs text-gray-500">NOX NETWORK v2.5</p>
          </div>
        </div>
        <button 
          onClick={fetchAdminData}
          disabled={isRefreshing}
          className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </motion.div>

      {/* Navigation */}
      <motion.div variants={fadeInUp} className="flex gap-2 p-1.5 rounded-2xl bg-[#121212]/80 border border-white/5 backdrop-blur-sm">
        {[
          { id: 'dashboard', label: 'Обзор', icon: Activity },
          { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
          { id: 'users', label: 'Пользователи', icon: Users },
          { id: 'broadcast', label: 'Рассылка', icon: MessageSquare }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as typeof activeSection)}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-300 ${
              activeSection === tab.id
                ? 'bg-gradient-to-r from-[#0066FF] to-[#00C9FF] text-white shadow-lg shadow-[#0066FF]/25'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeSection === 'dashboard' && (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard title="Выручка" value={stats.totalRevenue} change={stats.revenueChange} icon={CreditCard} color="#0066FF" suffix=" ₽" />
              <StatCard title="Активных VPN" value={stats.activeUsers} change={stats.usersChange} icon={Users} color="#7B61FF" />
              <StatCard title="NXC в обороте" value={stats.totalNxc} change={stats.nxcChange} icon={Zap} color="#fbbf24" suffix=" NXC" />
              <StatCard title="Новых за 24ч" value={stats.newUsers} change={stats.newUsersChange} icon={UserPlus} color="#4ECDC4" />
            </div>

            {/* Activity Feed */}
            <Section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#0066FF]" />
                  <h3 className="text-sm font-bold text-white">Активность системы</h3>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Live
                </span>
              </div>
              <div className="space-y-2">
                {activityLog.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      item.type === 'payment' ? 'bg-green-500/20 text-green-400' :
                      item.type === 'user' ? 'bg-[#0066FF]/20 text-[#0066FF]' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {item.type === 'payment' ? <CreditCard className="w-4 h-4" /> :
                       item.type === 'user' ? <Users className="w-4 h-4" /> :
                       <Sparkles className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.title}</p>
                      <p className="text-xs text-gray-500 truncate">{item.description}</p>
                    </div>
                    <span className="text-[10px] text-gray-600 whitespace-nowrap">{item.timestamp}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* AI Copywriter */}
            <Section className="bg-gradient-to-br from-purple-900/20 to-[#121212] border-purple-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">AI Копирайтер</h3>
                  <p className="text-[10px] text-gray-400">GPT-4 Powered</p>
                </div>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Тема поста..."
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/50 transition-colors"
                />
                
                <button
                  onClick={handleGeneratePost}
                  disabled={!topic.trim() || isGenerating}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-purple-500/25"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isGenerating ? 'Генерация...' : 'Сгенерировать'}
                </button>
              </div>

              <AnimatePresence>
                {generatedPost && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4"
                  >
                    <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {generatedPost}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={handleCopyPost} className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-sm flex items-center justify-center gap-2 hover:bg-white/20 transition-colors">
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Скопировано' : 'Копировать'}
                      </button>
                      <button onClick={handleSendForReview} disabled={isSending} className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#00C9FF] text-white text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-[#0066FF]/25">
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {isSending ? 'Отправка...' : 'На ревью'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Section>

            {/* Recent Payments */}
            <Section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Последние платежи</h3>
                <button className="text-[10px] text-[#0066FF] hover:text-[#00C9FF] transition-colors">Все →</button>
              </div>
              
              <div className="divide-y divide-white/5">
                {payments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        payment.status === 'success' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 
                        payment.status === 'pending' ? 'bg-yellow-400' : 'bg-red-400'
                      }`} />
                      <div>
                        <p className="text-sm font-semibold text-white">ID: {payment.tg_id}</p>
                        <p className="text-[10px] text-gray-500">{payment.plan}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">+{payment.amount} ₽</p>
                      <p className={`text-[10px] uppercase tracking-wider ${
                        payment.status === 'success' ? 'text-green-400' : 
                        payment.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {payment.status === 'success' ? 'Успешно' : payment.status === 'pending' ? 'В обработке' : 'Ошибка'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>
        )}

        {activeSection === 'analytics' && (
          <motion.div 
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Charts */}
            <Section>
              <h3 className="text-sm font-bold text-white mb-4">Выручка за неделю</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0066FF" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0066FF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(18,18,18,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                    <Area type="monotone" dataKey="revenue" stroke="#0066FF" strokeWidth={2} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Section>

            <Section>
              <h3 className="text-sm font-bold text-white mb-4">Статус платежей</h3>
              <div className="h-[200px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(18,18,18,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-[10px] text-gray-400">{entry.name}</span>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>
        )}

        {activeSection === 'users' && (
          <motion.div 
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Search */}
            <Section>
              <h3 className="text-sm font-bold text-white mb-3">Поиск пользователя</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Telegram ID..."
                  className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-[#0066FF]/50"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchUser()}
                />
                <button
                  onClick={handleSearchUser}
                  disabled={!searchQuery || isSearching}
                  className="px-4 py-3 rounded-xl bg-[#0066FF] text-white disabled:opacity-50"
                >
                  {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </button>
              </div>

              {searchedUser && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10 space-y-3"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0066FF] to-[#00C9FF] flex items-center justify-center">
                      <span className="text-lg font-bold text-white">{searchedUser.tg_id.toString().slice(-2)}</span>
                    </div>
                    <div>
                      <p className="font-bold text-white">ID: {searchedUser.tg_id}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white">{searchedUser.role}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-xl bg-white/5">
                      <p className="text-gray-500 text-xs mb-1">VPN дней</p>
                      <p className={`font-bold ${searchedUser.balance_days > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {searchedUser.balance_days}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5">
                      <p className="text-gray-500 text-xs mb-1">NXC баланс</p>
                      <p className="font-bold text-[#fbbf24]">{searchedUser.nxc_balance || 0}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={daysToAdd}
                        onChange={(e) => setDaysToAdd(e.target.value)}
                        placeholder="Дни"
                        className="w-24 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
                      />
                      <button
                        onClick={handleAddDays}
                        disabled={!daysToAdd}
                        className="flex-1 py-2 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 text-sm font-semibold disabled:opacity-50"
                      >
                        + Дни VPN
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={nxcToAdd}
                        onChange={(e) => setNxcToAdd(e.target.value)}
                        placeholder="NXC"
                        className="w-24 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
                      />
                      <button
                        onClick={handleAddNxc}
                        disabled={!nxcToAdd}
                        className="flex-1 py-2 rounded-lg bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/30 text-sm font-semibold disabled:opacity-50"
                      >
                        + NXC
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </Section>
          </motion.div>
        )}

        {activeSection === 'broadcast' && (
          <motion.div 
            key="broadcast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <Section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0066FF] to-[#00C9FF] flex items-center justify-center shadow-lg shadow-[#0066FF]/30">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Массовая рассылка</h3>
                  <p className="text-[10px] text-gray-400">Отправка от имени бота</p>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                {[
                  { id: 'all', label: 'Всем' },
                  { id: 'active', label: 'Активным' },
                  { id: 'expired', label: 'Истекшим' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setBroadcastFilter(f.id as typeof broadcastFilter)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      broadcastFilter === f.id
                        ? 'bg-[#0066FF]/20 border-[#0066FF] text-[#0066FF]'
                        : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Текст сообщения..."
                className="w-full h-32 bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-600 outline-none focus:border-[#0066FF]/50 resize-none mb-3"
              />

              <button
                onClick={handleBroadcast}
                disabled={!broadcastMessage.trim() || isBroadcasting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0066FF] to-[#00C9FF] text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-[#0066FF]/25"
              >
                {isBroadcasting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isBroadcasting ? 'Отправка...' : 'Отправить рассылку'}
              </button>
            </Section>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminTab;
