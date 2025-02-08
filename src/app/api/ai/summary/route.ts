import OpenAI from "openai";
import { NextResponse } from "next/server";
import { PlaceDetails } from "~/constants/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { place } = await request.json() as { place: PlaceDetails };

    if (!place) {
      return NextResponse.json(
        { error: "Place details are required" },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful restaurant reviewer. Provide concise, informative summaries focusing on the most distinctive aspects of each restaurant."
        },
        {
          role: "user",
          content: `
            Generate a concise one-sentence summary highlighting the key features of this restaurant:
            
            Name: ${place.name}
            Cuisine Types: ${place.cuisines.join(", ")}
            Rating: ${place.rating}/5 (${place.total_ratings} reviews)
            Price: ${place.price_level}
            Features: ${Object.entries(place.features)
              .filter(([_, value]) => value)
              .map(([key]) => key)
              .join(", ")}
          `
        }
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const summary = response.choices[0]?.message?.content || "No summary available";

    return NextResponse.json({ summary });

  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
} 