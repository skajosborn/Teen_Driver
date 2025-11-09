import type {
  AgentPreference,
  AgentContext,
  AgentVehicleCandidate,
} from "@/lib/agent";
import type { PreferenceProfile, SafetyLevel, ScoredVehicle } from "@/lib/retrieval";

export type IncomingPreference = Pick<
  AgentPreference,
  "questionId" | "priority" | "type" | "selectedValues" | "notes"
>;

const DEFAULT_PRIORITY = 3;

type FitTagValue =
  | "DAILY_COMMUTE"
  | "SHARED_FAMILY"
  | "WEEKEND_ADVENTURE"
  | "ECO_CONSCIOUS";

type ExtrasTagValue =
  | "AMERICAN_MADE"
  | "BRIGHT_COLOR"
  | "ECO_CONSCIOUS"
  | "HIGHER_SEATING";

const BUDGET_MAP: Record<
  string,
  { range: { min: number; max: number }; summary: string }
> = {
  value: {
    range: { min: 0, max: 20000 },
    summary: "Value-first approach; keep total purchase under roughly $20K.",
  },
  "cpo-balance": {
    range: { min: 18000, max: 32000 },
    summary: "Certified/near-new sweet spot around $18K–$32K.",
  },
  premium: {
    range: { min: 28000, max: 50000 },
    summary: "Premium investment ($28K+) for top-tier assurance.",
  },
};

const SAFETY_MAP: Record<string, { level: SafetyLevel; summary: string }> = {
  "baseline-safety": {
    level: "baseline",
    summary: "Baseline protections (≥4★ NHTSA, camera, stability control).",
  },
  "advanced-adas": {
    level: "advanced",
    summary: "Advanced driver assistance (blind-spot, lane keep, AEB).",
  },
  "max-safety": {
    level: "max",
    summary: "Maximum assurance (Top Safety Pick+, teen monitoring, avoidance suites).",
  },
};

const USAGE_MAP: Record<string, { tag: FitTagValue; summary: string }> = {
  "daily-commute": {
    tag: "DAILY_COMMUTE",
    summary: "Daily commuting & errands focus.",
  },
  "shared-family": {
    tag: "SHARED_FAMILY",
    summary: "Shared family duty with flexible seating/cargo.",
  },
  adventure: {
    tag: "WEEKEND_ADVENTURE",
    summary: "Weekend adventures & all-weather capability.",
  },
};

const EXTRAS_MAP: Record<string, { tag: ExtrasTagValue; label: string }> = {
  "american-made": { tag: "AMERICAN_MADE", label: "American-made preference" },
  "bright-color": { tag: "BRIGHT_COLOR", label: "High-visibility exterior colour" },
  "eco-conscious": { tag: "ECO_CONSCIOUS", label: "Eco-conscious / efficiency focus" },
  "higher-seating": { tag: "HIGHER_SEATING", label: "Higher seating position" },
};

const TECH_MAP: Record<string, string> = {
  "core-connectivity": "Core connectivity (CarPlay/Android Auto, USB-C).",
  "monitoring-suite": "Teen monitoring suite (speed alerts, geofencing, remote start).",
  "premium-tech": "Premium tech package (HUD, surround view, adaptive cruise).",
};

const TIMELINE_MAP: Record<string, string> = {
  "two-weeks": "Needs a ready-to-drive option within ~2 weeks.",
  month: "Aims to finalise within ~30–45 days.",
  researching: "Still researching; wants education & negotiation prep first.",
};

function getPriority(pref?: IncomingPreference) {
  return pref?.priority ?? DEFAULT_PRIORITY;
}

function findPreference(
  preferences: IncomingPreference[],
  id: string,
): IncomingPreference | undefined {
  return preferences.find((pref) => pref.questionId === id);
}

