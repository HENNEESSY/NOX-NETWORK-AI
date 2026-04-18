import { useState, useCallback } from 'react'
import { Copy, Check, Shield, Zap, Star, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

const referralSteps = [
  { friends: 1, reward: '+10 дн' },
  { friends: 3, reward: '+20 дн' },
  { friends: 5, reward: '+1 мес' },
  { friends: 10, reward: '+2 мес' },
]

const channels = [
  {
    icon: Shield,
    title: 'Тех-канал',
    subtitle: 'Status',
    desc: 'Сбои, фиксы, блокировки',
    color: 'from-orange-400 to-orange-500',
  },
  {
    icon: Zap,
    title: 'Новости',
    subtitle: 'NOX News',
    desc: 'Обновления, локации',
    color: 'from-[#0066FF] to-blue-600',
  },
  {
    icon: Star,
    title: 'Отзывы',
    subtitle: 'Reviews',
    desc: 'Социальные доказательства',
    color: 'from-yellow-400 to-amber-500',
  },
]

export default function Community() {
  const [copied, setCopied] = useState(false)
  const currentInvites = 1

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText('https://t.me/nox_bot?start=ref_abc123').catch(() => {})
    setCopied(true)
    toast.success('Ссылка скопирована!')
    setTimeout(() => setCopied(false), 2000)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[28px] font-extrabold tracking-tight">Community & Support</h2>
        <p className="text-sm text-gray-500 mt-1">Приглашай друзей — получай месяцы бесплатно</p>
      </div>

      {/* Referral */}
      <div className="glass-card p-5 space-y-5">
        <h3 className="font-bold text-base">Реферальная программа</h3>

        <div className="relative pt-1">
          <div className="h-1.5 rounded-full bg-white/10" />
          <div className="h-1.5 rounded-full bg-[#0066FF] absolute top-1 left-0 transition-all duration-500" style={{ width: `${(currentInvites / 10) * 100}%` }} />

          <div className="flex justify-between mt-4">
            {referralSteps.map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                  i <= currentInvites - 1
                    ? 'bg-[#0066FF] text-white shadow-[0_0_12px_rgba(0,102,255,0.4)]'
                    : 'bg-white/10 text-gray-500'
                }`}>
                  {step.friends}
                </div>
                <span className="text-[10px] text-gray-500 font-medium text-center leading-tight">{step.reward}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={copyLink}
          className="w-full py-3.5 rounded-xl bg-[#0066FF] text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-200 border border-[#0066FF]/30 shadow-[0_4px_16px_rgba(0,102,255,0.25)]"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Скопировано!' : 'Скопировать реферальную ссылку'}
        </button>
      </div>

      {/* Channels */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Оставайся на связи</h3>
        <div className="grid gap-3">
          {channels.map((ch, i) => (
            <button
              key={i}
              className="glass-card p-4 flex items-center gap-4 hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
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
            </button>
          ))}
        </div>
      </div>

      {/* Bonus note */}
      <div className="glass-card p-4 text-center">
        <p className="text-xs text-gray-500">
          За регистрацию по ссылке вы оба получаете <span className="font-bold text-[#0066FF]">+3 дня</span>
        </p>
      </div>
    </div>
  )
}
