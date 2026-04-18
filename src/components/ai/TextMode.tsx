import React from 'react';
import { MessageSquare, Clock, ChevronDown, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { TEXT_MODELS } from '../../constants/aiConfig';

interface TextModeProps {
  textPrompt: string;
  setTextPrompt: (val: string) => void;
  selectedTextModel: string;
  onOpenModelModal: () => void;
  isGenerating: boolean;
  onGenerate: () => void;
  hasSubscription: boolean;
  getAdjustedPrice: (p: number) => number;
}

export const TextMode: React.FC<TextModeProps> = ({
  textPrompt,
  setTextPrompt,
  selectedTextModel,
  onOpenModelModal,
  isGenerating,
  onGenerate,
  hasSubscription,
  getAdjustedPrice
}) => {
  const activeModel = TEXT_MODELS.find(m => m.id === selectedTextModel) || TEXT_MODELS[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex-1 flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-300">Ваш запрос</label>
        <textarea
          value={textPrompt}
          onChange={(e) => setTextPrompt(e.target.value)}
          placeholder="Напиши пост про нейросети..."
          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors resize-none h-24"
        />
      </div>

      <div className="bg-[#1E1E1E] border border-white/5 rounded-2xl p-4">
        <label className="text-sm font-medium text-gray-300 mb-3 block">Модель ИИ</label>
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
          disabled={isGenerating || !textPrompt.trim()}
          className="w-full py-3.5 bg-[#0066FF] hover:bg-blue-600 disabled:bg-[#0066FF]/50 disabled:cursor-not-allowed active:scale-95 transition-all rounded-xl text-sm font-medium text-white shadow-[0_0_20px_rgba(0,102,255,0.3)] flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Генерация...
            </>
          ) : (
            <>
              Отправить
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
    </motion.div>
  );
};
