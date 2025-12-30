
import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI client with the API key from environment variables.
// Following the guideline: const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getAiInsights(productName: string, specs: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Proporciona una recomendación experta rápida de 2 frases en español para un comprador de un ${productName} with estas especificaciones: ${specs}. ¿Es una buena oferta en el mercado actual?`,
    });
    // Correctly accessing .text property on GenerateContentResponse as per guidelines.
    return response.text;
  } catch (error) {
    console.error("AI Insight Error:", error);
    return "Recomendaciones de IA no disponibles en este momento.";
  }
}

export async function getMarketComparison(query: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Como experto en tecnología, sugiere qué iPhone es mejor para: "${query}". Explica brevemente por qué en español.`,
    });
    // Correctly accessing .text property on GenerateContentResponse as per guidelines.
    return response.text;
  } catch (error) {
    console.error("Gemini Search Error:", error);
    return null;
  }
}
