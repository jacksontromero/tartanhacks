import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { env } from "~/env";
import { auth } from "~/server/auth";
import { CUISINE_TYPES } from "~/constants/cuisines";

const schema = {
  description: "Cuisine type for input restaurant details",
  type: SchemaType.STRING,
  enum: CUISINE_TYPES,
  nullable: false,
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { input } = await req.json();

    if (!input) {
      return NextResponse.json(
        { error: "Input is required" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel(
      { model: "gemini-2.0-flash-lite-preview-02-05",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
       },
      },
      {
        baseUrl: `https://gateway.ai.cloudflare.com/v1/${env.CLOUDFLARE_ACCOUNT_ID}/tartanhacks/google-ai-studio`,
      },
    );

    const result = await model.generateContent([input]);
    const response = await result.response;

    return NextResponse.json({ response: response.text() });
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: "Failed to get response from Gemini" },
      { status: 500 }
    );
  }
}
