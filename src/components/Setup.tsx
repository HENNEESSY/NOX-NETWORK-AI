import { useState, useCallback } from 'react'
import { Download, Copy, Check, ArrowRight, Shield, HelpCircle, PlayCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/useAuthStore'

const platforms = ['iOS', 'Android', 'Desktop'] as const

const steps: Record<string, string[]> = {
  iOS: [
    'Скачайте приложение Happ из App Store',
    'Откройте приложение и нажмите "+" или "Добавить конфигурацию"',
    'Вставьте VLESS-ключ (ниже) и нажмите "Сохранить"',
    'Включите VPN-переключатель',
  ],
  Android: [
    'Скачайте приложение Happ из Google Play',
    'Откройте приложение и нажмите "Добавить сервер"',
    'Вставьте VLESS-ключ и сохраните',
    'Нажмите кнопку подключения',
  ],
  Desktop: [
    'Скачайте Happ Desktop с официального сайта',
    'Установите и запустите приложение',
    'Нажмите "Import" и вставьте VLESS-ключ',
    'Подключитесь к серверу',
  ],
}

export default function Setup() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [platform, setPlatform] = useState<(typeof platforms)[number]>('iOS')
  const [keyCopied, setKeyCopied] = useState(false)
  const [showVideo, setShowVideo] = useState(false)

  // Use real key if available, otherwise fallback to mock
  const vlessKey = user?.vless_link || 'vless://noxuser@nl.nox.network:443?encryption=none&security=tls&type=ws#NOX-VPN'

  const copyKey = useCallback(() => {
    navigator.clipboard.writeText(vlessKey).catch(() => {})
    setKeyCopied(true)
    toast.success('Ключ скопирован!')
    setTimeout(() => setKeyCopied(false), 2000)
  }, [vlessKey])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[28px] font-extrabold tracking-tight">{t('Setup')}</h2>
        <p className="text-sm text-gray-500 mt-1">Настройте VPN за 2 минуты</p>
      </div>

      {/* Platform tabs — iOS segmented control */}
      <div className="flex gap-0 p-1 rounded-xl bg-[#121212] border border-white/5">
        {platforms.map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
              platform === p
                ? 'bg-white/10 shadow-sm text-white'
                : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Happ card */}
      <div className="bg-[#121212] rounded-3xl border border-white/5 p-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0066FF] to-blue-600 flex items-center justify-center shadow-lg">
          <Shield className="w-7 h-7 text-white" strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm">Happ</p>
          <p className="text-xs text-gray-500">Рекомендуемое приложение для {platform}</p>
        </div>
        <button
          className="px-4 py-2 rounded-full bg-[#0066FF] text-white text-xs font-bold flex items-center gap-1 shadow-md active:scale-95 transition-transform"
        >
          <Download className="w-3.5 h-3.5" />
          Скачать
        </button>
      </div>

      {/* Video Instruction Toggle */}
      <button
        onClick={() => setShowVideo(!showVideo)}
        className="w-full bg-[#121212] rounded-3xl border border-white/5 p-3 flex items-center justify-center gap-2 text-sm font-medium text-white active:scale-[0.98] transition-transform"
      >
        <PlayCircle className="w-5 h-5 text-[#0066FF]" />
        {showVideo ? 'Скрыть видеоинструкцию' : 'Смотреть видеоинструкцию'}
      </button>

      {/* Video Placeholder */}
      {showVideo && (
        <div className="bg-[#121212] rounded-3xl border border-white/5 overflow-hidden animate-fade-in-up aspect-video relative flex flex-col items-center justify-center bg-black/50">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
          <PlayCircle className="w-12 h-12 text-white/30 z-20 mb-4" />
          <p className="text-sm text-gray-400 z-20 text-center px-6">
            Видеоинструкция для {platform} будет доступна здесь
          </p>
          <p className="text-[10px] text-gray-500 z-20 mt-2">
            (Подготовка материала)
          </p>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-3">
        {steps[platform].map((step, i) => (
          <div
            key={`${platform}-${i}`}
            className="flex items-start gap-3 animate-fade-in-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="w-7 h-7 rounded-full bg-[#0066FF] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 shadow-sm">
              {i + 1}
            </div>
            <p className="text-sm leading-relaxed pt-1 text-gray-300">{step}</p>
          </div>
        ))}
      </div>

      {/* VLESS Key */}
      <div className="bg-[#121212] rounded-3xl border border-white/5 p-5 space-y-3">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ваш VLESS-ключ</h3>
        <div className="bg-white/5 rounded-xl p-3 font-mono text-[11px] break-all text-gray-400 leading-relaxed">
          {vlessKey}
        </div>
        <button
          onClick={copyKey}
          className="w-full py-3.5 rounded-xl bg-[#0066FF] text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-200 border border-[#0066FF]/30 shadow-[0_4px_16px_rgba(0,102,255,0.25)]"
        >
          {keyCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {keyCopied ? 'Скопировано!' : 'Скопировать ключ и открыть Happ'}
          {!keyCopied && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Support */}
      <button
        className="bg-[#121212] rounded-3xl border border-white/5 p-4 flex items-center justify-center gap-2 text-sm font-medium text-[#0066FF] active:scale-[0.98] transition-transform w-full"
      >
        <HelpCircle className="w-4 h-4" />
        Нужна помощь? Написать в поддержку
      </button>
    </div>
  )
}
