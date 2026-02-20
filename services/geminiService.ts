import { GoogleGenAI, Type } from "@google/genai";

interface ProductDetails {
  productName: string;
  category: string;
  unit: 'pc' | 'pack' | 'g' | 'kg' | 'L' | 'ml';
}

export class GeminiService {
  public static async identifyProductFromImage(base64Data: string): Promise<ProductDetails | null> {
    try {
      // Always use a named parameter for initialization
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const imagePart = {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data,
        },
      };

      const textPart = {
        text: `You are an expert in retail products for small convenience stores in the Philippines (sari-sari stores). 
        Identify the product in the image. Provide only a JSON object with 'productName' (string, be specific with brand and size if visible), 
        'category' (one of: 'Canned Goods', 'Snacks', 'Drinks', 'Toiletries', 'Household', 'Condiments', 'Instant Food', 'Others'), 
        and 'unit' (one of: 'pc', 'pack', 'g', 'kg', 'L', 'ml').`
      };

      // Updated model to gemini-3-flash-preview as per task type guidelines
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              productName: { 
                type: Type.STRING,
                description: 'The specific name of the identified product, including brand and size.'
              },
              category: { 
                type: Type.STRING,
                description: 'The retail category the product belongs to.'
              },
              unit: { 
                type: Type.STRING,
                description: 'The standard measurement unit for the product.'
              },
            },
            required: ["productName", "category", "unit"]
          },
        },
      });

      // Simple access to .text property on the response object
      const jsonString = response.text;
      if (!jsonString) {
        throw new Error("AI returned an empty response.");
      }
      
      const parsed = JSON.parse(jsonString);
      // Basic validation
      if (parsed.productName && parsed.category && parsed.unit) {
        return parsed as ProductDetails;
      } else {
        throw new Error("AI response is missing required fields.");
      }
    } catch (error) {
      console.error("GeminiService Error:", error);
      return null;
    }
  }
}