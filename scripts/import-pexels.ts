import "dotenv/config";
import "tsconfig-paths/register";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PEXELS_ENDPOINT = "https://api.pexels.com/v1/search";
const REQUEST_DELAY_MS = 500;

type PexelsSource = {
  original: string;
  large: string;
  large2x: string;
  medium: string;
  small: string;
  portrait: string;
  landscape: string;
  tiny: string;
};

type PexelsPhoto = {
  id: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: PexelsSource;
};

type PexelsResponse = {
  photos: PexelsPhoto[];
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPexelsPhoto(query: string): Promise<PexelsPhoto | null> {
  if (!PEXELS_API_KEY) {
    throw new Error("Set PEXELS_API_KEY in your environment to fetch vehicle images.");
  }

  const params = new URLSearchParams({
    query,
    per_page: "1",
  });

  const response = await fetch(`${PEXELS_ENDPOINT}?${params.toString()}`, {
    headers: {
      Authorization: PEXELS_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Pexels request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as PexelsResponse;
  return data.photos?.[0] ?? null;
}

function buildQuery(vehicle: {
  make: string;
  model: string;
  trim: string | null;
  years: number[];
}) {
  const years = vehicle.years ?? [];
  const targetYear = years.length ? Math.max(...years) : undefined;
  const parts = [
    targetYear?.toString() ?? "",
    vehicle.make,
    vehicle.model,
    vehicle.trim ?? "",
    "car exterior",
  ];
  return parts.filter(Boolean).join(" ");
}

async function main() {
  if (!PEXELS_API_KEY) {
    console.error("Missing PEXELS_API_KEY. Please add it to your environment and rerun.");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const refresh = args.includes("--refresh");
  const makeArg = args.find((arg) => arg.startsWith("--make="));
  const modelArg = args.find((arg) => arg.startsWith("--model="));

  const limit = limitArg ? Number.parseInt(limitArg.split("=")[1], 10) : undefined;
  const makeFilter = makeArg ? makeArg.split("=")[1] : undefined;
  const modelFilter = modelArg ? modelArg.split("=")[1] : undefined;

  const where: Prisma.VehicleWhereInput = {};
  if (!refresh) {
    where.imageUrl = null;
  }
  if (makeFilter) {
    where.make = { equals: makeFilter, mode: "insensitive" };
  }
  if (modelFilter) {
    where.model = { equals: modelFilter, mode: "insensitive" };
  }

  console.log("🖼️  Fetching vehicles needing imagery...");
  const vehicles = await prisma.vehicle.findMany({
    where,
    orderBy: [{ make: "asc" }, { model: "asc" }],
    take: limit,
  });

  if (!vehicles.length) {
    console.warn("No vehicles matched the filter (or all already have images).");
    return;
  }

  console.log(`Processing ${vehicles.length} vehicle(s) via Pexels...`);

  let updated = 0;
  const missing: { id: string; make: string; model: string }[] = [];
  const errors: { id: string; make: string; model: string; error: string }[] = [];

  for (const vehicle of vehicles) {
    const query = buildQuery(vehicle);
    try {
      const photo = await fetchPexelsPhoto(query);
      if (!photo) {
        missing.push({ id: vehicle.id, make: vehicle.make, model: vehicle.model });
        await sleep(REQUEST_DELAY_MS);
        continue;
      }

      const imageUrl = photo.src.landscape ?? photo.src.large ?? photo.src.medium;
      const attribution = `Photo by ${photo.photographer} on Pexels (${photo.url})`;

      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: {
          imageUrl,
          imageAttribution: attribution,
          lastReviewed: new Date(),
        },
      });

      updated += 1;
    } catch (error) {
      errors.push({
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    await sleep(REQUEST_DELAY_MS);
  }

  console.log(`\n✅ Updated imagery for ${updated} vehicle(s).`);
  if (missing.length) {
    console.warn(`\n⚠️  No photos found for ${missing.length} vehicle(s):`);
    missing.slice(0, 10).forEach((entry) => {
      console.warn(`   - ${entry.make} ${entry.model} (${entry.id})`);
    });
    if (missing.length > 10) console.warn("   ...");
  }
  if (errors.length) {
    console.error(`\n❌ Errors for ${errors.length} vehicle(s):`);
    errors.slice(0, 10).forEach((entry) => {
      console.error(`   - ${entry.make} ${entry.model}: ${entry.error}`);
    });
    if (errors.length > 10) console.error("   ...");
  }
}

main()
  .catch((error) => {
    console.error("Pexels import failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

