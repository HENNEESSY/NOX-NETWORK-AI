import { useState, useCallback, useMemo } from 'react'
import { Copy, Check, Shield, Zap, Star, ChevronRight, Sparkles, Users, Gift, TrendingUp, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '../store/useAuthStore'

const referralSteps = [
  { friends: 1, reward: '+10 дней', key: '1' },
  { friends: 5, reward: '+500 NXC', key: '5' },
  { friends: 10, reward: '+30 дней', key: '10' },
  { friends: 50, reward: 'VIP Статус', key: '50' },
]

const channels = [
  {
    icon: Shield,
    title: 'Тех-канал',
    subtitle: 'Status',
    desc: 'Сбои, фиксы, блокировки',
    color: 'from-orange-400 to-orange-500',
    link: 'https://t.me/nox_status',
  },
  {
    icon: Zap,
    title: 'Новости',
    subtitle: 'NOX News',
    desc: 'Обновления, локации',
    color: 'from-[#0066FF] to-blue-600',
    link: 'https://t.me/nox_news_vpn',
  },
  {
    icon: Star,
    title: 'Отзывы',
    subtitle: 'Reviews',
    desc: 'Социальные доказательства',
    color: 'from-yellow-400 to-amber-500',
    link: 'https://t.me/nox_reviews_vpn',
  },
]

export default function Community() {
  const { user } = useAuthStore()
  const [copied, setCopied] = useState(false)
  
  const referralCount = user?.referral_count || 0
  const ambassadorPoints = user?.ambassador_points || 0
  const referralUrl = `https://t.me/nox_bot?start=ref_${user?.tg_id || 'guest'}`

  const nextStep = useMemo(() => {
    return referralSteps.find(step => referralCount < step.friends) || referralSteps[referralSteps.length - 1]
  }, [referralCount])

  const progress = useMemo(() => {
    const total = nextStep.friends
    return Math.min(100, (referralCount / total) * 100)
  }, [referralCount, nextStep])

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(referralUrl).catch(() => {})
    setCopied(true)
    toast.success('Ссылка скопирована!')
    setTimeout(() => setCopied(false), 2000)
  }, [referralUrl])

  const shareLink = () => {
    const text = `🚀 Получи 7 дней премиум VPN от NOX NETWORK и 150 NXC бонусом! \n\nБезопасность, ИИ и высокая скорость. Регистрируйся по ссылке: \n${referralUrl}`
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(text)}`)
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-[28px] font-extrabold tracking-tight">Сообщество и поддержка</h2>
        <p className="text-sm text-gray-500 mt-1">Твой путь амбассадора: приглашай и зарабатывай</p>
      </div>

      {/* Referral Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#121212] rounded-3xl border border-white/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-[#0066FF]" />
            <span className="text-[10px] uppercase font-black text-gray-500 tracking-wider">Друзей</span>
          </div>
          <p className="text-2xl font-black">{referralCount}</p>
        </div>
        <div className="bg-[#121212] rounded-3xl border border-white/5 p-4 border-r-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] uppercase font-black text-gray-500 tracking-wider">Очков</span>
          </div>
          <p className="text-2xl font-black">{ambassadorPoints}</p>
        </div>
      </div>

      {/* Main Referral Card */}
      <div className="bg-[#121212] rounded-3xl border border-white/10 p-5 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
          <Sparkles className="w-24 h-24 text-white" />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Партнерская программа</h3>
            <p className="text-xs text-gray-500">До цели: {nextStep.friends - referralCount} друзей</p>
          </div>
          <Gift className="w-8 h-8 text-[#fbbf24] animate-bounce-slow" />
        </div>

        {/* Progress Bar */}
        <div className="space-y-4">
          <div className="relative h-2 rounded-full bg-white/5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#0066FF] to-[#a855f7] transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(0,102,255,0.3)]" 
              style={{ width: `${progress}%` }} 
            />
          </div>

          <div className="grid grid-cols-4 gap-1">
            {referralSteps.map((step, i) => (
              <div key={step.key} className="flex flex-col items-center gap-1.5 opacity-80">
                <div className={`w-1.5 h-1.5 rounded-full transition-all ${referralCount >= step.friends ? 'bg-[#fbbf24]' : 'bg-white/10'}`} />
                <span className={`text-[9px] font-black uppercase text-center leading-tight ${
                  referralCount >= step.friends ? 'text-[#fbbf24]' : 'text-gray-600'
                }`}>
                  {step.reward}
                </span>
                <span className="text-[8px] text-gray-500">{step.friends}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={copyLink}
            className="w-full py-4 rounded-2xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Готово' : 'Копировать ссылку'}
          </button>
          
          <button
            onClick={shareLink}
            className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform border border-white/5"
          >
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Пригласить в Telegram
          </button>
        </div>
      </div>

      {/* Channels */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Оставайся на связи</h3>
        <div className="grid gap-3">
          {channels.map((ch, i) => (
            <a
              key={i}
              href={ch.link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#121212] rounded-3xl border border-white/5 p-4 flex items-center gap-4 hover:bg-white/5 transition-all duration-300 active:scale-[0.98]"
            >
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${ch.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <ch.icon className="w-5 h-5 text-white" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">{ch.title}</p>
                  <span className="text-[10px] text-gray-600">{ch.subtitle}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{ch.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
            </a>
          ))}
        </div>
      </div>

      {/* Bonus note */}
      <div className="bg-[#121212] rounded-3xl border border-white/5 p-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-amber-500/5 blur-xl pointer-events-none" />
        <p className="text-xs text-gray-400 relative z-10">
          За регистрацию по твоей ссылке друг получает <span className="font-black text-[#fbbf24]">+7 дней</span> и <span className="font-black text-[#0066FF]">150 NXC</span> бонусом.
        </p>
      </div>
    </div>
  )
}
