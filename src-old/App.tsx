import { useState } from 'react'
import { Shield, Zap, Users, Smartphone, Sparkles, ChevronRight } from 'lucide-react'
import { Toaster } from 'sonner'
import HomeTab from './components/Home'
import PlansTab from './components/Plans'
import CommunityTab from './components/Community'
import SetupTab from './components/Setup'
import AICopilot from './components/AICopilot'

type Tab = 'home' | 'plans' | 'community' | 'setup'

const tabs: { id: Tab; label: string; Icon: typeof Shield }[] = [
  { id: 'home', label: 'Главная', Icon: Shield },
  { id: 'plans', label: 'Тарифы', Icon: Zap },
  { id: 'community', label: 'Комьюнити', Icon: Users },
  { id: 'setup', label: 'Гайд', Icon: Smartphone },
]

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [aiOpen, setAiOpen] = useState(false)

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <HomeTab />
      case 'plans': return <PlansTab />
      case 'community': return <CommunityTab />
      case 'setup': return <SetupTab />
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0A0A0C] relative max-w-lg mx-auto">
      {/* Status Bar */}
      <div className="glass flex items-center justify-center gap-2 py-2.5 px-4 rounded-none">
        <span className="w-[6px] h-[6px] rounded-full bg-[#4ade80] animate-pulse" />
        <span className="text-[11px] font-medium text-gray-400 tracking-wide">
          System Status: All systems operational
        </span>
        <ChevronRight className="w-3 h-3 text-gray-600" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-28">
        <div key={activeTab} className="animate-fade-in-up">
          {renderTab()}
        </div>
      </div>

      {/* FAB - AI Copilot */}
      <button
        onClick={() => setAiOpen(true)}
        className="absolute bottom-24 right-5 w-14 h-14 rounded-full bg-[#0066FF] flex items-center justify-center shadow-[0_0_20px_rgba(0,102,255,0.4)] active:scale-95 transition-transform z-30 animate-float"
      >
        <Sparkles className="w-6 h-6 text-white" />
      </button>

      {/* Floating Bottom Navigation */}
      <nav className="fixed bottom-4 left-4 right-4 max-w-[calc(100%-2rem)] mx-auto glass rounded-2xl z-20">
        <div className="flex items-center justify-around py-2 pb-[max(env(safe-area-inset-bottom,0px),8px)]">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl transition-all duration-300 ${
                activeTab === id ? 'text-[#0066FF]' : 'text-gray-500/60'
              }`}
            >
              <Icon className="w-[22px] h-[22px]" strokeWidth={activeTab === id ? 2.2 : 1.5} />
              <span className="text-[10px] font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* AI Copilot Modal */}
      {aiOpen && <AICopilot onClose={() => setAiOpen(false)} />}

      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            border: '0.5px solid rgba(255,255,255,0.1)',
            color: '#fff',
            borderRadius: '1rem',
          },
        }}
      />
    </div>
  )
}

export default App
