import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Image as ImageIcon, MessageSquare, Lock, Loader2, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { useAi } from '../hooks/useAi';
import { useTransactions } from '../hooks/useTransactions';
import { TEXT_MODELS, PHOTO_MODELS } from '../constants/aiConfig';
import { TextMode } from './ai/TextMode';
import { PhotoMode } from './ai/PhotoMode';
import { ModelModal } from './ai/ModelModal';

const AIHub = () => {
  const { user } = useAuthStore();
  const { 
    generateText, 
    generatePhoto, 
    isTextGenerating, 
    isPhotoGenerating, 
    history, 
    historyLoading, 
    fetchHistory 
  } = useAi();
  const { 
    transactions, 
    loading: transactionsLoading, 
    fetchTransactions 
  } = useTransactions();

  const [mode, setMode] = useState<'text' | 'photo' | 'nxc'>('text');
  const [shadowMode, setShadowMode] = useState(false);
  
  // Text State
  const [textPrompt, setTextPrompt] = useState('');
  const [selectedTextModel, setSelectedTextModel] = useState(TEXT_MODELS[0].id);
  const [isTextModelModalOpen, setIsTextModelModalOpen] = useState(false);

  // Photo State
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('none');
  const [aspectRatio, setAspectRatio] = useState('square_hd');
  const [selectedModel, setSelectedModel] = useState(PHOTO_MODELS[0].id);
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const styleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHistory();
    fetchTransactions();
  }, [fetchHistory, fetchTransactions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (styleRef.current && !styleRef.current.contains(event.target as Node)) {
        setIsStyleOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasSubscription = (user?.balance_days || 0) > 0;
  const getAdjustedPrice = (price: number) => hasSubscription ? Math.ceil(price * 0.75) : price;

  const handleGenerateText = async () => {
    const price = TEXT_MODELS.find(m => m.id === selectedTextModel)?.price || 0;
    const res = await generateText(textPrompt, selectedTextModel, getAdjustedPrice(price), shadowMode);
    if (res) setTextPrompt('');
  };

  const handleGeneratePhoto = async () => {
    const price = PHOTO_MODELS.find(m => m.id === selectedModel)?.price || 0;
    const res = await generatePhoto(prompt, style, aspectRatio, selectedModel, getAdjustedPrice(price), shadowMode);
    if (res) setPrompt('');
  };

  const textHistory = history.filter(h => h.type === 'text');
  const photoHistory = history.filter(h => h.type === 'image');

  return (
    <div className="flex flex-col h-full gap-6 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            ИИ Хаб
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Создавай контент с помощью нейросетей
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#121212] px-3 py-1.5 rounded-full border border-white/5">
          <Sparkles className="w-4 h-4 text-[#00f2ff]" />
          <span className="text-sm font-bold font-mono text-[#00f2ff]">{user?.nxc_balance || 0} NXC</span>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex bg-[#121212] p-1 rounded-2xl border border-white/5">
        <button
          onClick={() => setMode('text')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all ${
            mode === 'text' ? 'bg-[#0066FF] text-white shadow-[0_0_20px_rgba(0,102,255,0.3)]' : 'text-gray-400'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Текст
        </button>
        <button
          onClick={() => setMode('photo')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all ${
            mode === 'photo' ? 'bg-[#a855f7] text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'text-gray-400'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Фото
        </button>
        <button
          onClick={() => setMode('nxc')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all ${
            mode === 'nxc' ? 'bg-[#fbbf24] text-black shadow-[0_0_20px_rgba(251,191,36,0.3)]' : 'text-gray-400'
          }`}
        >
          <History className="w-4 h-4" />
          NXC
        </button>
      </div>

      {/* Shadow Mode Toggle */}
      <div className="flex items-center justify-between bg-[#121212] p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${shadowMode ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-400'}`}>
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-sm">Теневой режим</h3>
            <p className="text-xs text-gray-500">История не сохраняется</p>
          </div>
        </div>
        <button 
          onClick={() => setShadowMode(!shadowMode)}
          className={`w-12 h-6 rounded-full transition-colors relative ${shadowMode ? 'bg-purple-500' : 'bg-gray-700'}`}
        >
          <motion.div 
            className="w-5 h-5 bg-white rounded-full absolute top-0.5"
            animate={{ left: shadowMode ? '26px' : '2px' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-[#121212] rounded-3xl border border-white/5 p-5 flex flex-col">
        <AnimatePresence mode="wait">
          {mode === 'nxc' ? (
            <motion.div
              key="nxc"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col gap-4"
            >
              <h3 className="text-sm font-bold text-white mb-2 ml-1">История баланса</h3>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                {transactionsLoading ? (
                  <div className="flex items-center justify-center p-10 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Загрузка...
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                    История транзакций пуста
                  </div>
                ) : (
                  transactions.map((t) => (
                    <div key={t.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/[0.07] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${t.amount > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {t.amount > 0 ? '+' : ''}{t.amount}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white tracking-tight">{t.description}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5 font-mono">{new Date(t.created_at).toLocaleString('ru-RU')}</p>
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-600 bg-white/5 px-2 py-1 rounded-lg uppercase font-bold tracking-tighter">
                        {t.type}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          ) : mode === 'text' ? (
            <div className="flex-1 flex flex-col gap-6">
              <TextMode
                textPrompt={textPrompt}
                setTextPrompt={setTextPrompt}
                selectedTextModel={selectedTextModel}
                onOpenModelModal={() => setIsTextModelModalOpen(true)}
                isGenerating={isTextGenerating}
                onGenerate={handleGenerateText}
                hasSubscription={hasSubscription}
                getAdjustedPrice={getAdjustedPrice}
              />
              {!shadowMode && (
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 min-h-[300px]">
                  {historyLoading ? (
                    <div className="flex items-center justify-center p-10 text-gray-400">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Загрузка истории...
                    </div>
                  ) : textHistory.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                      История пуста
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {textHistory.map((item) => (
                        <div key={item.id} className="bg-[#1E1E1E] border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                          <div className="text-sm font-semibold text-white/50 bg-[#2A2A2A] p-3 rounded-xl">
                            <MessageSquare className="w-4 h-4 inline mr-2 mb-0.5 text-blue-500/50" />
                            {item.prompt}
                          </div>
                          <div className="text-sm text-gray-300 leading-relaxed font-normal whitespace-pre-wrap pl-1">
                            {item.result}
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-gray-500 pt-2 border-t border-white/5 mt-1">
                            <span>{new Date(item.created_at).toLocaleString('ru-RU')}</span>
                            <span>{TEXT_MODELS.find(m => m.id === item.model)?.name || item.model}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-1">
              <PhotoMode
                prompt={prompt}
                setPrompt={setPrompt}
                selectedModel={selectedModel}
                onOpenModelModal={() => setIsModelModalOpen(true)}
                style={style}
                setStyle={setStyle}
                isStyleOpen={isStyleOpen}
                setIsStyleOpen={setIsStyleOpen}
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                isGenerating={isPhotoGenerating}
                onGenerate={handleGeneratePhoto}
                hasSubscription={hasSubscription}
                getAdjustedPrice={getAdjustedPrice}
                styleRef={styleRef}
              />
              {!shadowMode && photoHistory.length > 0 && (
                <div className="mt-4 border-t border-white/5 pt-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-purple-400" />
                    Недавние генерации
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {photoHistory.slice(0, 4).map(item => (
                       <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-[#2A2A2A] border border-white/5 group">
                         {item.result === 'pending' ? (
                           <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-purple-400/50">
                             <Loader2 className="w-6 h-6 animate-spin" />
                             <span className="text-[10px]">В процессе...</span>
                           </div>
                         ) : (
                           <>
                             <img src={item.result} alt={item.prompt} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center text-xs text-white">
                               <p className="line-clamp-3">{item.prompt}</p>
                             </div>
                           </>
                         )}
                       </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      <ModelModal
        isOpen={isTextModelModalOpen}
        onClose={() => setIsTextModelModalOpen(false)}
        title="Текстовая модель"
        models={TEXT_MODELS}
        selectedId={selectedTextModel}
        onSelect={setSelectedTextModel}
      />

      <ModelModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        title="Модель генерации"
        models={PHOTO_MODELS}
        selectedId={selectedModel}
        onSelect={setSelectedModel}
      />
    </div>
  );
};

export default AIHub;
