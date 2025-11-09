import "dotenv/config";
import "tsconfig-paths/register";

import { prisma } from "@/lib/prisma";
import type {
  BodyStyle,
  Drivetrain,
  VehicleDataSource,
  Prisma,
} from "@prisma/client";

const CARQUERY_ENDPOINT = "https://www.carqueryapi.com/api/0.3/";
const REQUEST_DELAY_MS = 300;

type CarQueryTrim = {
  model_id: string;
  model_make_id: string;
  model_name: string;
  model_trim: string;
  model_year: string;
  model_body: string;
  model_engine_fuel: string;
  model_engine_type: string;
  model_drive: string;
  model_engine_power_ps: string;
  model_engine_power_hp: string;
  model_transmission_type: string;
  model_price: string;
  model_mpg_city: string;
  model_mpg_highway: string;
  model_mpg_combined: string;
  model_doors: string;
  model_seats: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseCarQueryJson(text: string): { Trims?: CarQueryTrim[] } {
  const trimmed = text.trim();
  const jsonText = trimmed.startsWith("?") ? trimmed.substring(1) : trimmed;
  return JSON.parse(jsonText) as { Trims?: CarQueryTrim[] };
}

function parseNumber(value?: string | null): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const parsed = Number.parseFloat(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
}

function mapBodyStyle(body?: string | null): BodyStyle | null {
  if (!body) return null;
  const normalized = body.toLowerCase();
  if (normalized.includes("suv") || normalized.includes("crossover")) {
    return "SUV";
  }
  if (normalized.includes("crossover")) {
    return "CROSSOVER";
  }
  if (normalized.includes("hatch")) {
    return "HATCHBACK";
  }
  if (normalized.includes("sedan") || normalized.includes("saloon")) {
    return "SEDAN";
  }
  if (normalized.includes("pickup") || normalized.includes("truck")) {
    return "PICKUP";
  }
  return null;
}

function mapDrivetrain(drive?: string | null): Drivetrain | null {
  if (!drive) return null;
  const normalized = drive.toLowerCase();
  if (normalized.includes("awd") || normalized.includes("4wd") || normalized.includes("4x4")) {
    return "AWD";
  }
  if (normalized.includes("fwd") || normalized.includes("front")) {
    return "FWD";
  }
  if (normalized.includes("rwd") || normalized.includes("rear")) {
    return "RWD";
  }
  return null;
}

function pickBestTrim(vehicleTrim: string | null | undefined, trims: CarQueryTrim[]): CarQueryTrim | null {
  if (!trims.length) return null;
  if (vehicleTrim) {
    const normalizedTarget = vehicleTrim.trim().toLowerCase();
    const exact = trims.find(
      (trim) => trim.model_trim && trim.model_trim.trim().toLowerCase() === normalizedTarget,
    );
    if (exact) return exact;

    const partial = trims.find(
      (trim) =>
        trim.model_trim && normalizedTarget && normalizedTarget.includes(trim.model_trim.trim().toLowerCase()),
    );
    if (partial) return partial;
  }

  const priced = trims
    .map((trim) => ({
      trim,
      price: parseNumber(trim.model_price) ?? 0,
    }))
    .sort((a, b) => b.price - a.price);

  return priced[0]?.trim ?? trims[0];
}

function computeFuelEconomy(
  current: { city: number; highway: number; combined?: number | null },
  trim: CarQueryTrim,
) {
  const city = parseNumber(trim.model_mpg_city) ?? current.city;
  const highway = parseNumber(trim.model_mpg_highway) ?? current.highway;
  const combined =
    parseNumber(trim.model_mpg_combined) ??
    (city && highway ? Math.round((city * 0.55 + highway * 0.45)) : current.combined ?? null);

  return { city, highway, combined };
}

function normaliseModel(model: string) {
  return model.trim().toLowerCase().replace(/-/g, " ").replace(/\s+/g, " ");
}

async function requestTrims(params: URLSearchParams) {
  const response = await fetch(`${CARQUERY_ENDPOINT}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`CarQuery request failed: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  return parseCarQueryJson(text).Trims ?? [];
}

async function fetchCarQueryTrims(make: string, model: string, year: number): Promise<CarQueryTrim[]> {
  const makeParam = make.trim().toLowerCase();
  const modelParam = model.trim();

  const primaryParams = new URLSearchParams({
    cmd: "getTrims",
    make: makeParam,
    model: modelParam,
    year: year.toString(),
  });

  let trims = await requestTrims(primaryParams);
  if (trims.length) {
    return trims;
  }

  const fallbackParams = new URLSearchParams({
    cmd: "getTrims",
    make: makeParam,
    year: year.toString(),
  });

  trims = await requestTrims(fallbackParams);
  if (!trims.length) return [];

  const target = normaliseModel(model);
  const filtered = trims.filter((trim) => normaliseModel(trim.model_name) === target);
  if (filtered.length) return filtered;

  const partial = trims.filter((trim) => normaliseModel(trim.model_name).includes(target));
  return partial.length ? partial : trims;
}

async function fetchTrimsWithFallback(make: string, model: string, year: number): Promise<CarQueryTrim[]> {
  const attempts: CarQueryTrim[][] = [];
  let currentYear = year;
  for (let i = 0; i < 4 && currentYear >= 1980; i += 1) {
    const trims = await fetchCarQueryTrims(make, model, currentYear);
    if (trims.length) {
      if (currentYear !== year) {
        console.warn(
          `   ↳ Using CarQuery data from ${currentYear} for ${year} ${make} ${model} (latest available).`,
        );
      }
      return trims;
    }
    attempts.push(trims);
    currentYear -= 1;
  }
  return [];
}

function deriveDataSource(source: VehicleDataSource): VehicleDataSource {
  if (source === "MANUAL") return "BLENDED";
  if (source === "NHTSA") return "BLENDED";
  return source;
}

async function main() {
  const args = process.argv.slice(2);
  const makeArg = args.find((arg) => arg.startsWith("--make="));
  const modelArg = args.find((arg) => arg.startsWith("--model="));
  const yearArg = args.find((arg) => arg.startsWith("--year="));
  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const missingOnly = args.includes("--missing-only");

  const makeFilter = makeArg ? makeArg.split("=")[1] : undefined;
  const modelFilter = modelArg ? modelArg.split("=")[1] : undefined;
  const yearFilter = yearArg ? Number.parseInt(yearArg.split("=")[1], 10) : undefined;
  const limit = limitArg ? Number.parseInt(limitArg.split("=")[1], 10) : undefined;

  const where: Prisma.VehicleWhereInput = {};
  if (makeFilter) {
    where.make = { equals: makeFilter, mode: "insensitive" };
  }
  if (modelFilter) {
    where.model = { equals: modelFilter, mode: "insensitive" };
  }
  if (yearFilter) {
    where.years = { has: yearFilter };
  }
  if (missingOnly) {
    where.carQueryTrimId = null;
  }

  console.log("🚗 Fetching vehicles from Supabase...");
  const vehicles = await prisma.vehicle.findMany({
    where,
    orderBy: [{ make: "asc" }, { model: "asc" }],
    take: limit,
  });

  if (!vehicles.length) {
    console.warn("No vehicles matched the provided filters.");
    return;
  }

  console.log(`Processing ${vehicles.length} vehicle(s) via CarQuery...`);
  let updated = 0;
  const missing: { id: string; make: string; model: string; year: number }[] = [];
  const errors: { id: string; make: string; model: string; year: number; error: string }[] = [];

  for (const vehicle of vehicles) {
    const years = vehicle.years ?? [];
    const targetYear = yearFilter ?? (years.length ? Math.max(...years) : new Date().getFullYear());
    try {
      const trims = await fetchTrimsWithFallback(vehicle.make, vehicle.model, targetYear);
      if (!trims.length) {
        missing.push({ id: vehicle.id, make: vehicle.make, model: vehicle.model, year: targetYear });
        console.warn(
          `   ↳ No CarQuery trims found for ${targetYear} ${vehicle.make} ${vehicle.model}. ` +
            `Ensure spelling matches CarQuery (e.g. make 'toyota', model 'Camry').`,
        );
        await sleep(REQUEST_DELAY_MS);
        continue;
      }

      const bestTrim = pickBestTrim(vehicle.trim, trims);
      if (!bestTrim) {
        missing.push({ id: vehicle.id, make: vehicle.make, model: vehicle.model, year: targetYear });
        await sleep(REQUEST_DELAY_MS);
        continue;
      }

      const msrp = parseNumber(bestTrim.model_price);
      const fuel = computeFuelEconomy(
        { city: vehicle.fuelEconomyCity, highway: vehicle.fuelEconomyHighway, combined: vehicle.fuelEconomyCombined },
        bestTrim,
      );
      const body = mapBodyStyle(bestTrim.model_body) ?? vehicle.bodyStyle;
      const drive = mapDrivetrain(bestTrim.model_drive) ?? vehicle.drivetrain;
      const doors = parseNumber(bestTrim.model_doors);
      const seats = parseNumber(bestTrim.model_seats);
      const horsepower = parseNumber(bestTrim.model_engine_power_hp);

      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: {
          bodyStyle: body,
          drivetrain: drive,
          msrpMin: msrp ? Math.round(msrp) : vehicle.msrpMin,
          msrpMax: msrp ? Math.round(msrp) : vehicle.msrpMax,
          fuelEconomyCity: fuel.city,
          fuelEconomyHighway: fuel.highway,
          fuelEconomyCombined: fuel.combined ?? vehicle.fuelEconomyCombined,
          fuelType: bestTrim.model_engine_fuel || bestTrim.model_engine_type || vehicle.fuelType,
          transmission: bestTrim.model_transmission_type || vehicle.transmission,
          doors: doors ? Math.round(doors) : vehicle.doors,
          seats: seats ? Math.round(seats) : vehicle.seats,
          carQueryTrimId: bestTrim.model_id,
          dataSource: deriveDataSource(vehicle.dataSource),
          lastReviewed: new Date(),
          techHighlights: vehicle.techHighlights,
          teenFriendlyFactors: vehicle.teenFriendlyFactors,
          maintenanceNotes: vehicle.maintenanceNotes,
        },
      });

      if (horsepower && !vehicle.teenFriendlyFactors.includes(`Approx. ${Math.round(horsepower)} hp`)) {
        await prisma.vehicle.update({
          where: { id: vehicle.id },
          data: {
            teenFriendlyFactors: [
              ...vehicle.teenFriendlyFactors,
              `Approx. ${Math.round(horsepower)} hp`,
            ],
          },
        });
      }

      updated += 1;
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

  console.log(`\n✅ Updated ${updated} vehicle(s) with CarQuery data.`);
  if (missing.length) {
    console.warn(`\n⚠️ No CarQuery trims for ${missing.length} vehicle(s):`);
    missing.slice(0, 10).forEach((entry) => {
      console.warn(`   - ${entry.year} ${entry.make} ${entry.model} (${entry.id})`);
    });
    if (missing.length > 10) console.warn("   ...");
  }
  if (errors.length) {
    console.error(`\n❌ Errors for ${errors.length} vehicle(s):`);
    errors.slice(0, 10).forEach((entry) => {
      console.error(`   - ${entry.year} ${entry.make} ${entry.model}: ${entry.error}`);
    });
    if (errors.length > 10) console.error("   ...");
  }
}

main()
  .catch((error) => {
    console.error("CarQuery import failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

