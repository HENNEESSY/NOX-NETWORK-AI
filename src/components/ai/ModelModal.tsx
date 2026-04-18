import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock } from 'lucide-react';

interface ModelOption {
  id: string;
  name: string;
  time: string;
  desc: string;
  icon: string | React.ReactNode;
  isNew?: boolean;
}

interface ModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  models: ModelOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export const ModelModal: React.FC<ModelModalProps> = ({
  isOpen,
  onClose,
  title,
  models,
  selectedId,
  onSelect
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-[#1E1E1E] rounded-t-3xl border-t border-white/10 p-5 max-h-[80vh] flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">{title}</h2>
              <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar flex-1 -mx-2 px-2 pb-4 space-y-2">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelect(model.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all border ${
                    selectedId === model.id 
                      ? 'bg-white/10 border-white/20' 
                      : 'bg-transparent border-transparent hover:bg-white/5'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-[#2A2A2A] flex items-center justify-center text-white font-bold shrink-0 relative">
                    {model.icon}
                    {model.isNew && (
                      <div className="absolute -top-2 -right-2 bg-pink-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                        NEW
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">{model.name}</span>
                      <div className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-gray-300 shrink-0">
                        <Clock className="w-3 h-3" />
                        {model.time}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 leading-snug">{model.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
