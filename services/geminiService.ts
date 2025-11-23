import { GoogleGenAI, Type } from "@google/genai";
import { TEXT_MODEL, IMAGE_MODEL, SYSTEM_INSTRUCTION_ANALYST } from "../constants";
import { VisualConcept } from "../types";

// Initialize the client
// API Key is guaranteed to be in process.env.API_KEY per instructions
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Step 1: Analyze the philosophical text and generate prompts.
 * We use Gemini 3 Pro for its superior reasoning capabilities to understand deep philosophy.
 */
export const analyzePhilosophyText = async (text: string): Promise<VisualConcept[]> => {
  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: text,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_ANALYST,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              conceptTitle: { type: Type.STRING },
              explanation: { type: Type.STRING },
              visualPrompt: { type: Type.STRING },
            },
            required: ["conceptTitle", "explanation", "visualPrompt"],
          },
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No analysis generated");

    return JSON.parse(jsonText) as VisualConcept[];
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

/**
 * Step 2: Generate an image for a specific concept using Nano Banana (Flash Image).
 * Includes retry logic for transient 500 errors.
 */
export const generateConceptImage = async (visualPrompt: string, retryCount = 0): Promise<string> => {
  try {
    // Nano Banana (gemini-2.5-flash-image) usage
    // We use the explicit 'parts' structure to ensure compatibility.
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [{ text: visualPrompt }]
      },
      config: {
        // Nano banana specific config
        imageConfig: {
            aspectRatio: "16:9",
            // imageSize is not supported for flash-image
        }
      }
    });

    // Iterate through parts to find the image
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
        throw new Error("No candidates returned");
    }

    const parts = candidates[0].content.parts;
    for (const part of parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data found in response");
  } catch (error: any) {
    // Retry on 500 Internal Error up to 2 times
    if (error?.status === 500 && retryCount < 2) {
      console.warn(`Image generation failed with 500, retrying (${retryCount + 1}/2)...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return generateConceptImage(visualPrompt, retryCount + 1);
    }

    console.error("Image generation failed:", error);
    throw error;
  }
};