
import { GoogleGenAI, Type } from "@google/genai";
import { 
  TEXT_MODEL, 
  IMAGE_MODEL_SD, 
  IMAGE_MODEL_HD, 
  SYSTEM_INSTRUCTION_CLASSIC_ZH,
  SYSTEM_INSTRUCTION_CLASSIC_EN,
  SYSTEM_INSTRUCTION_MODERN_ZH,
  SYSTEM_INSTRUCTION_MODERN_EN
} from "../constants";
import { VisualConcept, AppMode, Language, AISettings } from "../types";

// Helper to determine if an error corresponds to a rate limit or temporary server issue
function isRetryableError(error: any): boolean {
  const status = error?.status || error?.response?.status || error?.code;
  const message = error?.message || JSON.stringify(error);
  
  // Check for specific status codes
  if (status === 429 || status === 503 || status === 500) return true;
  
  // Check for error text patterns common in Gemini API responses
  if (
    message.includes("RESOURCE_EXHAUSTED") || 
    message.includes("429") || 
    message.includes("quota") ||
    message.includes("Overloaded")
  ) {
    return true;
  }
  
  return false;
}

export function chunkText(text: string): string[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  return lines.filter(line => line.trim().length > 0);
}

// --- OPENAI COMPATIBLE FETCH HELPERS ---

async function fetchOpenAIChat(
  apiKey: string, 
  baseUrl: string, 
  model: string, 
  prompt: string, 
  systemInstruction: string
): Promise<VisualConcept> {
  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemInstruction + "\nRespond in strict JSON format." },
        { role: 'user', content: prompt }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content in response");
  
  return JSON.parse(content) as VisualConcept;
}

async function fetchOpenAIImage(
  apiKey: string, 
  baseUrl: string, 
  model: string, 
  prompt: string
): Promise<string> {
  const url = `${baseUrl.replace(/\/+$/, '')}/images/generations`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json"
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI Image API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image data in response");
  
  return `data:image/png;base64,${b64}`;
}


// --- MAIN SERVICE FUNCTIONS ---

/**
 * Step 1: Analyze text using configured provider
 */
export const analyzeSingleChunk = async (
  chunk: string, 
  mode: AppMode, 
  language: Language, 
  settings: AISettings,
  retryCount = 0
): Promise<VisualConcept | null> => {
  
  let systemInstruction = "";
  if (mode === AppMode.CLASSIC) {
    systemInstruction = language === Language.ZH ? SYSTEM_INSTRUCTION_CLASSIC_ZH : SYSTEM_INSTRUCTION_CLASSIC_EN;
  } else {
    systemInstruction = language === Language.ZH ? SYSTEM_INSTRUCTION_MODERN_ZH : SYSTEM_INSTRUCTION_MODERN_EN;
  }

  try {
    // 1. Custom / OpenAI Provider
    if (settings.textProvider === 'custom' || settings.textProvider === 'openai') {
        const key = settings.textApiKey || "";
        const url = settings.textBaseUrl || "https://api.openai.com/v1";
        const model = settings.textModel || "gpt-3.5-turbo";
        return await fetchOpenAIChat(key, url, model, chunk, systemInstruction);
    }

    // 2. Default Gemini Provider
    const ai = new GoogleGenAI({ apiKey: settings.textApiKey || process.env.API_KEY || "" });
    const model = settings.textModel || TEXT_MODEL;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: chunk }] 
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT, 
          properties: {
            conceptTitle: { type: Type.STRING },
            explanation: { type: Type.STRING },
            visualPrompt: { type: Type.STRING },
          },
          required: ["conceptTitle", "explanation", "visualPrompt"],
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) return null;
    return JSON.parse(jsonText) as VisualConcept;

  } catch (error: any) {
    if (isRetryableError(error)) {
        const backoff = Math.min(Math.pow(2, retryCount) * 5000, 60000);
        console.warn(`Text analysis rate limited. Waiting ${backoff}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, backoff));
        return analyzeSingleChunk(chunk, mode, language, settings, retryCount + 1);
    }
    console.warn(`Analysis failed for chunk: "${chunk.substring(0, 20)}..."`, error);
    throw error;
  }
};

/**
 * Step 2: Generate image using configured provider
 */
export const generateConceptImage = async (
  basePrompt: string, 
  mode: AppMode,
  settings: AISettings,
  isHD: boolean = false, 
  retryCount = 0
): Promise<string> => {
  
  const stylePrefix = mode === AppMode.CLASSIC
    ? "Minimalist hand-drawn illustration, simple ink lines on parchment, woodblock print style, clean layout, no shading, schematic sketch: "
    : "Minimalist technical diagram, vector art, clean white background, black lines, high contrast, schematic representation, professional: ";

  const finalPrompt = stylePrefix + basePrompt;

  try {
     // 1. Custom / OpenAI Provider
     if (settings.imageProvider === 'custom' || settings.imageProvider === 'openai') {
        const key = settings.imageApiKey || "";
        const url = settings.imageBaseUrl || "https://api.openai.com/v1";
        const model = settings.imageModel || "dall-e-3";
        return await fetchOpenAIImage(key, url, model, finalPrompt);
    }

    // 2. Default Gemini Provider
    // Re-instantiate to use latest key
    const ai = new GoogleGenAI({ apiKey: settings.imageApiKey || process.env.API_KEY || "" });
    
    // Determine model. If user manually set a model name in settings (and it's not the default), use it.
    // Otherwise switch between SD/HD constants.
    let model = settings.imageModel;
    if (!model || model === IMAGE_MODEL_SD || model === IMAGE_MODEL_HD) {
        model = isHD ? IMAGE_MODEL_HD : IMAGE_MODEL_SD;
    }

    const imageConfig: any = {
      aspectRatio: "16:9",
    };

    // Only apply imageSize for the Pro model or if user explicitly wants HD
    if (isHD || model.includes("pro")) {
      imageConfig.imageSize = "2K";
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: finalPrompt }]
      },
      config: {
        imageConfig: imageConfig
      }
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) throw new Error("No candidates returned");

    const parts = candidates[0].content.parts;
    for (const part of parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in response");

  } catch (error: any) {
    if (isRetryableError(error)) {
      const backoff = Math.min(Math.pow(2, retryCount) * 5000, 60000);
      console.warn(`Image generation rate limited. Waiting ${backoff}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return generateConceptImage(basePrompt, mode, settings, isHD, retryCount + 1);
    }
    console.error("Image generation failed:", error);
    throw error;
  }
};

// --- SETTINGS MANAGEMENT ---
const SETTINGS_KEY = 'philo_flow_settings_v2';

export const saveSettings = (settings: AISettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    // Backwards compatibility for single key
    if (settings.textProvider === 'gemini' && settings.textApiKey) {
        process.env.API_KEY = settings.textApiKey;
    }
};

export const loadSettings = (): AISettings => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) { console.error("Failed to parse settings", e); }
    }
    // Default
    return {
        textProvider: 'gemini',
        textModel: TEXT_MODEL,
        textApiKey: process.env.API_KEY || '',
        imageProvider: 'gemini',
        imageModel: IMAGE_MODEL_SD,
        imageApiKey: process.env.API_KEY || ''
    };
};
