import "dotenv/config";
import "tsconfig-paths/register";

import { prisma } from "@/lib/prisma";
import type { VehicleDataSource } from "@prisma/client";

const BASE_URL = "https://api.nhtsa.gov/SafetyRatings";
const REQUEST_DELAY_MS = 250;

type SearchResult = {
  VehicleId: number;
  VehicleDescription: string;
};

type VehicleDetailResult = {
  OverallRating?: string | number;
  OverallFrontCrashRating?: string | number;
  OverallSideCrashRating?: string | number;
  RolloverRating?: string | number;
  RecallsCount?: string | number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRating(value?: string | number | null): number | null {
  if (!value) return null;
  const strValue = typeof value === "number" ? value.toString() : value;
  const cleaned = strValue.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const parsed = Number.parseFloat(cleaned);
  return Number.isNaN(parsed) ? null : Math.round(parsed);
}

function parseCount(value?: string | number | null): number | null {
  if (!value) return null;
  const strValue = typeof value === "number" ? value.toString() : value;
  const cleaned = strValue.replace(/[^0-9]/g, "");
  if (!cleaned) return null;
  const parsed = Number.parseInt(cleaned, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

async function fetchVehicleId(
  year: number,
  make: string,
  model: string,
): Promise<number | null> {
  const url = `${BASE_URL}/modelyear/${encodeURIComponent(
    year.toString(),
  )}/make/${encodeURIComponent(make)}/model/${encodeURIComponent(model)}?format=json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch NHTSA vehicles: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { Results?: SearchResult[] };
  const vehicleId = data.Results?.[0]?.VehicleId;
  return vehicleId ?? null;
}

async function fetchVehicleDetails(vehicleId: number): Promise<VehicleDetailResult | null> {
  const url = `${BASE_URL}/VehicleId/${vehicleId}?format=json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch NHTSA vehicle detail: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { Results?: VehicleDetailResult[] };
  const detail = data.Results?.[0];
  return detail ?? null;
}

async function updateVehicleFromNhtsa(
  vehicleId: string,
  detail: VehicleDetailResult,
  currentSource: VehicleDataSource,
) {
  const overall = parseRating(detail.OverallRating);
  const frontal = parseRating(detail.OverallFrontCrashRating);
  const side = parseRating(detail.OverallSideCrashRating);
  const rollover = parseRating(detail.RolloverRating);
  const recalls = parseCount(detail.RecallsCount);

  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      safetyNhtsaOverall: overall,
      safetyNhtsaFrontal: frontal,
      safetyNhtsaSide: side,
      safetyNhtsaRollover: rollover,
      recallCount: recalls,
      dataSource: currentSource === "MANUAL" ? "BLENDED" : currentSource,
      lastReviewed: new Date(),
    },
  });
}

async function main() {
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number.parseInt(limitArg.split("=")[1], 10) : undefined;

  console.log("🔍 Fetching vehicles from Supabase...");
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { make: "asc" },
    take: limit,
  });

  console.log(`Found ${vehicles.length} vehicles. Querying NHTSA ratings...`);

  let successCount = 0;
  const missing: { id: string; make: string; model: string; year: number }[] = [];
  const errors: { id: string; make: string; model: string; year: number; error: string }[] = [];

  for (const vehicle of vehicles) {
    const years = vehicle.years ?? [];
    const targetYear = years.length ? Math.max(...years) : new Date().getFullYear();

    try {
      const vehicleId = await fetchVehicleId(targetYear, vehicle.make, vehicle.model);

      if (!vehicleId) {
        missing.push({ id: vehicle.id, make: vehicle.make, model: vehicle.model, year: targetYear });
        await sleep(REQUEST_DELAY_MS);
        continue;
      }

      const detail = await fetchVehicleDetails(vehicleId);
      if (!detail) {
        missing.push({ id: vehicle.id, make: vehicle.make, model: vehicle.model, year: targetYear });
        await sleep(REQUEST_DELAY_MS);
        continue;
      }

      await updateVehicleFromNhtsa(vehicle.id, detail, vehicle.dataSource);
      successCount += 1;
    } catch (error) {
      errors.push({
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: targetYear,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    await sleep(REQUEST_DELAY_MS);
  }

  console.log(`\n✅ Updated NHTSA ratings for ${successCount} vehicle(s).`);
  if (missing.length) {
    console.warn(`\n⚠️  No NHTSA data for ${missing.length} vehicle(s):`);
    missing.slice(0, 10).forEach((entry) => {
      console.warn(`   - ${entry.year} ${entry.make} ${entry.model} (${entry.id})`);
    });
    if (missing.length > 10) {
      console.warn("   ...");
    }
  }
  if (errors.length) {
    console.error(`\n❌ Errors for ${errors.length} vehicle(s):`);
    errors.slice(0, 10).forEach((entry) => {
      console.error(`   - ${entry.year} ${entry.make} ${entry.model}: ${entry.error}`);
    });
    if (errors.length > 10) {
      console.error("   ...");
    }
  }
}

main()
  .catch((error) => {
    console.error("NHTSA import failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

