export const TEXT_MODELS = [
  { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', time: '1s', desc: 'Ультра-быстрая (Eco)', icon: 'L', price: 2 },
  { id: 'google/gemini-1.5-flash', name: 'Gemini 1.5 Flash', time: '1s', desc: 'Универсальная (Standart)', icon: 'G', price: 5 },
  { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B', time: '2s', desc: 'Лучшее понимание RU (Pro)', icon: 'Q', price: 10 },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', time: '2s', desc: 'Идеально для текстов', icon: 'C', price: 12 },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', time: '3s', desc: 'Максимальный интеллект (Expert)', icon: 'A', price: 35 },
];

export const PHOTO_MODELS = [
  { id: 'seedream_4_0', name: 'Seedream 4.0', time: '10s', desc: 'Быстрые наброски (Fast)', icon: 'S', price: 15 },
  { id: 'qwen', name: 'Qwen-image', time: '15s', desc: 'Сбалансированная (Balanced)', icon: 'Q', price: 20 },
  { id: 'nano_banana', name: 'Nano Banana', time: '30s', desc: 'Фотореализм Flux (Ultra)', icon: 'B', price: 35 },
  { id: 'nano_banana_pro', name: 'Nano Banana Pro', time: '60s', desc: 'Элитное качество (Elite)', icon: 'P', price: 50 },
  { id: 'kling_o3', name: 'Kling O3', time: '90s', desc: 'Кинематографичный 4K (Cinema)', icon: 'K', isNew: true, price: 80 },
];

export const STYLES = [
  { id: 'none', label: 'Без стиля' },
  { id: 'realistic', label: 'Реализм' },
  { id: 'anime', label: 'Аниме' },
  { id: 'abstract', label: 'Абстракция' },
  { id: 'cyberpunk', label: 'Киберпанк' },
];

export const ASPECT_RATIOS = [
  { id: 'square_hd', label: '1:1' },
  { id: 'landscape_16_9', label: '16:9' },
  { id: 'portrait_16_9', label: '9:16' },
  { id: 'landscape_4_3', label: '4:3' },
  { id: 'portrait_4_3', label: '3:4' },
];

export const SUBSCRIPTION_DISCOUNT = 0.75; // 25% OFF
