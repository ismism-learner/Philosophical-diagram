
import { GoogleGenAI, Type } from "@google/genai";
import { 
  TEXT_MODEL, 
  IMAGE_MODEL_SD, 
  IMAGE_MODEL_HD, 
  SYSTEM_INSTRUCTION_CLASSIC_ZH,
  SYSTEM_INSTRUCTION_CLASSIC_EN,
  SYSTEM_INSTRUCTION_MODERN_ZH,
  SYSTEM_INSTRUCTION_MODERN_EN,
  DEFAULT_DIRECT_TEMPLATE
} from "../constants";
import { VisualConcept, AppMode, Language, AISettings } from "../types";

// Helper to safely get API Key from environment without crashing if process is undefined
const getEnvKey = (): string => {
  try {
    // @ts-ignore
    return (typeof process !== 'undefined' && process.env?.API_KEY) || "";
  } catch {
    return "";
  }
};

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

// --- OCR PRE-PROCESSING ---
export function preprocessOCRText(text: string): string {
  // 1. Basic cleanup: split by newline, trim whitespace, filter empty lines
  const rawLines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (rawLines.length === 0) return "";

  const mergedLines: string[] = [];
  let buffer = "";

  // Regex for "Terminal Punctuation".
  const TERMINAL_PUNCTUATION = /[.!?。！?？][”"’'」』]?$/;

  for (const line of rawLines) {
    // Check for Headers (Markdown style #)
    const isHeader = line.startsWith('#');
    const bufferIsHeader = buffer.startsWith('#');

    // If buffer is empty, start a new block
    if (!buffer) {
      buffer = line;
      continue;
    }

    // HEADER RULES:
    if (isHeader || bufferIsHeader) {
        mergedLines.push(buffer);
        buffer = line;
        continue;
    }

    // PARAGRAPH MERGE RULES:
    if (TERMINAL_PUNCTUATION.test(buffer)) {
        mergedLines.push(buffer);
        buffer = line;
    } else {
        buffer += " " + line;
    }
  }

  if (buffer) {
    mergedLines.push(buffer);
  }

  return mergedLines.join('\n');
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
  prompt: string,
  aspectRatio: string
): Promise<string> {
  const url = `${baseUrl.replace(/\/+$/, '')}/images/generations`;
  
  // Note: OpenAI DALL-E 3 supports "1024x1024", "1024x1792" (Vertical), "1792x1024" (Wide)
  let size = "1024x1024";
  if (aspectRatio === '9:16' || aspectRatio === '3:4') size = "1024x1792";
  if (aspectRatio === '16:9' || aspectRatio === '4:3') size = "1792x1024";

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
      size: size,
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
    let result: VisualConcept | null = null;

    // 1. Custom / OpenAI Provider
    if (settings.textProvider === 'custom' || settings.textProvider === 'openai') {
        const key = settings.textApiKey || "";
        const url = settings.textBaseUrl || "https://api.openai.com/v1";
        const model = settings.textModel || "gpt-3.5-turbo";
        result = await fetchOpenAIChat(key, url, model, chunk, systemInstruction);
    } 
    // 2. Default Gemini Provider
    else {
      const ai = new GoogleGenAI({ apiKey: settings.textApiKey || getEnvKey() });
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
      if (jsonText) {
          result = JSON.parse(jsonText) as VisualConcept;
      }
    }

    if (!result) return null;

    // Direct Text Strategy: Overwrite visualPrompt
    if (settings.generationMode === 'direct') {
        const template = settings.directTemplate || DEFAULT_DIRECT_TEMPLATE;
        // Prepend an explicit English directive to ensure the model knows it needs to generate an image
        result.visualPrompt = `${template}\n\n【Source Content】:\n${chunk}`;
    }

    return result;

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
  retryCount = 0
): Promise<string> => {
  
  let finalPrompt = basePrompt;
  
  // Only add style prefix if NOT in direct mode
  if (settings.generationMode !== 'direct') {
    const stylePrefix = mode === AppMode.CLASSIC
        ? "Minimalist hand-drawn illustration, simple ink lines on parchment, woodblock print style, clean layout, no shading, schematic sketch: "
        : "Scientific publication figure, academic vector illustration, clean lines, high contrast, white background: ";
    finalPrompt = stylePrefix + basePrompt;
  }

  const aspectRatio = settings.aspectRatio || "3:4";

  try {
     // 1. Custom / OpenAI Provider
     if (settings.imageProvider === 'custom' || settings.imageProvider === 'openai') {
        const key = settings.imageApiKey || "";
        const url = settings.imageBaseUrl || "https://api.openai.com/v1";
        const model = settings.imageModel || "dall-e-3";
        return await fetchOpenAIImage(key, url, model, finalPrompt, aspectRatio);
    }

    // 2. Default Gemini Provider
    const ai = new GoogleGenAI({ apiKey: settings.imageApiKey || getEnvKey() });
    let model = settings.imageModel || IMAGE_MODEL_SD;

    // --- CASE A: IMAGEN MODELS ---
    if (model.toLowerCase().startsWith("imagen")) {
        const response = await ai.models.generateImages({
            model: model,
            prompt: finalPrompt,
            config: {
                numberOfImages: 1,
                aspectRatio: aspectRatio,
                outputMimeType: "image/jpeg"
            }
        });
        
        const b64 = response.generatedImages?.[0]?.image?.imageBytes;
        if (b64) return `data:image/jpeg;base64,${b64}`;
        throw new Error("No image data found in Imagen response");
    }

    // --- CASE B: GEMINI MODELS ---
    const imageConfig: any = {
      aspectRatio: aspectRatio,
    };

    if (model.includes("pro")) {
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
    
    // Iterate parts to find inlineData. 
    // If we find text instead, capture it to report as error.
    let textResponse = "";
    for (const part of parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
      if (part.text) {
        textResponse += part.text;
      }
    }
    
    // If loop finishes without returning, we failed to get an image.
    if (textResponse) {
        // The model likely refused to generate an image and explained why.
        throw new Error(`Model returned text instead of image (Safety/Policy): "${textResponse.substring(0, 100)}..."`);
    }

    throw new Error("No image data found in Gemini response");

  } catch (error: any) {
    if (isRetryableError(error)) {
      const backoff = Math.min(Math.pow(2, retryCount) * 5000, 60000);
      console.warn(`Image generation rate limited. Waiting ${backoff}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return generateConceptImage(basePrompt, mode, settings, retryCount + 1);
    }
    console.error("Image generation failed:", error);
    throw error;
  }
};

// --- SETTINGS MANAGEMENT ---
const SETTINGS_KEY = 'philo_flow_settings_v2';

export const saveSettings = (settings: AISettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const loadSettings = (): AISettings => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (!parsed.generationMode) parsed.generationMode = 'auto';
            if (!parsed.directTemplate) parsed.directTemplate = DEFAULT_DIRECT_TEMPLATE;
            if (!parsed.aspectRatio) parsed.aspectRatio = "3:4"; 
            return parsed;
        } catch (e) { console.error("Failed to parse settings", e); }
    }
    // Default
    return {
        textProvider: 'gemini',
        textModel: TEXT_MODEL,
        textApiKey: getEnvKey(),
        imageProvider: 'gemini',
        imageModel: IMAGE_MODEL_SD,
        imageApiKey: getEnvKey(),
        generationMode: 'auto',
        directTemplate: DEFAULT_DIRECT_TEMPLATE,
        aspectRatio: "3:4"
    };
};