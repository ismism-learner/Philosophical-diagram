
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
import { VisualConcept, AppMode, Language } from "../types";

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

/**
 * Helper: Splits text strictly by newlines as requested.
 * Filters out empty lines.
 */
export function chunkText(text: string): string[] {
  // Normalize newlines and split
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  // Filter out empty lines or whitespace-only lines
  return lines.filter(line => line.trim().length > 0);
}

/**
 * Step 1: Analyze a single chunk of text.
 * Returns the concept or null if failed.
 * Includes retry logic for rate limits.
 */
export const analyzeSingleChunk = async (chunk: string, mode: AppMode, language: Language, retryCount = 0): Promise<VisualConcept | null> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() || process.env.API_KEY });
  
  // Select the appropriate instruction based on mode and language
  let systemInstruction = "";
  if (mode === AppMode.CLASSIC) {
    systemInstruction = language === Language.ZH ? SYSTEM_INSTRUCTION_CLASSIC_ZH : SYSTEM_INSTRUCTION_CLASSIC_EN;
  } else {
    systemInstruction = language === Language.ZH ? SYSTEM_INSTRUCTION_MODERN_ZH : SYSTEM_INSTRUCTION_MODERN_EN;
  }

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: {
        parts: [{ text: chunk }] // Analyze this specific line/paragraph
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT, // Expecting a single object for single chunk
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
    
    // Retry on rate limit or internal server error
    if (isRetryableError(error)) {
        // Infinite retry strategy for 429s (wait and try again)
        // Backoff: 5s, 10s, 20s... max 60s
        const backoff = Math.min(Math.pow(2, retryCount) * 5000, 60000);
        console.warn(`Text analysis rate limited (429). Waiting ${backoff}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, backoff));
        return analyzeSingleChunk(chunk, mode, language, retryCount + 1);
    }
    
    console.warn(`Analysis failed for chunk: "${chunk.substring(0, 20)}..."`, error);
    throw error;
  }
};

/**
 * Step 2: Generate an image. Prepend style keywords based on mode.
 */
export const generateConceptImage = async (
  basePrompt: string, 
  mode: AppMode,
  isHD: boolean = false, 
  retryCount = 0
): Promise<string> => {
  // Re-instantiate to ensure we pick up the latest API key from window/env if changed
  const ai = new GoogleGenAI({ apiKey: getApiKey() || process.env.API_KEY });

  const model = isHD ? IMAGE_MODEL_HD : IMAGE_MODEL_SD;
  
  // Enforce style via prompt injection
  const stylePrefix = mode === AppMode.CLASSIC
    ? "High quality vintage technical drawing, da vinci sketch style, ink on parchment, intricate details: "
    : "Minimalist technical diagram, vector art, clean white background, black lines, high contrast, schematic representation, professional: ";

  const finalPrompt = stylePrefix + basePrompt;

  const imageConfig: any = {
      aspectRatio: "16:9",
  };

  if (isHD) {
      imageConfig.imageSize = "2K";
  }

  try {
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
    if (!candidates || candidates.length === 0) {
        throw new Error("No candidates returned");
    }

    const parts = candidates[0].content.parts;
    for (const part of parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
      // Check if there's text rejection (e.g. safety)
      if (part.text) {
        console.warn("Model returned text instead of image:", part.text);
      }
    }

    throw new Error("No image data found in response");
  } catch (error: any) {
    // Retry on rate limit or internal server error
    if (isRetryableError(error)) {
      // Infinite retry strategy for 429s
      const backoff = Math.min(Math.pow(2, retryCount) * 5000, 60000);
      console.warn(`Image generation rate limited (429). Waiting ${backoff}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return generateConceptImage(basePrompt, mode, isHD, retryCount + 1);
    }
    console.error("Image generation failed:", error);
    throw error;
  }
};

// --- Dynamic API Key Management ---
let _dynamicApiKey: string | null = null;
const STORAGE_KEY = 'philo_flow_gemini_key';

export const setApiKey = (key: string, persist: boolean = false) => {
  _dynamicApiKey = key;
  // Fallback for libraries that strictly look at process.env
  if (typeof process !== 'undefined' && process.env) {
    process.env.API_KEY = key;
  }

  if (persist) {
    localStorage.setItem(STORAGE_KEY, key);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
};

export const initApiKey = () => {
  const savedKey = localStorage.getItem(STORAGE_KEY);
  if (savedKey) {
    _dynamicApiKey = savedKey;
    if (typeof process !== 'undefined' && process.env) {
      process.env.API_KEY = savedKey;
    }
    return true;
  }
  return false;
};

export const getApiKey = () => {
  return _dynamicApiKey || process.env.API_KEY;
};

export const hasUserApiKey = () => {
  return !!_dynamicApiKey;
};
