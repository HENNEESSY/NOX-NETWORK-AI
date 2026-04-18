import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Shield, Wallet } from 'lucide-react'
import { useTonConnectUI, TonConnectButton, useTonWallet } from '@tonconnect/ui-react'
import { apiFetch } from '../lib/api'

const subscriptions = [
  { months: 1, price: '399 ₽', nxc: 250, desc: 'VPN (2 устройства)', badge: null as string | null },
  { months: 3, price: '999 ₽', nxc: 800, desc: 'VPN (3 устройства), Приоритет', badge: null as string | null },
  { months: 6, price: '1 990 ₽', nxc: 1800, desc: 'VPN (3 устройства), Скидка на NXC', badge: null as string | null },
  { months: 12, price: '2 990 ₽', nxc: 3500, desc: 'VPN (5 устройств), Макс. приоритет', badge: 'PREMIUM' as string | null },
]

const tokenPacks = [
  { amount: 100, price: '99 ₽', stars: 99, badge: null as string | null },
  { amount: 500, price: '399 ₽', stars: 399, badge: null as string | null },
  { amount: 2000, price: '1 290 ₽', stars: 1290, badge: null as string | null },
  { amount: 5000, price: '2 990 ₽', stars: 2990, badge: 'Выгодно' as string | null },
  { amount: 15000, price: '7 990 ₽', stars: 7990, badge: 'Макс. объем' as string | null },
]

type PaymentMethod = 'yookassa' | 'stars' | 'ton'
type PlanType = 'subscriptions' | 'tokens'

