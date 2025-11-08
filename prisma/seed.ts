import { readFile } from "fs/promises";
import path from "path";
import {
  PrismaClient,
  BodyStyle,
  Drivetrain,
  InsuranceTier,
  FitTag,
  ExtrasTag,
} from "@prisma/client";

const prisma = new PrismaClient();

type VehicleJson = {
  id: string;
  make: string;
  model: string;
  trim?: string;
  years: number[];
  bodyStyle: string;
  drivetrain: string;
  msrpRange: [number, number];
  insuranceTier: string;
  fuelEconomy: {
    city: number;
    highway: number;
  };
  safety?: {
    iihsTopSafetyPick?: boolean;
    nhtsaOverall?: number;
    notableFeatures?: string[];
  };
  techHighlights?: string[];
  teenFriendlyFactors?: string[];
  maintenanceNotes?: string[];
  fitTags?: string[];
  extrasTags?: string[];
  sources?: { type: string; url: string }[];
  lastReviewed: string;
};

const bodyStyleMap: Record<string, BodyStyle> = {
  sedan: BodyStyle.SEDAN,
  suv: BodyStyle.SUV,
  crossover: BodyStyle.CROSSOVER,
  hatchback: BodyStyle.HATCHBACK,
  pickup: BodyStyle.PICKUP,
};

const drivetrainMap: Record<string, Drivetrain> = {
  fwd: Drivetrain.FWD,
  rwd: Drivetrain.RWD,
  awd: Drivetrain.AWD,
};

const insuranceTierMap: Record<string, InsuranceTier> = {
  low: InsuranceTier.LOW,
  moderate: InsuranceTier.MODERATE,
  high: InsuranceTier.HIGH,
};

const fitTagMap: Record<string, FitTag> = {
  "daily-commute": FitTag.DAILY_COMMUTE,
  "shared-family": FitTag.SHARED_FAMILY,
  "weekend-adventure": FitTag.WEEKEND_ADVENTURE,
  "eco-conscious": FitTag.ECO_CONSCIOUS,
};

const extrasTagMap: Record<string, ExtrasTag> = {
  "american-made": ExtrasTag.AMERICAN_MADE,
  "bright-color": ExtrasTag.BRIGHT_COLOR,
  "eco-conscious": ExtrasTag.ECO_CONSCIOUS,
  "higher-seating": ExtrasTag.HIGHER_SEATING,
};

function mapEnum<T>(value: string | undefined, map: Record<string, T>, label: string): T {
  if (!value) {
    throw new Error(`Missing required value for ${label}`);
  }
  const key = value.toLowerCase();
  const mapped = map[key];
  if (!mapped) {
    throw new Error(`Unknown ${label}: ${value}`);
  }
  return mapped;
}

async function loadVehicles(): Promise<VehicleJson[]> {
  const dataPath = path.resolve(process.cwd(), "data/vehicles.json");
  const file = await readFile(dataPath, "utf-8");
  return JSON.parse(file) as VehicleJson[];
}

function mapFitTags(tags: string[] | undefined): FitTag[] {
  if (!tags) return [];
  return Array.from(new Set(tags.map((tag) => mapEnum(tag, fitTagMap, "fitTag"))));
}

function mapExtrasTags(tags: string[] | undefined): ExtrasTag[] {
  if (!tags) return [];
  return Array.from(new Set(tags.map((tag) => mapEnum(tag, extrasTagMap, "extrasTag"))));
}

async function seedVehicles() {
  const vehicles = await loadVehicles();

  console.log(`Seeding ${vehicles.length} vehicles...`);
  await prisma.vehicleSource.deleteMany();
  await prisma.vehicle.deleteMany();

  for (const vehicle of vehicles) {
    const [msrpMin, msrpMax] = vehicle.msrpRange ?? [0, 0];

    await prisma.vehicle.create({
      data: {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        trim: vehicle.trim,
        years: vehicle.years ?? [],
        bodyStyle: mapEnum(vehicle.bodyStyle, bodyStyleMap, "bodyStyle"),
        drivetrain: mapEnum(vehicle.drivetrain, drivetrainMap, "drivetrain"),
        msrpMin,
        msrpMax,
        insuranceTier: mapEnum(vehicle.insuranceTier, insuranceTierMap, "insuranceTier"),
        fuelEconomyCity: vehicle.fuelEconomy?.city ?? 0,
        fuelEconomyHighway: vehicle.fuelEconomy?.highway ?? 0,
        safetyIihsTopSafetyPick: vehicle.safety?.iihsTopSafetyPick ?? false,
        safetyNhtsaOverall: vehicle.safety?.nhtsaOverall ?? null,
        safetyNotableFeatures: vehicle.safety?.notableFeatures ?? [],
        techHighlights: vehicle.techHighlights ?? [],
        teenFriendlyFactors: vehicle.teenFriendlyFactors ?? [],
        maintenanceNotes: vehicle.maintenanceNotes ?? [],
        fitTags: mapFitTags(vehicle.fitTags),
        extrasTags: mapExtrasTags(vehicle.extrasTags),
        lastReviewed: vehicle.lastReviewed ? new Date(vehicle.lastReviewed) : new Date(),
        sources: {
          create: (vehicle.sources ?? []).map((source) => ({
            type: source.type,
            url: source.url,
          })),
        },
      },
    });
  }

  console.log("Vehicle seed complete.");
}

async function main() {
  try {
    await seedVehicles();
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();

