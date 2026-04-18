import { fal } from '@fal-ai/client';
import { ENV } from '../config';

fal.config({
  credentials: () => ENV.FAL_KEY,
});

export interface GenerateImageParams {
  prompt: string;
  style?: string;
  aspect_ratio?: "square_hd" | "square" | "portrait_4_3" | "portrait_16_9" | "landscape_4_3" | "landscape_16_9";
  model?: string;
  webhookUrl: string;
}

export const generateImageAsync = async (params: GenerateImageParams) => {
  const { prompt, style, aspect_ratio, model, webhookUrl } = params;
  
  let finalPrompt = prompt;
  if (style && style !== 'none') {
    finalPrompt = `${prompt}, ${style} style`;
  }

  let falModel = 'fal-ai/flux/dev';
  if (model === 'nano_banana_pro' || model === 'kling_o3') {
    falModel = 'fal-ai/flux-pro';
  } else if (model === 'nano_banana_2' || model === 'seedream_5_lite') {
    falModel = 'fal-ai/flux/schnell';
  } else if (model === 'qwen' || model === 'seedream_4_5') {
    falModel = 'fal-ai/fast-sdxl';
  }

  const response = await fal.queue.submit(falModel, {
    input: {
      prompt: finalPrompt,
      image_size: aspect_ratio || 'square_hd',
      num_inference_steps: falModel.includes('schnell') ? 4 : 28,
      guidance_scale: 3.5,
      num_images: 1,
      enable_safety_checker: true
    },
    webhookUrl,
  });

  return response;
};
