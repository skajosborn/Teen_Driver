import { NextResponse } from "next/server";
import {
  mapPreferencesToProfile,
  toAgentVehicleCandidate,
  type IncomingPreference,
} from "@/lib/preferences";
import {
  rankVehicleAgainstProfile,
  type PreferenceProfile,
} from "@/lib/retrieval";

type VehicleDescriptor = {
  make: string;
  model: string;
  year?: number | null;
};

function parseDescriptor(input: unknown): VehicleDescriptor {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid vehicle descriptor.");
  }

  const { make, model, year } = input as {
    make?: unknown;
    model?: unknown;
    year?: unknown;
  };

  if (typeof make !== "string" || !make.trim()) {
    throw new Error("Vehicle make is required.");
  }
  if (typeof model !== "string" || !model.trim()) {
    throw new Error("Vehicle model is required.");
  }

  let parsedYear: number | undefined;
  if (year !== undefined && year !== null && year !== "") {
    if (typeof year === "number") {
      parsedYear = year;
    } else if (typeof year === "string") {
      const candidate = Number.parseInt(year, 10);
      if (!Number.isNaN(candidate)) {
        parsedYear = candidate;
      } else {
        throw new Error("Year must be a valid number.");
      }
    } else {
      throw new Error("Year must be a string or number value.");
    }
  }

  return {
    make: make.trim(),
    model: model.trim(),
    year: parsedYear,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || !Array.isArray(body.preferences)) {
      return NextResponse.json(
        { error: "Invalid payload. Expected { preferences: [], vehicle: {} }." },
        { status: 400 },
      );
    }

    const incomingPreferences = body.preferences as IncomingPreference[];
    const { profile } = mapPreferencesToProfile(incomingPreferences);

    let descriptor: VehicleDescriptor;
    try {
      descriptor = parseDescriptor(body.vehicle);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Invalid vehicle descriptor.",
        },
        { status: 400 },
      );
    }

    const leaderboardSize =
      typeof body.leaderboardLimit === "number" && body.leaderboardLimit > 0
        ? Math.min(body.leaderboardLimit, 10)
        : 5;

    const ranking = await rankVehicleAgainstProfile(
      profile as PreferenceProfile,
      descriptor,
      leaderboardSize,
    );

    const responsePayload = {
      match: ranking.matched ? toAgentVehicleCandidate(ranking.matched) : null,
      rank: ranking.rank,
      totalCompared: ranking.totalCompared,
      leaderboard: ranking.leaderboard.map(toAgentVehicleCandidate),
      yearExact: ranking.yearExact ?? null,
      availableYears: ranking.matched?.years ?? [],
      message: ranking.matched
        ? ranking.rank
          ? `Ranked #${ranking.rank} out of ${ranking.totalCompared} vehicles we compared for your profile.`
          : "We evaluated this vehicle against your profile."
        : `We couldn't find ${
            descriptor.year ? `${descriptor.year} ` : ""
          }${descriptor.make} ${descriptor.model} in our database yet.`,
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error) {
    console.error("[vehicle-ranking] error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error while ranking vehicle.",
      },
      { status: 500 },
    );
  }
}

