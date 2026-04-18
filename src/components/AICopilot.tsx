import { X, Sparkles, Bot, ArrowRight, Loader2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { apiFetch } from '../lib/api'

interface AICopilotProps {
  onClose: () => void
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

export default function AICopilot({ onClose }: AICopilotProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', text: 'Привет! Я NOX AI Copilot. Чем могу помочь с настройкой VPN или выбором сервера?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await apiFetch('/chat', {
        method: 'POST',
        body: JSON.stringify({ message: userMessage.text })
      });
      
      const aiMessage: Message = { id: (Date.now() + 1).toString(), role: 'ai', text: data.reply };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = { id: (Date.now() + 1).toString(), role: 'ai', text: 'Извините, произошла ошибка связи с сервером. Попробуйте позже.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="bg-[#141418]/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl h-[80vh] flex flex-col">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 shrink-0">
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
          <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-[#0066FF]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-[#0066FF]" />
                  </div>
                )}
                <div className={`glass-card rounded-2xl px-3.5 py-2.5 max-w-[85%] ${
                  msg.role === 'user' ? 'bg-[#0066FF]/20 border-[#0066FF]/30 rounded-tr-sm' : 'rounded-tl-sm'
                }`}>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#0066FF]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-[#0066FF]" />
                </div>
                <div className="glass-card rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-5 pb-5 pt-2 shrink-0">
            <div className="glass rounded-2xl flex items-center px-4 py-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Спросите AI..."
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-8 h-8 rounded-full bg-[#0066FF] flex items-center justify-center ml-2 shrink-0 shadow-[0_0_12px_rgba(0,102,255,0.3)] disabled:opacity-50 disabled:shadow-none transition-all"
              >
                {isLoading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <ArrowRight className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
