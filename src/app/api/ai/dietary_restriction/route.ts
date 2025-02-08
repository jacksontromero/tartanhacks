import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { classifyDietaryRestrictions } from "~/lib/ai";

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

    const restrictions = await classifyDietaryRestrictions(input);
    return NextResponse.json({ response: restrictions });

  } catch (error) {
    console.error("AI error:", error);
    return NextResponse.json(
      { error: "Failed to get response from AI" },
      { status: 500 }
    );
  }
}

