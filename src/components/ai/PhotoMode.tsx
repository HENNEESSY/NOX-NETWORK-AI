import React from 'react';
import { ImageIcon, Clock, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PHOTO_MODELS, STYLES, ASPECT_RATIOS } from '../../constants/aiConfig';

interface PhotoModeProps {
  prompt: string;
  setPrompt: (val: string) => void;
  selectedModel: string;
  onOpenModelModal: () => void;
  style: string;
  setStyle: (val: string) => void;
  isStyleOpen: boolean;
  setIsStyleOpen: (val: boolean) => void;
  aspectRatio: string;
  setAspectRatio: (val: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  hasSubscription: boolean;
  getAdjustedPrice: (p: number) => number;
  styleRef: React.RefObject<HTMLDivElement>;
}

export const PhotoMode: React.FC<PhotoModeProps> = ({
  prompt,
  setPrompt,
  selectedModel,
  onOpenModelModal,
  style,
  setStyle,
  isStyleOpen,
  setIsStyleOpen,
  aspectRatio,
  setAspectRatio,
  isGenerating,
  onGenerate,
  hasSubscription,
  getAdjustedPrice,
  styleRef
}) => {
  const activeModel = PHOTO_MODELS.find(m => m.id === selectedModel) || PHOTO_MODELS[0];

  const getRatioIcon = (id: string) => {
    switch(id) {
      case 'square_hd': return <div className="w-[22px] h-[22px] border-[1.5px] border-current rounded-[4px]" />;
      case 'landscape_16_9': return <div className="w-[26px] h-[15px] border-[1.5px] border-current rounded-[4px]" />;
      case 'portrait_16_9': return <div className="w-[15px] h-[26px] border-[1.5px] border-current rounded-[4px]" />;
      case 'landscape_4_3': return <div className="w-[24px] h-[18px] border-[1.5px] border-current rounded-[4px]" />;
      case 'portrait_4_3': return <div className="w-[18px] h-[24px] border-[1.5px] border-current rounded-[4px]" />;
      default: return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex-1 flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-300">Описание (Промпт)</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Опишите, что вы хотите увидеть..."
          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors resize-none h-24"
        />
      </div>

      <div className="bg-[#1E1E1E] border border-white/5 rounded-2xl p-4">
        <label className="text-sm font-medium text-gray-300 mb-3 block">Модель генерации</label>
        <button
          onClick={onOpenModelModal}
          className="w-full bg-[#2A2A2A] hover:bg-[#333333] border border-white/5 rounded-xl p-3 text-left flex items-center gap-3 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white font-bold shrink-0">
            {activeModel.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white truncate">{activeModel.name}</span>
              <div className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-gray-300 shrink-0">
                <Clock className="w-3 h-3" />
                {activeModel.time}
              </div>
            </div>
            <p className="text-xs text-gray-400 truncate mt-0.5">{activeModel.desc}</p>
          </div>
          <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
        </button>
      </div>

      <div className="mt-2">
        <button
          onClick={onGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full py-3.5 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 disabled:cursor-not-allowed active:scale-95 transition-all rounded-xl text-sm font-medium text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Генерация...
            </>
          ) : (
            <>
              Сгенерировать
              <div className="flex flex-col items-center ml-2">
                <span className={`text-xs ${hasSubscription ? 'text-gray-400 line-through scale-75' : 'text-white/70'}`}>
                  - {activeModel.price} NXC
                </span>
                {hasSubscription && (
                  <span className="text-[10px] text-green-400 font-bold -mt-1">
                    {getAdjustedPrice(activeModel.price)} NXC
                  </span>
                )}
              </div>
            </>
          )}
        </button>
      </div>

      <div className="bg-[#1E1E1E] border border-white/5 rounded-2xl p-4" ref={styleRef}>
        <label className="text-sm font-medium text-gray-300 mb-3 block">Стиль</label>
        <div className="relative">
          <button
            onClick={() => setIsStyleOpen(!isStyleOpen)}
            className="w-full bg-[#2A2A2A] hover:bg-[#333333] border border-white/5 rounded-xl p-3.5 text-sm text-white flex items-center justify-between focus:outline-none transition-colors"
          >
            {STYLES.find(s => s.id === style)?.label}
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isStyleOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {isStyleOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="absolute z-20 w-full mt-2 bg-[#2A2A2A] border border-white/10 rounded-xl overflow-hidden shadow-2xl"
              >
                <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                  {STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setStyle(s.id); setIsStyleOpen(false); }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                        style === s.id ? 'bg-[#1a73e8] text-white' : 'text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-[#1E1E1E] border border-white/5 rounded-2xl p-4">
        <label className="text-sm font-medium text-gray-300 mb-3 block">Формат (Aspect Ratio)</label>
        <div className="flex flex-wrap gap-2">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.id}
              onClick={() => setAspectRatio(ratio.id)}
              className={`flex flex-col items-center justify-center gap-2.5 w-[72px] h-[76px] rounded-xl transition-all ${
                aspectRatio === ratio.id 
                  ? 'bg-[#3A3A3A] text-white shadow-sm' 
                  : 'bg-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              {getRatioIcon(ratio.id)}
              <span className="text-[11px] font-medium tracking-wide">{ratio.label}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