export default function Plans() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [planType, setPlanType] = useState<PlanType>('subscriptions')
  const [selectedSub, setSelectedSub] = useState(3)
  const [selectedToken, setSelectedToken] = useState(3)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('yookassa')
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePlanTypeChange = (type: PlanType) => {
    setPlanType(type)
    if (type === 'subscriptions') {
      setPaymentMethod('yookassa')
    }
  }

  const handlePay = async () => {
    setIsProcessing(true);
    let planId = '';
    
    if (planType === 'subscriptions') {
      const subMap = ['1_month', '3_months', '6_months', '1_year'];
      planId = subMap[selectedSub] || '1_year';
    } else {
      const packMap = ['pack_100', 'pack_500', 'pack_2000', 'pack_5000', 'pack_15000'];
      planId = packMap[selectedToken] || 'pack_5000';
    }

    try {
      if (paymentMethod === 'ton') {
        if (!wallet) {
          toast.error('Сначала подключите кошелек');
          return;
        }

        // Get price based on selected plan
        const priceStr = planType === 'subscriptions' 
          ? subscriptions[selectedSub].price 
          : tokenPacks[selectedToken].price;
        
        // Parse price (remove spaces and non-digits)
        const rubAmount = parseInt(priceStr.replace(/[^\d]/g, ''), 10);
        
        // Convert to nanoton (approximate: 1 TON ≈ 200-300 RUB, so 1 RUB ≈ 0.004 TON)
        // Using 1 TON = 250 RUB as a reasonable rate
        const tonAmount = Math.max(1, Math.ceil((rubAmount / 250) * 1e9)); // min 1 TON
        const amountInNanotons = String(tonAmount);
        
        const receiverAddress = import.meta.env.VITE_TON_RECEIVER_ADDRESS || 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
        
        const transaction = {
          validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
          messages: [
            {
              address: receiverAddress,
              amount: amountInNanotons,
              payload: btoa(`NOX:${planId}:${Date.now()}`), // Comment with plan info
            },
          ],
        };

        toast.loading('Ожидание подтверждения в кошельке...', { id: 'ton-pay' });
        const result = await tonConnectUI.sendTransaction(transaction);
        
        if (result) {
          toast.success('Транзакция отправлена!', { id: 'ton-pay' });
          await apiFetch('/payments/verify-ton', {
             method: 'POST',
             body: JSON.stringify({ boc: result.boc, planId, type: planType })
          });
        }
        return;
      }

      // For Yookassa / Stars: Send message to bot and close WebApp
      toast.loading('Генерация счета в чате...', { id: 'bot-pay' });
      
      const res = await apiFetch('/pay', {
        method: 'POST',
        body: JSON.stringify({ planId, type: planType, method: paymentMethod, silent: true })
      });

      if (res.status === 'success') {
        toast.success('Счет отправлен в чат!', { id: 'bot-pay' });
        
        setTimeout(() => {
          if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.close();
          }
        }, 1500);
      } else {
        toast.error(res.error || 'Ошибка при создании счета', { id: 'bot-pay' });
      }

    } catch (error) {
      toast.error('Произошла ошибка при обработке платежа', { id: 'bot-pay' });
    } finally {
      setIsProcessing(false);
    }
  }

  const getPrice = (item: { price: string, stars?: number }) => {
    return paymentMethod === 'stars' && item.stars ? `${item.stars} ⭐️` : item.price;
  }

  const paymentMethods = planType === 'tokens'
    ? [
        { id: 'yookassa' as const, label: 'ЮKassa' },
        { id: 'ton' as const, label: 'TON / OKX' },
        { id: 'stars' as const, label: 'TG Stars ⭐️' },
      ]
    : [
        { id: 'yookassa' as const, label: 'ЮKassa' },
        { id: 'ton' as const, label: 'TON / OKX' },
      ]

  return (
    <div className="space-y-5 h-full flex flex-col">
      <div>
        <h2 className="text-[28px] font-extrabold tracking-tighter">Тарифы</h2>
        <p className="text-sm text-gray-500 mt-1 uppercase tracking-widest font-bold opacity-60">Выберите подходящий план</p>
      </div>

      {/* Plan Type Toggle */}
      <div className="flex bg-[#121212] p-1 rounded-2xl border border-white/5">
        <button
          onClick={() => handlePlanTypeChange('subscriptions')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
            planType === 'subscriptions' ? 'bg-[#0066FF] text-white shadow-[0_0_20px_rgba(0,102,255,0.3)]' : 'text-gray-400'
          }`}
        >
          <Shield className="w-4 h-4" />
          Подписки
        </button>
        <button
          onClick={() => handlePlanTypeChange('tokens')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
            planType === 'tokens' ? 'bg-[#fbbf24] text-black shadow-[0_0_20px_rgba(251,191,36,0.3)]' : 'text-gray-400'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Токены NXC
        </button>
      </div>

      {/* Plan Cards */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4 custom-scrollbar pr-1">
        <AnimatePresence mode="wait">
          {planType === 'subscriptions' ? (
            <motion.div
              key="subs"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {subscriptions.map((plan, i) => {
                const isPremium = plan.badge === 'PREMIUM'
                const isSelected = selectedSub === i

                return (
                  <button
                    key={plan.months}
                    onClick={() => setSelectedSub(i)}
                    className={`w-full text-left rounded-3xl p-5 transition-all duration-300 relative ${
                      isPremium ? 'gradient-border-hit' : 'bg-[#121212] border border-white/5'
                    } ${isSelected ? 'ring-2 ring-[#0066FF] scale-[1.02]' : ''}`}
                    style={isPremium ? {
                      border: '2px solid transparent',
                      backgroundImage: 'linear-gradient(#121212, #121212), linear-gradient(135deg, #0066FF, #a855f7, #f97316)',
                      backgroundOrigin: 'border-box',
                      backgroundClip: 'padding-box, border-box',
                    } : undefined}
                  >
                    {plan.badge && (
                      <span className={`absolute top-0 right-0 text-[10px] font-bold px-3 py-1 rounded-bl-2xl rounded-tr-3xl ${
                        isPremium
                          ? 'bg-gradient-to-r from-[#0066FF] via-[#a855f7] to-[#f97316] text-white'
                          : 'bg-[#0066FF]/10 text-[#0066FF]'
                      }`}>
                        {plan.badge}
                      </span>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg">
                          {plan.months === 12 ? '1 ГОД' : `${plan.months} ${plan.months === 1 ? 'МЕСЯЦ' : plan.months < 5 ? 'МЕСЯЦА' : 'МЕСЯЦЕВ'}`}
                        </p>
                        <p className={`text-xs mt-0.5 ${isPremium ? 'text-white/80' : 'text-gray-500'}`}>{plan.desc}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-black font-mono tracking-tighter ${isPremium ? 'text-white' : ''}`}>{getPrice(plan)}</p>
                        <p className="text-[10px] text-[#00f2ff] font-bold uppercase tracking-wider mt-1 font-mono">+{plan.nxc} NXC</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </motion.div>
          ) : (
            <motion.div
              key="tokens"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {tokenPacks.map((pack, i) => {
                const isSelected = selectedToken === i
                const isBest = pack.badge === 'Выгодно'

                return (
                  <button
                    key={pack.amount}
                    onClick={() => setSelectedToken(i)}
                    className={`w-full text-left rounded-3xl p-5 transition-all duration-300 relative bg-[#121212] border border-white/5 ${
                      isSelected ? 'ring-2 ring-[#fbbf24] scale-[1.02]' : ''
                    }`}
                  >
                    {pack.badge && (
                      <span className={`absolute top-0 right-0 text-[10px] font-bold px-3 py-1 rounded-bl-2xl rounded-tr-3xl ${
                        isBest ? 'bg-[#fbbf24] text-black' : 'bg-white/10 text-white'
                      }`}>
                        {pack.badge}
                      </span>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#00f2ff]" />
                        <p className="font-black text-lg text-[#00f2ff] tracking-tight">
                          {pack.amount} NXC
                        </p>
                      </div>
                      <p className="text-xl font-black font-mono tracking-tighter">{getPrice(pack)}</p>
                    </div>
                  </button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Payment Method - Segmented Control */}
      <div className="space-y-3 mt-auto pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Способ оплаты</h3>
          {paymentMethod === 'ton' && (
            <div className="scale-75 origin-right">
              <TonConnectButton />
            </div>
          )}
        </div>
        <div className="flex gap-1 p-1 rounded-2xl bg-[#121212] border border-white/5 overflow-x-auto custom-scrollbar">
          {paymentMethods.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setPaymentMethod(id)}
              className={`flex-1 min-w-[90px] py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                paymentMethod === id
                  ? 'bg-[#0066FF] text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Pay Button */}
        <button
          onClick={handlePay}
          disabled={isProcessing}
          className="w-full py-4 rounded-2xl bg-[#0066FF] hover:bg-blue-600 disabled:bg-[#0066FF]/50 disabled:cursor-not-allowed text-white font-extrabold text-base border border-[#0066FF]/30 shadow-[0_4px_20px_rgba(0,102,255,0.3)] hover:shadow-[0_4px_30px_rgba(0,102,255,0.4)] transition-all duration-300 active:scale-95 uppercase tracking-wider"
        >
          {isProcessing ? 'Обработка...' : `Оплатить ${planType === 'subscriptions' ? getPrice(subscriptions[selectedSub]) : getPrice(tokenPacks[selectedToken])}`}
        </button>
      </div>
    </div>
  )
}