export function mapPreferencesToProfile(
  preferences: IncomingPreference[],
): { profile: PreferenceProfile; context: AgentContext } {
  const profile: PreferenceProfile = {};
  const context: AgentContext = {};

  const budgetPref = findPreference(preferences, "budget");
  const safetyPref = findPreference(preferences, "safety");
  const usagePref = findPreference(preferences, "usage");
  const extrasPref = findPreference(preferences, "extras");
  const techPref = findPreference(preferences, "tech");
  const timelinePref = findPreference(preferences, "timeline");
  const notesPref = findPreference(preferences, "notes");

  const budgetValue = budgetPref?.selectedValues?.[0];
  const budgetEntry = budgetValue ? BUDGET_MAP[budgetValue] : undefined;
  if (budgetEntry) {
    profile.budget = {
      ...budgetEntry.range,
      priority: getPriority(budgetPref),
    };
    context.budgetSummary = budgetEntry.summary;
  }

  const safetyValue = safetyPref?.selectedValues?.[0];
  const safetyEntry = safetyValue ? SAFETY_MAP[safetyValue] : undefined;
  if (safetyEntry) {
    profile.safety = {
      level: safetyEntry.level,
      priority: getPriority(safetyPref),
    };
    context.safetySummary = safetyEntry.summary;
  }

  const usageValue = usagePref?.selectedValues?.[0];
  const usageEntry = usageValue ? USAGE_MAP[usageValue] : undefined;
  if (usageEntry) {
    profile.usage = {
      tags: [usageEntry.tag],
      priority: getPriority(usagePref),
    };
    context.usageSummary = usageEntry.summary;
  }

  const extrasValues = extrasPref?.selectedValues ?? [];
  const extrasEntries = extrasValues
    .map((value) => EXTRAS_MAP[value])
    .filter(Boolean) as { tag: ExtrasTagValue; label: string }[];
  if (extrasEntries.length) {
    profile.extras = {
      tags: extrasEntries.map((entry) => entry.tag),
      priority: getPriority(extrasPref),
    };
    context.extrasSummary = extrasEntries.map((entry) => entry.label).join(", ");
  }

  const techValue = techPref?.selectedValues?.[0];
  if (techValue && TECH_MAP[techValue]) {
    context.techPreference = TECH_MAP[techValue];
  }

  const timelineValue = timelinePref?.selectedValues?.[0];
  if (timelineValue && TIMELINE_MAP[timelineValue]) {
    context.timelineExpectation = TIMELINE_MAP[timelineValue];
  }

  if (notesPref?.notes?.trim()) {
    context.notes = [notesPref.notes.trim()];
  }

  return { profile, context };
}

export function toAgentVehicleCandidate(vehicle: ScoredVehicle): AgentVehicleCandidate {
  const sortedYears = [...vehicle.years].sort((a, b) => a - b);
  const firstYear = sortedYears[0];
  const lastYear = sortedYears[sortedYears.length - 1];
  const yearLabel =
    firstYear && lastYear
      ? firstYear === lastYear
        ? `${firstYear}`
        : `${firstYear}-${lastYear}`
      : "Various years";

  const baseName = `${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ""}`;
  const name = `${yearLabel} ${baseName}`.trim();

  const safeVehicle = vehicle as unknown as {
    sources?: { type: string; url: string }[];
  };
  const sources = Array.isArray(safeVehicle.sources) ? safeVehicle.sources : [];

  return {
    id: vehicle.id,
    name,
    score: Number(vehicle.score.toFixed(2)),
    scoreBreakdown: vehicle.scoreBreakdown,
    msrpRange: { min: vehicle.msrpMin, max: vehicle.msrpMax },
    bodyStyle: vehicle.bodyStyle,
    drivetrain: vehicle.drivetrain,
    tags: {
      fit: vehicle.fitTags,
      extras: vehicle.extrasTags,
    },
    safety: {
      iihsTopSafetyPick: vehicle.safetyIihsTopSafetyPick,
      nhtsaOverall: vehicle.safetyNhtsaOverall,
      notableFeatures: vehicle.safetyNotableFeatures,
    },
    fuelEconomy: {
      city: vehicle.fuelEconomyCity > 0 ? vehicle.fuelEconomyCity : undefined,
      highway: vehicle.fuelEconomyHighway > 0 ? vehicle.fuelEconomyHighway : undefined,
      combined:
        vehicle.fuelEconomyCombined !== null && vehicle.fuelEconomyCombined !== undefined
          ? vehicle.fuelEconomyCombined
          : undefined,
    },
    highlights: {
      tech: vehicle.techHighlights.slice(0, 3),
      teenFriendly: vehicle.teenFriendlyFactors.slice(0, 3),
      maintenance: vehicle.maintenanceNotes.slice(0, 2),
    },
    image: vehicle.imageUrl
      ? {
          url: vehicle.imageUrl,
          attribution: vehicle.imageAttribution ?? undefined,
        }
      : undefined,
    sources: sources.slice(0, 3),
  };
}

