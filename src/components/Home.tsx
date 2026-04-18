import { Power, ChevronDown, Activity, Sparkles, QrCode, Copy, Check, ExternalLink, X, Trophy, Gift, History, Wallet, Crown, Star, ArrowRight, Shield, Zap, TrendingUp, MapPin } from 'lucide-react'
import { SERVERS, useVpn } from '../hooks/useVpn'
import { useAuthStore } from '../store/useAuthStore'
import { QRCodeSVG } from 'qrcode.react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { apiFetch } from '../lib/api'

interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

interface Ambassador {
  id: number;
  name: string;
  referrals: number;
  points: number;
  rank: number;
}

const MOCK_AMBASSADORS: Ambassador[] = [
  { id: 1, name: "@alex_vortex", referrals: 154, points: 15400, rank: 1 },
  { id: 2, name: "@serg_nox", referrals: 89, points: 8900, rank: 2 },
  { id: 3, name: "@kristina_vpn", referrals: 72, points: 7200, rank: 3 },
  { id: 4, name: "@mikhail_dev", referrals: 45, points: 4500, rank: 4 },
  { id: 5, name: "@nox_fan", referrals: 38, points: 3800, rank: 5 },
];

export default function Home({ onNavigate }: { onNavigate?: (tab: 'plans' | 'aihub' | 'setup' | 'community') => void }) {
  const { user } = useAuthStore()
  const {
    isActive,
    daysLeft,
    selectedServer,
    setSelectedServer,
    serverDropdownOpen,
    setServerDropdownOpen,
    handleToggleVpn
  } = useVpn()

  // State for server dropdown
  const [showServerSelect, setShowServerSelect] = useState(false)

  const [showQr, setShowQr] = useState(false)
  const [copied, setCopied] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([])
  const [userRank, setUserRank] = useState<{ rank: number, total: number } | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isLoadingRanking, setIsLoadingRanking] = useState(false)
  const [isEnteringGiveaway, setIsEnteringGiveaway] = useState(false)

  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const data = await apiFetch('/user/transactions');
        if (data.status === 'success') {
          setTransactions(data.data.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to fetch transactions', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    const fetchRanking = async () => {
      setIsLoadingRanking(true);
      try {
        const [ambassadorsRes, rankRes] = await Promise.all([
          apiFetch('/user/ambassadors'),
          apiFetch('/user/rank')
        ]);
        
        if (ambassadorsRes.status === 'success') {
          setAmbassadors(ambassadorsRes.data);
        }
        if (rankRes.status === 'success') {
          setUserRank(rankRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch ranking', err);
      } finally {
        setIsLoadingRanking(false);
      }
    };

    fetchHistory();
    fetchRanking();
  }, []);

  const handleEnterGiveaway = async () => {
    setIsEnteringGiveaway(true);
    try {
      const res = await apiFetch('/user/giveaway/enter', {
        method: 'POST',
        body: JSON.stringify({ giveaway_id: 'april_2026' })
      });
      if (res.status === 'success') {
        toast.success(res.message);
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error('Ошибка при записи на розыгрыш');
    } finally {
      setIsEnteringGiveaway(false);
    }
  };

  const handleCopyLink = () => {
    if (!user?.vless_link) return
    navigator.clipboard.writeText(user.vless_link)
    setCopied(true)
    toast.success('Ссылка скопирована!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 pb-4">
      {/* Profile Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0066FF] flex items-center justify-center text-white font-bold text-xl shadow-[0_0_20px_rgba(0,102,255,0.3)]">
            {tgUser?.first_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">@{tgUser?.username || 'user_' + user?.tg_id}</h1>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Online</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-2xl">
            <Sparkles className="w-3.5 h-3.5 text-[#00f2ff]" />
            <span className="text-sm font-bold font-mono text-[#00f2ff]">{user?.nxc_balance || 0} NXC</span>
          </div>
        </div>
      </div>

      {/* Subscription Card */}
      <div className={`relative overflow-hidden rounded-[2rem] border transition-all duration-500 ${
        isActive ? 'bg-[#121212] border-white/5 shadow-2xl' : 'bg-red-500/5 border-red-500/20 shadow-none'
      }`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#0066FF]/10 blur-[50px] pointer-events-none" />
        
        <div className="p-6 relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Статус подписки</p>
              <h2 className={`text-2xl font-black tracking-tighter ${isActive ? 'text-white' : 'text-red-500'}`}>
                {isActive ? 'АКТИВНА' : 'НЕАКТИВНА'}
              </h2>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <Shield className="w-6 h-6 text-[#0066FF]" />
            </div>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: isActive ? `${Math.min((daysLeft / 30) * 100, 100)}%` : '0%' }}
                    className="h-full bg-gradient-to-r from-[#0066FF] to-[#00f2ff]"
                  />
                </div>
                <span className="text-sm font-bold font-mono text-white/90">{isActive ? daysLeft : 0} дн.</span>
              </div>
              
              {isActive && (
                <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <Zap className={`w-3.5 h-3.5 ${user?.auto_refill ? 'text-[#fbbf24]' : 'text-gray-500'}`} />
                    <span className="text-[11px] font-bold text-gray-300">Умное продление (399 NXC)</span>
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                        const enabled = !user?.auto_refill;
                        const res = await apiFetch('/user/toggle-auto-refill', {
                          method: 'POST',
                          body: JSON.stringify({ enabled })
                        });
                        if (res.status === 'success') {
                          useAuthStore.getState().setUser({ ...user!, auto_refill: enabled });
                          toast.success(enabled ? 'Автопродление включено' : 'Автопродление выключено');
                        }
                      } catch (err) {
                        toast.error('Ошибка при обновлении настройки');
                      }
                    }}
                    className={`w-9 h-5 rounded-full transition-colors relative ${user?.auto_refill ? 'bg-[#fbbf24]' : 'bg-gray-700'}`}
                  >
                    <motion.div 
                      className="w-4 h-4 bg-white rounded-full absolute top-0.5"
                      animate={{ left: user?.auto_refill ? '18px' : '2px' }}
                    />
                  </button>
                </div>
              )}

              {!isActive ? (
                <button
                  onClick={() => onNavigate?.('plans')}
                  className="w-full py-4 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#0066FF]/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Продлить подписку
                </button>
              ) : (
                <div className="space-y-3">
                  {/* Server Selector */}
                  <button
                    onClick={() => setShowServerSelect(true)}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white border border-white/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#0066FF]" />
                    {selectedServer.flag} {selectedServer.name}
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleToggleVpn}
                      className="flex-1 py-3 text-xs font-bold bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Power className={`w-3.5 h-3.5 ${isActive ? 'text-green-500' : 'text-gray-500'}`} />
                      Статус
                    </button>
                    <button
                      onClick={() => setShowQr(true)}
                      className="flex-1 py-3 text-xs font-bold bg-[#0066FF]/10 hover:bg-[#0066FF]/20 text-[#0066FF] rounded-xl transition-all border border-[#0066FF]/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Мой QR
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* NOX Ambassador Leaderboard */}
      <div className="bg-[#121212] rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-white/5 bg-white/2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#fbbf24]/10 flex items-center justify-center">
              <Crown className="w-4 h-4 text-[#fbbf24]" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">TOP NOX AMBASSADOR</h3>
          </div>
          <span className="text-[10px] font-bold text-[#fbbf24] bg-[#fbbf24]/10 px-2 py-0.5 rounded-full">РЕЙТИНГ</span>
        </div>
        
        <div className="p-2">
          {isLoadingRanking ? (
            <div className="flex justify-center py-6">
               <div className="w-5 h-5 border-2 border-[#fbbf24] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : ambassadors.length > 0 ? (
            <>
              {ambassadors.map((amb, i) => (
                <div key={amb.tg_id} className={`flex items-center gap-3 p-3 rounded-2xl transition-colors ${i === 0 ? 'bg-[#0066FF]/10' : ''}`}>
                  <div className={`w-6 text-center font-black text-xs ${i === 0 ? 'text-[#fbbf24]' : 'text-[#0066FF]'}`}>
                    #{i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white">{amb.name || `User ${amb.tg_id}`}</p>
                    <p className="text-[10px] font-mono text-gray-500">{amb.referral_count} рефералов</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="text-right">
                      <p className="text-xs font-bold font-mono text-white">{(amb.ambassador_points || 0).toLocaleString()}</p>
                      <p className="text-[9px] text-gray-500 uppercase font-black tracking-tight">Points</p>
                    </div>
                    {i < 3 && <Star className="w-3.5 h-3.5 text-[#fbbf24] fill-[#fbbf24]" />}
                  </div>
                </div>
              ))}
              
              {userRank && (
                <div className="mt-2 p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Ваше место</p>
                    <p className="text-sm font-black font-mono text-white">
                      #{userRank.rank} <span className="text-gray-500 font-medium tracking-normal text-xs font-sans">из {userRank.total}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <TrendingUp className="w-3 h-3 text-[#0066FF]" />
                      <span className="text-[10px] text-[#0066FF] font-bold">В ТОП 10%</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-[10px] text-gray-500 py-6 italic">Рейтинг пока пуст</p>
          )}
          <button 
            onClick={() => onNavigate?.('community')}
            className="w-full mt-2 py-3 text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors flex items-center justify-center gap-1 group"
          >
            Стать амбассадором <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Monthly Giveaway Card */}
      <div className="bg-gradient-to-br from-[#121212] to-[#1a1a1a] rounded-[2rem] border border-white/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-[#0066FF]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="p-6 relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#fbbf24] to-[#fa9d1d] flex items-center justify-center shadow-lg shadow-[#fbbf24]/20 animate-bounce">
              <Gift className="w-6 h-6 text-black" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Розыгрыш NXC</h3>
              <p className="text-xs text-gray-500">Глобальный розыгрыш каждый месяц</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-gray-400">Призовой фонд:</span>
              <span className="text-[#fbbf24]">{import.meta.env.VITE_GIVEAWAY_PRIZE || '15,000'} NXC</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-gray-400">До конца розыгрыша:</span>
              <span className="text-white">
                {(() => {
                  const endOfMonth = new Date();
                  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
                  endOfMonth.setDate(1);
                  endOfMonth.setHours(0, 0, 0, 0);
                  const diff = Math.ceil((endOfMonth.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return `${diff} ${diff === 1 ? 'день' : diff < 5 ? 'дня' : 'дней'}`;
                })()}
              </span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden invisible"> {/* Hidden padding spacer */} </div>
            <button 
              onClick={handleEnterGiveaway}
              disabled={isEnteringGiveaway}
              className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white border border-white/10 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isEnteringGiveaway ? 'Запись...' : 'Участвовать'}
            </button>
          </div>
        </div>
      </div>

      {/* History Summary */}
      <div className="bg-[#121212] rounded-[2rem] border border-white/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#0066FF]" />
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Последняя активность</h3>
          </div>
          <button 
            onClick={() => onNavigate?.('setup')} 
            className="text-[10px] font-bold text-[#0066FF] hover:underline uppercase tracking-wider"
          >
            Все
          </button>
        </div>

        <div className="space-y-4">
          {isLoadingHistory ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length > 0 ? (
            transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    tx.amount > 0 ? 'bg-green-500/10' : 'bg-white/5'
                  }`}>
                    {tx.amount > 0 ? <Wallet className="w-4 h-4 text-green-500" /> : <Activity className="w-4 h-4 text-gray-500" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold font-sans text-white">{tx.description}</p>
                    <p className="text-[10px] font-mono text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className={`text-xs font-bold font-mono ${tx.amount > 0 ? 'text-green-500' : 'text-white'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount} <span className="text-[10px] font-sans opacity-50">NXC</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-xs text-gray-500 py-4 italic">Нет недавней активности</p>
          )}
        </div>
      </div>

      {/* QR Code Modal (Keep existing logic) */}
      <AnimatePresence>
        {showQr && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQr(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#121212] border border-white/10 rounded-[2.5rem] p-8 max-w-sm w-full relative"
            >
              <button 
                onClick={() => setShowQr(false)}
                className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-gray-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center space-y-6">
                <h2 className="text-xl font-bold">QR-код доступа</h2>
                <div className="p-5 bg-white rounded-[2rem]">
                  <QRCodeSVG 
                    value={user?.vless_link || ''} 
                    size={200}
                    level="H"
                  />
                </div>
                <button 
                  onClick={handleCopyLink}
                  className="w-full py-4 bg-white/5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                  {copied ? 'Скопировано!' : 'Копировать ссылку'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Server Selection Modal */}
      <AnimatePresence>
        {showServerSelect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowServerSelect(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#121212] border border-white/10 rounded-[2.5rem] p-6 max-w-sm w-full relative max-h-[80vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowServerSelect(false)}
                className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-gray-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-bold mb-2">Выбор сервера</h2>
                {SERVERS.map((server) => (
                  <button
                    key={server.code}
                    onClick={() => {
                      setSelectedServer(server);
                      setShowServerSelect(false);
                    }}
                    className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                      selectedServer.code === server.code
                        ? 'bg-[#0066FF]/20 border border-[#0066FF]/30'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{server.flag}</span>
                      <div className="text-left">
                        <p className="font-bold text-sm">{server.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{server.ping}</p>
                      </div>
                    </div>
                    {selectedServer.code === server.code && (
                      <div className="w-2 h-2 rounded-full bg-[#0066FF]" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
