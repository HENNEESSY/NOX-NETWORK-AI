import { X, Sparkles, Bot, ArrowRight } from 'lucide-react'

interface AICopilotProps {
  onClose: () => void
}

export default function AICopilot({ onClose }: AICopilotProps) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="bg-[#141418]/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl max-h-[70vh] flex flex-col">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#0066FF]/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#0066FF]" />
              </div>
              <h2 className="text-base font-semibold text-white">NOX AI Copilot</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition-transform">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-3">
            {/* AI Message */}
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#0066FF]/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-[#0066FF]" />
              </div>
              <div className="glass-card rounded-2xl rounded-tl-md px-3.5 py-2.5 max-w-[85%]">
                <p className="text-sm text-gray-300 leading-relaxed">
                  Привет! Заметил нестабильность на сервере DE. Переключить тебя на NL для лучшего пинга?
                </p>
                <span className="text-[10px] text-gray-600 mt-1 block">Только что</span>
              </div>
            </div>

            {/* Quick Action */}
            <div className="flex gap-2.5 pl-9.5">
              <button className="bg-[#0066FF] hover:bg-[#0055DD] active:scale-[0.97] transition-all rounded-2xl px-4 py-2.5 text-sm font-medium text-white flex items-center gap-2 border border-[#0066FF]/30 shadow-[0_4px_16px_rgba(0,102,255,0.25)]">
                Переключить на NL
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Input */}
          <div className="px-5 pb-5 pt-2">
            <div className="glass rounded-2xl flex items-center px-4 py-3">
              <input
                type="text"
                placeholder="Спросите AI..."
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
              />
              <button className="w-8 h-8 rounded-full bg-[#0066FF] flex items-center justify-center ml-2 shrink-0 shadow-[0_0_12px_rgba(0,102,255,0.3)]">
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
