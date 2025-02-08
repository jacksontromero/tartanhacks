import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { env } from "~/env";
import { CUISINE_TYPES } from "~/constants/cuisines";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel(
  { 
    model: "gemini-2.0-flash-lite-preview-02-05",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        description: "Cuisine type for input restaurant details",
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.STRING,
          enum: CUISINE_TYPES,
          nullable: false,
        },
      },
    },
  },
  {
    baseUrl: `https://gateway.ai.cloudflare.com/v1/${env.CLOUDFLARE_ACCOUNT_ID}/tartanhacks/google-ai-studio`,
  },
);

export async function classifyCuisine(input: string): Promise<string[]> {
  try {
    const result = await model.generateContent([
      "Given this data for a restaurant description and reviews, determine the cuisine that best describes the restaurant: " + input
    ]);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("Error classifying cuisine:", error);
    return [];
  }
} 