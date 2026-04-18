import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, Zap, Users, Smartphone, Sparkles, ChevronRight, 
  ShieldCheck, BrainCircuit, Bot, Home, CreditCard, Settings
} from 'lucide-react'
import { Toaster } from 'sonner'
import { useTranslation } from 'react-i18next'
import HomeTab from './components/Home'
import PlansTab from './components/Plans'
import CommunityTab from './components/Community'
import SetupTab from './components/Setup'
import AIHub from './components/AIHub'
import AdminTab from './components/admin/AdminTab'
import AICopilot from './components/AICopilot'
import { useAuthStore } from './store/useAuthStore'

type Tab = 'home' | 'aihub' | 'plans' | 'setup' | 'community' | 'admin'

// Animation variants
const pageTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
}

function App() {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [showCopilot, setShowCopilot] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const { user, login, isLoading } = useAuthStore()

  // Fallback: Check admin by Telegram ID from multiple sources
  const isAdminByTgId = () => {
    // Try Telegram WebApp
    const tg = window.Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user?.id === 7278863161) {
      return true;
    }
    
    // Try URL parameters (tgWebAppData)
    const urlParams = new URLSearchParams(window.location.search);
    const tgData = urlParams.get('tgWebAppData');
    if (tgData) {
      try {
        const decoded = decodeURIComponent(tgData);
        if (decoded.includes('7278863161')) {
          return true;
        }
      } catch {}
    }
    
    // Check hash fragment
    const hash = window.location.hash;
    if (hash.includes('7278863161') || hash.includes('user%3D')) {
      return true;
    }
    
    // Debug mode from localStorage
    if (localStorage.getItem('nox_debug_admin') === 'true') {
      return true;
    }
    
    return false;
  }

  // Debug user role
  useEffect(() => {
    if (user) {
      console.log('[App] User role:', user.role, '| Has admin access:', user.role === 'admin' || user.role === 'moderator');
    }
    
    // Debug admin detection
    console.log('[App] Checking admin access...');
    console.log('[App] Telegram WebApp:', window.Telegram?.WebApp?.initDataUnsafe?.user?.id);
    console.log('[App] URL hash:', window.location.hash.slice(0, 100));
    console.log('[App] isAdminByTgId:', isAdminByTgId());
    console.log('[App] hasAdminAccess:', user && (user.role === 'admin' || user.role === 'moderator') || isAdminByTgId());
  }, [user])

  // Force reload and re-login on version change (cache busting)
  useEffect(() => {
    const APP_VERSION = '2.5.3'; // Bump this to force reload
    const lastVersion = localStorage.getItem('nox_app_version');
    if (lastVersion !== APP_VERSION) {
      localStorage.setItem('nox_app_version', APP_VERSION);
      // Clear token to force re-login with new role
      localStorage.removeItem('nox_token');
      if (lastVersion) {
        window.location.reload();
        return;
      }
    }
  }, [])

  // Telegram WebApp integration
  useEffect(() => {
    // Initialize Telegram WebApp
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation();
      
      // Set header color
      tg.setHeaderColor('#050505');
      tg.setBackgroundColor('#050505');
      
      // Disable vertical swipes to prevent closing
      tg.disableVerticalSwipes?.();
    }

    login()
    const tgLang = tg?.initDataUnsafe?.user?.language_code;
    if (tgLang && ['en', 'ru'].includes(tgLang)) {
      i18n.changeLanguage(tgLang);
    }

    // Handle viewport changes
    const handleViewport = () => {
      if (tg) {
        const { isExpanded: expanded } = tg;
        setIsExpanded(expanded);
      }
    };
    
    tg?.onEvent('viewportChanged', handleViewport);
    return () => {
      tg?.offEvent('viewportChanged', handleViewport);
    };
  }, [login, i18n])

  const baseTabs = [
    { id: 'home' as Tab, label: 'Главная', Icon: Home, gradient: 'from-[#0066FF] to-[#00C9FF]' },
    { id: 'aihub' as Tab, label: 'ИИ', Icon: BrainCircuit, gradient: 'from-purple-500 to-pink-500' },
    { id: 'plans' as Tab, label: 'Тарифы', Icon: CreditCard, gradient: 'from-green-500 to-emerald-500' },
    { id: 'setup' as Tab, label: 'Настройка', Icon: Smartphone, gradient: 'from-orange-500 to-red-500' },
    { id: 'community' as Tab, label: 'Сообщество', Icon: Users, gradient: 'from-cyan-500 to-blue-500' },
  ]

  // Admin tab - only visible for admin/moderator
  const adminTab = { 
    id: 'admin' as Tab, 
    label: 'Админ', 
    Icon: ShieldCheck, 
    gradient: 'from-[#fbbf24] to-[#f59e0b]',
    isAdmin: true 
  };

  // Check admin access by user role OR Telegram ID fallback
  const hasAdminAccess = user && (user.role === 'admin' || user.role === 'moderator') || isAdminByTgId();
  
  const tabs = hasAdminAccess 
    ? [...baseTabs, adminTab]
    : baseTabs;

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <HomeTab onNavigate={(tab: 'plans' | 'aihub' | 'setup' | 'community') => setActiveTab(tab)} />
      case 'aihub': return <AIHub />
      case 'plans': return <PlansTab />
      case 'setup': return <SetupTab />
      case 'community': return <CommunityTab />
      case 'admin': return <AdminTab />
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-[#050505] items-center justify-center space-y-4">
        <motion.div 
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0066FF] to-[#00C9FF] flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Shield className="w-8 h-8 text-white" />
        </motion.div>
        <motion.p 
          className="text-sm text-gray-500"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Загрузка NOX NETWORK...
        </motion.p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#050505] relative max-w-lg mx-auto overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0066FF]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.header 
        className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-white/5"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0066FF] to-[#00C9FF] flex items-center justify-center shadow-lg shadow-[#0066FF]/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">NOX NETWORK</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-gray-400">Secure Connection</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10">
            v2.5
          </span>
        </div>
      </motion.header>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="px-5 pt-4 pb-32"
          >
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modern Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md mx-auto bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl z-30 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between px-2 py-2">
          {tabs.map(({ id, label, Icon, gradient }) => {
            const isActive = activeTab === id;
            return (
              <motion.button
                key={id}
                onClick={() => setActiveTab(id)}
                whileTap={{ scale: 0.9 }}
                className={`relative flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-all duration-300 ${
                  isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="navHighlight"
                    className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-20 rounded-2xl`}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className={`relative z-10 p-1.5 rounded-xl transition-all ${
                  isActive ? `bg-gradient-to-r ${gradient} shadow-lg` : ''
                }`}>
                  <Icon 
                    className={`w-5 h-5 transition-all ${isActive ? 'text-white' : ''}`} 
                    strokeWidth={isActive ? 2.5 : 1.5} 
                  />
                </div>
                <span className={`relative z-10 text-[9px] font-semibold transition-all ${
                  isActive ? 'text-white' : ''
                }`}>
                  {label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* AI Copilot FAB */}
      <AnimatePresence>
        {!showCopilot && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowCopilot(true)}
            className="fixed bottom-28 right-6 z-40 w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 flex items-center justify-center"
          >
            <Bot className="w-6 h-6" />
            <motion.span 
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-bold"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              AI
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* AI Copilot Modal */}
      <AnimatePresence>
        {showCopilot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCopilot(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 h-[85vh] bg-[#0a0a0a] rounded-t-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full" />
              <AICopilot onClose={() => setShowCopilot(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(18, 18, 18, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            borderRadius: '1rem',
            padding: '12px 16px',
          },
        }}
      />
    </div>
  )
}

export default App
