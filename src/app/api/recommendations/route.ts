import { NextResponse } from "next/server";
import { generateRecommendations } from "@/lib/agent";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || !Array.isArray(body.preferences)) {
      return NextResponse.json(
        { error: "Invalid payload. Expected { preferences: [] }." },
        { status: 400 },
      );
    }

    const metadata =
      typeof body.metadata === "object" && body.metadata !== null
        ? body.metadata
        : undefined;

    const result = await generateRecommendations({
      preferences: body.preferences,
      metadata: {
        submittedAt: new Date().toISOString(),
        ...metadata,
      },
    });

    return NextResponse.json(
      {
        recommendations: result.recommendations,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[recommendations] error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error while generating recommendations.",
      },
      { status: 500 },
    );
  }
}

