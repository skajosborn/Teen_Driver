import { NextResponse } from "next/server";
import { generateRecommendations } from "@/lib/agent";
import type { AgentPreference } from "@/lib/agent";
import { getTopVehicles } from "@/lib/retrieval";
import {
  mapPreferencesToProfile,
  toAgentVehicleCandidate,
  type IncomingPreference,
} from "@/lib/preferences";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || !Array.isArray(body.preferences)) {
      return NextResponse.json(
        { error: "Invalid payload. Expected { preferences: [] }." },
        { status: 400 },
      );
    }

    const incomingPreferences = body.preferences as IncomingPreference[];
    const { profile, context } = mapPreferencesToProfile(incomingPreferences);
    const topVehicles = await getTopVehicles(profile, 4);
    const agentCandidates = topVehicles.map(toAgentVehicleCandidate);

    const metadata =
      typeof body.metadata === "object" && body.metadata !== null
        ? body.metadata
        : undefined;

    const result = await generateRecommendations({
      preferences: body.preferences as AgentPreference[],
      candidates: agentCandidates,
      context,
      metadata: {
        submittedAt: new Date().toISOString(),
        ...metadata,
      },
    });

    return NextResponse.json(
      {
        recommendations: result.recommendations,
        candidates: agentCandidates,
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

