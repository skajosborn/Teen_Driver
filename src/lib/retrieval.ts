import { prisma } from "./db";

type VehicleWithSources = Awaited<
  ReturnType<typeof prisma.vehicle.findMany>
>[number];

export interface ScoredVehicle extends VehicleWithSources {
  score: number;
  scoreBreakdown: Record<string, number>;
}

type FitTag =
  | "DAILY_COMMUTE"
  | "SHARED_FAMILY"
  | "WEEKEND_ADVENTURE"
  | "ECO_CONSCIOUS";

type ExtrasTag =
  | "AMERICAN_MADE"
  | "BRIGHT_COLOR"
  | "ECO_CONSCIOUS"
  | "HIGHER_SEATING";

export type SafetyLevel = "baseline" | "advanced" | "max";

export interface BudgetPreference {
  min?: number;
  max?: number;
  priority?: number;
}

export interface SafetyPreference {
  level: SafetyLevel;
  priority?: number;
}

export interface TagPreference<T> {
  tags: T[];
  priority?: number;
}

export interface PreferenceProfile {
  budget?: BudgetPreference;
  safety?: SafetyPreference;
  usage?: TagPreference<FitTag>;
  extras?: TagPreference<ExtrasTag>;
}

const DEFAULT_PRIORITY = 3;

function weight(base: number, priority: number | undefined) {
  return base * (priority ?? DEFAULT_PRIORITY);
}

function scoreBudget(vehicle: VehicleWithSources, pref?: BudgetPreference): number {
  if (!pref) return 0;
  const { msrpMin, msrpMax } = vehicle;
  const min = pref.min ?? 0;
  const max = pref.max ?? Number.POSITIVE_INFINITY;
  let score = 0;

  if (msrpMax <= max) {
    score += 6;
    if (msrpMax <= max - 2000) {
      score += 2;
    }
  } else if (msrpMax <= max + 2500) {
    score += 2;
  } else {
    score -= 6;
  }

  if (min > 0) {
    if (msrpMin >= min) {
      score += 2;
    } else if (msrpMin >= min - 2000) {
      score += 1;
    } else {
      score -= 2;
    }
  }

  return weight(score, pref.priority);
}

function scoreSafety(vehicle: VehicleWithSources, pref?: SafetyPreference): number {
  if (!pref) return 0;
  let score = 0;
  const notable = vehicle.safetyNotableFeatures.length;
  const nhtsa = vehicle.safetyNhtsaOverall ?? 0;
  const iihs = vehicle.safetyIihsTopSafetyPick;

  switch (pref.level) {
    case "baseline":
      score += iihs ? 4 : 0;
      score += nhtsa >= 4 ? 4 : -2;
      break;
    case "advanced":
      score += iihs ? 6 : -4;
      score += nhtsa >= 5 ? 5 : 0;
      score += notable >= 2 ? 3 : notable > 0 ? 1 : -2;
      break;
    case "max":
      score += iihs ? 8 : -6;
      score += nhtsa >= 5 ? 6 : -4;
      score += notable >= 3 ? 4 : -2;
      break;
  }

  return weight(score, pref.priority);
}

function scoreTags<T extends FitTag | ExtrasTag>(
  vehicleTags: T[],
  pref?: TagPreference<T>,
  baseWeight = 3,
): number {
  if (!pref || pref.tags.length === 0) return 0;
  const matches = vehicleTags.filter((tag) => pref.tags.includes(tag));
  if (matches.length === 0) {
    return weight(-3, pref.priority);
  }
  const ratio = matches.length / pref.tags.length;
  const bonus = matches.length * baseWeight;
  return weight(bonus + ratio * 2, pref.priority);
}

export function scoreVehicle(vehicle: VehicleWithSources, profile: PreferenceProfile): {
  total: number;
  breakdown: Record<string, number>;
} {
  const budgetScore = scoreBudget(vehicle, profile.budget);
  const safetyScore = scoreSafety(vehicle, profile.safety);
  const usageScore = scoreTags(vehicle.fitTags, profile.usage, 4);
  const extrasScore = scoreTags(vehicle.extrasTags, profile.extras, 2);

  const total = budgetScore + safetyScore + usageScore + extrasScore;
  return {
    total,
    breakdown: {
      budget: budgetScore,
      safety: safetyScore,
      usage: usageScore,
      extras: extrasScore,
    },
  };
}

export async function getTopVehicles(
  profile: PreferenceProfile,
  limit = 4,
): Promise<ScoredVehicle[]> {
  const vehicles = await prisma.vehicle.findMany({
    include: { sources: true },
  });

  const scored: ScoredVehicle[] = vehicles
    .map((vehicle: VehicleWithSources): ScoredVehicle => {
      const { total, breakdown } = scoreVehicle(vehicle, profile);
      return {
        ...vehicle,
        score: total,
        scoreBreakdown: breakdown,
      } as ScoredVehicle;
    })
    .sort((a: ScoredVehicle, b: ScoredVehicle) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

export async function listAllVehicles(): Promise<VehicleWithSources[]> {
  return prisma.vehicle.findMany({
    orderBy: { make: "asc" },
    include: { sources: true },
  });
}

