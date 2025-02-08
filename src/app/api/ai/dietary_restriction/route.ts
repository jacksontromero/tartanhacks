import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { env } from "~/env";
import { auth } from "~/server/auth";
import { DIETARY_RESTRICTIONS } from "~/constants/dietary-restrictions";

const schema = {
  description: "True or false whether the restaurant is *very* likely to accomodate the given dietary restriction",
  type: SchemaType.BOOLEAN,
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

    const { restaurantData, dietaryRestriction } = input;

    if (!restaurantData || !dietaryRestriction) {
      return NextResponse.json(
        { error: "Restaurant data and dietary restriction are required" },
        { status: 400 }
      );
    }

    if (!DIETARY_RESTRICTIONS.includes(dietaryRestriction)) {
      return NextResponse.json(
        { error: "Invalid dietary restriction" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel(
      { model: "gemini-2.0-flash-lite-preview-02-05",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.1,
       },
      },
      {
        baseUrl: `https://gateway.ai.cloudflare.com/v1/${env.CLOUDFLARE_ACCOUNT_ID}/tartanhacks/google-ai-studio`,
      },
    );

    const result = await model.generateContent(["Given a restaurant description and reviews, indicate whether the restaurant accomodates the given dietary restriction. Dietary restriction: **" + dietaryRestriction + "**" + ". Restaurant description and reviews: **" + restaurantData + "**"]);
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

