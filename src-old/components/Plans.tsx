import { useState } from 'react'
import { toast } from 'sonner'

const plans = [
  { months: 1, price: '399 ₽', perMonth: '399 ₽/мес', bonus: '+10 дней другу', badge: null as string | null },
  { months: 3, price: '999 ₽', perMonth: '333 ₽/мес', bonus: '+20 дней другу', badge: 'Выгодно' as string | null },
  { months: 6, price: '1 990 ₽', perMonth: '331 ₽/мес', bonus: '+1 месяц другу', badge: 'Популярный' as string | null },
  { months: 12, price: '2 990 ₽', perMonth: '249 ₽/мес', bonus: '+2 месяца другу', badge: 'Хит' as string | null },
]

type PaymentMethod = 'yookassa' | 'crypto'

export default function Plans() {
  const [selected, setSelected] = useState(3)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('yookassa')

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[28px] font-extrabold tracking-tight">Тарифы</h2>
        <p className="text-sm text-gray-500 mt-1">Выберите подходящий план</p>
      </div>

      {/* Plan Cards */}
      <div className="space-y-3">
        {plans.map((plan, i) => {
          const isHit = plan.badge === 'Хит'
          const isSelected = selected === i

          return (
            <button
              key={plan.months}
              onClick={() => setSelected(i)}
              className={`w-full text-left rounded-3xl p-5 transition-all duration-300 relative ${
                isHit ? 'gradient-border-hit' : 'glass-card'
              } ${isSelected ? 'ring-2 ring-[#0066FF] scale-[1.02]' : ''}`}
              style={isHit ? {
                border: '2px solid transparent',
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.05), rgba(255,255,255,0.05)), linear-gradient(135deg, #0066FF, #a855f7)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
              } : undefined}
            >
              {plan.badge && (
                <span className={`absolute -top-2.5 right-4 text-[10px] font-bold px-3 py-0.5 rounded-full ${
                  isHit
                    ? 'bg-gradient-to-r from-[#0066FF] to-[#a855f7] text-white'
                    : 'bg-[#0066FF]/10 text-[#0066FF]'
                }`}>
                  {plan.badge}
                </span>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">
                    {plan.months === 12 ? '1 Год' : `${plan.months} ${plan.months === 1 ? 'Месяц' : plan.months < 5 ? 'Месяца' : 'Месяцев'}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{plan.perMonth}</p>
                </div>
                <p className={`text-xl font-extrabold ${isHit ? 'text-[#0066FF]' : ''}`}>{plan.price}</p>
              </div>

              <p className="text-[10px] text-gray-600 mt-2">{plan.bonus}</p>
            </button>
          )
        })}
      </div>

      {/* Payment Method - Segmented Control */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Способ оплаты</h3>
        <div className="flex gap-1 p-1 rounded-2xl glass">
          {([
            { id: 'yookassa' as const, label: 'ЮKassa (РФ)' },
            { id: 'crypto' as const, label: 'Крипта (USDT/TON)' },
          ]).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setPaymentMethod(id)}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                paymentMethod === id
                  ? 'bg-[#0066FF] text-white shadow-lg'
                  : 'text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Pay Button */}
      <button
        onClick={() => toast('Переход к оплате…')}
        className="w-full py-4 rounded-2xl bg-[#0066FF] text-white font-bold text-base border border-[#0066FF]/30 shadow-[0_4px_20px_rgba(0,102,255,0.3)] hover:shadow-[0_4px_30px_rgba(0,102,255,0.4)] transition-all duration-300 active:scale-[0.98]"
      >
        Оплатить {plans[selected].price}
      </button>
    </div>
  )
}
