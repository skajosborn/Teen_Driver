'use client';

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import HeroQuizPreview, {
  type HeroStructuredPreference,
  type HeroSummaryEntry,
} from "@/components/HeroQuizPreview";
import type { AgentVehicleCandidate } from "@/lib/agent";

type RecommendationItem = {
  vehicle?: string;
  fitSummary?: string;
  safetyHighpoints?: string;
  costInsights?: string;
  nextStep?: string;
};

type ParsedRecommendationSuccess = {
  json: string;
  items: RecommendationItem[];
};

type ParsedRecommendationPayload = ParsedRecommendationSuccess | null;

const extractRecommendationsFromRaw = (raw: string): ParsedRecommendationPayload => {
  const attemptParse = (candidate: string): ParsedRecommendationPayload => {
    try {
      const parsed = JSON.parse(candidate) as {
        recommendations?: RecommendationItem[];
      };
      if (Array.isArray(parsed.recommendations)) {
        return {
          json: JSON.stringify({ recommendations: parsed.recommendations }, null, 2),
          items: parsed.recommendations,
        };
      }
    } catch {
      // ignore, handled by caller
    }
    return null;
  };

  const maybeDirect = attemptParse(raw);
  if (maybeDirect) return maybeDirect;

  const firstBrace = raw.indexOf("{");
  if (firstBrace === -1) {
    return null;
  }

  for (let i = raw.length - 1; i >= firstBrace; i -= 1) {
    if (raw[i] !== "}") {
      continue;
    }
    const candidate = raw.slice(firstBrace, i + 1);
    if (candidate.includes('"recommendations"')) {
      const parsed = attemptParse(candidate);
      if (parsed) {
        return parsed;
      }
    }
  }

  return null;
};

const hasRecommendations = (
  value: ParsedRecommendationPayload,
): value is ParsedRecommendationSuccess =>
  Boolean(value && Array.isArray(value.items));

type LandingRecommendation = {
  vehicle: string;
  fitSummary: string;
  safetyHighpoints: string;
  costInsights: string;
  nextStep: string;
};

export default function Home() {
  const [heroSummary, setHeroSummary] = useState<HeroSummaryEntry[]>([]);
  const [heroRecommendations, setHeroRecommendations] = useState<LandingRecommendation[]>([]);
  const [heroCandidates, setHeroCandidates] = useState<AgentVehicleCandidate[]>([]);
  const [heroAgentResponse, setHeroAgentResponse] = useState<string | null>(null);
  const [heroAgentStatus, setHeroAgentStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [heroAgentError, setHeroAgentError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const features = [
    {
      title: "Safety-First Filters",
      description:
        "Set the crash-test ratings, advanced driver assistance features, and insurance thresholds you expect.",
    },
    {
      title: "Smart Budget Guardrails",
      description:
        "Dial in purchase price, monthly payment, and maintenance costs to stay in your comfort zone.",
    },
    {
      title: "Family Fit Factors",
      description:
        "Prioritize seating, cargo needs, mileage, and style so your teen loves the car—and you love the decision.",
    },
  ];

  const steps = [
    {
      label: "Tell us what matters",
      detail:
        "Share your safety must-haves, budget range, driving habits, and any red lines.",
    },
    {
      label: "We scout the market",
      detail:
        "Our agentic engine scans dealer lots, certified pre-owned inventory, and owner-reported data.",
    },
    {
      label: "Review your short list",
      detail:
        "Get a concise report with pros/cons, negotiation insights, and next steps for each match.",
    },
  ];

  const faqs = [
    {
      question: "How accurate are the recommendations?",
      answer:
        "We combine federal safety data, insurance studies, and live inventory feeds to surface cars that match your exact criteria.",
    },
    {
      question: "Can I refine the list after the first run?",
      answer:
        "Absolutely. Adjust any parameter and regenerate in seconds—your history and notes stay synced.",
    },
    {
      question: "Does this replace talking to a dealer?",
      answer:
        "Think of Teen Driver as your research partner. We prep you with the right questions, offers, and confidence before you walk into a showroom.",
    },
  ];

  const heroCandidateLookup = useMemo(() => {
    const map = new Map<string, AgentVehicleCandidate>();
    heroCandidates.forEach((candidate) => {
      map.set(candidate.name.toLowerCase(), candidate);
    });
    return map;
  }, [heroCandidates]);

  const resolveCandidate = useCallback(
    (vehicleName: string) => {
      const lower = vehicleName.toLowerCase();
      if (heroCandidateLookup.has(lower)) {
        return heroCandidateLookup.get(lower);
      }
      return heroCandidates.find((candidate) => {
        const candidateName = candidate.name.toLowerCase();
        return candidateName.includes(lower) || lower.includes(candidateName);
      });
    },
    [heroCandidateLookup, heroCandidates],
  );

  const usdFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }),
    [],
  );

  const formatMsrpRange = useCallback(
    (candidate?: AgentVehicleCandidate | null) => {
      if (!candidate?.msrpRange) return null;
      const { min, max } = candidate.msrpRange;
      if (!Number.isFinite(min) || !Number.isFinite(max) || max <= 0) {
        return null;
      }
      if (min === max) {
        return usdFormatter.format(min);
      }
      return `${usdFormatter.format(min)} – ${usdFormatter.format(max)}`;
    },
    [usdFormatter],
  );

  const formatFuelEconomy = useCallback((candidate?: AgentVehicleCandidate | null) => {
    const city = candidate?.fuelEconomy?.city ?? null;
    const highway = candidate?.fuelEconomy?.highway ?? null;
    const combined = candidate?.fuelEconomy?.combined ?? null;

    const segments: string[] = [];
    if (city && highway) {
      segments.push(`${city}/${highway} mpg (city/hwy)`);
    } else if (city) {
      segments.push(`${city} mpg city`);
    } else if (highway) {
      segments.push(`${highway} mpg hwy`);
    }
    if (combined && !segments.some((segment) => segment.includes("combined"))) {
      segments.push(`${combined} mpg combined`);
    }

    return segments.length ? segments.join(" • ") : null;
  }, []);

  const formatSafetySummary = useCallback((candidate?: AgentVehicleCandidate | null) => {
    if (!candidate) return null;
    const badges: string[] = [];
    const stars = candidate.safety?.nhtsaOverall;
    if (stars) {
      badges.push(`${stars}★ NHTSA`);
    }
    if (candidate.safety?.iihsTopSafetyPick) {
      badges.push("IIHS Top Safety Pick");
    }
    return badges.length ? badges.join(" • ") : null;
  }, []);

  const formatScoreBreakdown = useCallback((candidate?: AgentVehicleCandidate | null) => {
    if (!candidate?.scoreBreakdown) return [];
    return (["budget", "safety", "usage", "extras"] as const)
      .map((key) => {
        const value = candidate.scoreBreakdown[key];
        if (typeof value !== "number" || value === 0) return null;
        const label = key.charAt(0).toUpperCase() + key.slice(1);
        const rounded = Math.round(value);
        const prefix = rounded > 0 ? "+" : "";
        return `${label}: ${prefix}${rounded}`;
      })
      .filter(Boolean) as string[];
  }, []);

  const handleHeroSubmit = useCallback(
    async ({
      preferences,
      summary,
    }: {
      preferences: HeroStructuredPreference[];
      summary: HeroSummaryEntry[];
    }) => {
      const cleanedPreferences = preferences.map((preference) => ({
        questionId: preference.questionId,
        label: preference.label,
        priority: preference.priority,
        type: preference.type,
        selectedValues: preference.selectedValues,
        notes: preference.notes,
      }));

      const metadata = {
        submittedAt: new Date().toISOString(),
        sessionId:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2),
        source: "landing-hero",
      };

      setHeroSummary(summary);
      setHeroAgentStatus("loading");
      setHeroAgentError(null);
      setHeroAgentResponse(null);
      setHeroRecommendations([]);

      try {
        const response = await fetch("/api/recommendations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            preferences: cleanedPreferences,
            metadata,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(
            errorBody?.error ?? "Unable to generate recommendations right now.",
          );
        }

        const data = (await response.json()) as {
          recommendations?: string;
          candidates?: AgentVehicleCandidate[];
        };
        setHeroCandidates(data.candidates ?? []);

        const raw = data.recommendations;
        if (!raw) {
          setHeroAgentResponse(
            "Agent completed without returning recommendations. Try again shortly.",
          );
          setHeroRecommendations([]);
          setHeroAgentStatus("success");
          return;
        }

        const parsed = extractRecommendationsFromRaw(raw);

        if (hasRecommendations(parsed)) {
          const items = parsed.items ?? [];
          setHeroRecommendations(
            items
              .map((item) => ({
                vehicle: item?.vehicle ?? "Vehicle TBD",
                fitSummary:
                  item?.fitSummary ?? "No fit summary returned. Review manually.",
                safetyHighpoints:
                  item?.safetyHighpoints ??
                  "No safety highlights provided. Double-check ratings.",
                costInsights:
                  item?.costInsights ??
                  "No cost insights provided. Review pricing independently.",
                nextStep:
                  item?.nextStep ??
                  "No next step provided. Consider reaching out to a local dealer.",
              }))
              .slice(0, 4),
          );
          setHeroAgentResponse(parsed.json);
        } else {
          setHeroRecommendations([]);
          setHeroAgentResponse(raw);
        }

        setHeroAgentStatus("success");
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 200);
      } catch (error) {
        setHeroAgentStatus("error");
        setHeroAgentError(
          error instanceof Error
            ? error.message
            : "Something went wrong sending your profile to the agent.",
        );
      }
    },
    [],
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-400/30 blur-3xl" />
          <div className="absolute right-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-emerald-400/20 blur-3xl" />
        </div>

        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
          <Link href="/" className="flex items-center gap-3 text-inherit no-underline">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/90 text-lg font-semibold text-slate-950 shadow-lg shadow-sky-500/30">
              TD
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">Teen Driver</p>
              <p className="text-sm text-slate-300">
                Confidence for parents. Excitement for teens.
              </p>
            </div>
          </Link>
          <div className="hidden items-center gap-6 text-sm font-medium text-slate-300 md:flex">
            <a className="transition-colors hover:text-white" href="#features">
              Features
            </a>
            <a className="transition-colors hover:text-white" href="#how-it-works">
              How it works
            </a>
            <a className="transition-colors hover:text-white" href="#faq">
              FAQ
            </a>
            <a
              className="rounded-full bg-white px-4 py-2 font-semibold text-slate-950 transition hover:bg-slate-100"
              href="#hero-quiz"
            >
              Get started
            </a>
          </div>
        </header>

        <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 pt-10 sm:px-10 lg:flex-row lg:items-start">
          <section className="flex-1 space-y-10">
            <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-[3.75rem] lg:leading-[1.05]">
            Smart technology. Peace of mind. The perfect car awaits.
            </h1>
            <p className="max-w-lg text-lg text-slate-300 sm:text-xl">
              Backed by real NHTSA crash tests, insurance costs, and an agentic concierge designed for cautious families.
            </p>
            <div className="relative mt-4 w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-2xl shadow-slate-950/60 sm:max-w-md lg:max-w-lg">
              <Image
                src="/car6.jpg"
                alt="Toyota SUV parked in low light"
                width={960}
                height={640}
                className="h-full w-full object-cover"
                priority
              />
              <div className="absolute inset-x-5 bottom-5 rounded-2xl bg-slate-950/70 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300 backdrop-blur">
                Powered by safety data, not ads
              </div>
            </div>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <a
                href="#hero-quiz"
                className="rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 transition hover:bg-sky-400 hover:shadow-sky-400/40"
              >
                Build my teen&apos;s shortlist
              </a>
              <a
                href="#how-it-works"
                className="text-sm font-semibold text-slate-200 transition hover:text-white"
              >
                See how it works →
              </a>
            </div>
          </section>

          <div className="w-full max-w-md shrink-0">
            <HeroQuizPreview
              onSubmit={handleHeroSubmit}
              submitting={heroAgentStatus === "loading"}
              status={heroAgentStatus}
              error={heroAgentError}
            />
          </div>
        </main>

        {heroAgentStatus !== "idle" ? (
          <section
            ref={resultsRef}
            className="mx-auto mb-20 max-w-6xl px-6 sm:px-10"
          >
            <div className="space-y-8 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg shadow-slate-900/40">
              <div className="space-y-3">
                <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
                  Summary ready
                </p>
                <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                  Your family&apos;s Teen Driver blueprint
                </h2>
                <p className="text-sm text-slate-300">
                  We translated your answers into a prioritized profile so the concierge can
                  rank vehicles against the factors that matter most.
                </p>
              </div>

              {heroSummary.length ? (
                <div className="grid gap-5 lg:grid-cols-3">
                  {heroSummary.map((item) => (
                    <div
                      key={item.uniqueId}
                      className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-sm shadow-slate-900/40"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold uppercase tracking-wide text-sky-400">
                          {item.question}
                        </p>
                        <p className="text-base font-semibold text-white">{item.choice}</p>
                      </div>
                      <p className="text-sm text-slate-300">{item.description}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="space-y-4 rounded-3xl border border-sky-400/30 bg-sky-500/10 p-6 text-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">Teen Driver shortlist</h3>
                    <p className="text-sm text-slate-200/80">
                      {heroAgentStatus === "loading"
                        ? "Gathering live inventory, insurance data, and negotiation insights…"
                        : heroAgentStatus === "success" && heroRecommendations.length
                        ? "Here’s what the concierge recommends right now."
                        : "Adjust answers anytime to refresh the shortlist."}
                    </p>
                  </div>
                </div>

                {heroAgentStatus === "error" && heroAgentError ? (
                  <p className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {heroAgentError}
                  </p>
                ) : null}

                {heroAgentStatus === "loading" ? (
                  <p className="text-sm text-slate-200/80">
                    Working on it… we’re matching vehicles to your must-haves.
                  </p>
                ) : heroAgentStatus === "success" && heroRecommendations.length ? (
                  <div className="space-y-6">
                    <div className="grid gap-5 lg:grid-cols-2">
                      {heroRecommendations.map((rec, index) => {
                        const candidate = resolveCandidate(rec.vehicle);
                        const hasImage = Boolean(candidate?.image?.url);
                        const msrpLabel = formatMsrpRange(candidate);

                        return (
                          <div
                            key={`${rec.vehicle}-${index}`}
                            className="flex h-full flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-lg shadow-slate-900/40"
                          >
                            <div className="space-y-3">
                              {hasImage ? (
                                <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-900/50">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={candidate?.image?.url ?? ""}
                                    alt={candidate?.name ?? rec.vehicle}
                                    className="h-40 w-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-900/40 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                  Vehicle preview coming soon
                                </div>
                              )}
                              {candidate?.image?.attribution ? (
                                <p className="text-[10px] text-slate-400">
                                  {candidate.image.attribution}
                                </p>
                              ) : null}
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-400">
                                  Recommendation {index + 1}
                                </p>
                                <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-100">
                                  Teen Driver AI
                                </span>
                              </div>
                              <h3 className="text-xl font-semibold text-white">{rec.vehicle}</h3>
                            </div>
                            <div className="space-y-3 text-sm text-slate-200">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Why it fits
                                </p>
                                <p className="mt-1 text-sm leading-relaxed text-slate-200">
                                  {rec.fitSummary}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Safety highlights
                                </p>
                                <p className="mt-1 text-sm leading-relaxed text-slate-200">
                                  {rec.safetyHighpoints}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Cost insights
                                </p>
                                <p className="mt-1 text-sm leading-relaxed text-slate-200">
                                  {rec.costInsights}
                                </p>
                                {msrpLabel ? (
                                  <p className="mt-2 text-xs uppercase tracking-wide text-slate-400/80">
                                    MSRP reference: {msrpLabel}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50">
                              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">
                                Next best step
                              </p>
                              <p className="mt-1 leading-relaxed">{rec.nextStep}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {heroRecommendations.length ? (
                      <div className="mx-auto space-y-4 rounded-3xl border border-white/10 bg-slate-900/60 p-5 lg:max-w-4xl">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h4 className="text-lg font-semibold text-white">
                              Compare your shortlist
                            </h4>
                            <p className="text-sm text-slate-300">
                              Scores and specs reflect how each vehicle matches the priorities you set.
                            </p>
                          </div>
                        </div>
                        <div className="overflow-x-auto lg:overflow-visible">
                          <table className="min-w-full table-fixed divide-y divide-white/10 text-sm text-slate-200">
                            <thead>
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                                  Vehicle &amp; focus
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                                  Match score
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                                  MSRP &amp; cost
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                                  Efficiency &amp; driveline
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                                  Safety highlights
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {heroRecommendations.map((rec, index) => {
                                const candidate = resolveCandidate(rec.vehicle);
                                const msrpLabel = formatMsrpRange(candidate);
                                const fuelLabel = formatFuelEconomy(candidate);
                                const safetySummary = formatSafetySummary(candidate);
                                const breakdownList = formatScoreBreakdown(candidate);
                                const fitTags = candidate?.tags?.fit ?? [];
                                const extrasTags = candidate?.tags?.extras ?? [];
                                const notableSafety = candidate?.safety?.notableFeatures ?? [];

                                return (
                                  <tr key={`${rec.vehicle}-${index}-comparison`} className="align-top">
                                    <td className="px-4 py-4">
                                      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-400">
                                        Rec {index + 1}
                                      </div>
                                      <div className="text-base font-semibold text-white">
                                        {rec.vehicle}
                                      </div>
                                      {(candidate?.bodyStyle || candidate?.drivetrain) && (
                                        <p className="mt-1 text-xs text-slate-400">
                                          {[
                                            candidate?.bodyStyle ? `Body: ${candidate.bodyStyle}` : null,
                                            candidate?.drivetrain ? `Drivetrain: ${candidate.drivetrain}` : null,
                                          ]
                                            .filter(Boolean)
                                            .join(" • ")}
                                        </p>
                                      )}
                                      {fitTags.length ? (
                                        <p className="mt-1 text-xs text-slate-400">
                                          Focus: {fitTags.join(", ")}
                                        </p>
                                      ) : null}
                                      {extrasTags.length ? (
                                        <p className="mt-1 text-xs text-slate-400">
                                          Feel-good factors: {extrasTags.join(", ")}
                                        </p>
                                      ) : null}
                                      <p className="mt-2 text-xs leading-relaxed text-slate-300">
                                        {rec.fitSummary}
                                      </p>
                                    </td>
                                    <td className="px-4 py-4 align-top">
                                      <div className="text-lg font-semibold text-white">
                                        {candidate ? Math.round(candidate.score) : "—"}
                                      </div>
                                      {breakdownList.length ? (
                                        <ul className="mt-2 space-y-1 text-xs text-slate-400">
                                          {breakdownList.map((item) => (
                                            <li key={item}>{item}</li>
                                          ))}
                                        </ul>
                                      ) : null}
                                    </td>
                                    <td className="px-4 py-4 align-top">
                                      <p className="font-medium text-white">{msrpLabel ?? "—"}</p>
                                      <p className="mt-2 text-xs leading-relaxed text-slate-300">
                                        {rec.costInsights}
                                      </p>
                                    </td>
                                    <td className="px-4 py-4 align-top">
                                      <p className="font-medium text-white">
                                        {fuelLabel ?? "Efficiency data coming soon"}
                                      </p>
                                      {candidate?.highlights?.tech?.length ? (
                                        <p className="mt-2 text-xs leading-relaxed text-slate-300">
                                          Tech: {candidate.highlights.tech.join(", ")}
                                        </p>
                                      ) : null}
                                    </td>
                                    <td className="px-4 py-4 align-top">
                                      <p className="font-medium text-white">
                                        {safetySummary ?? "Safety ratings pending"}
                                      </p>
                                      <p className="mt-2 text-xs leading-relaxed text-slate-300">
                                        {rec.safetyHighpoints}
                                      </p>
                                      {notableSafety.length ? (
                                        <ul className="mt-2 space-y-1 text-xs text-slate-400">
                                          {notableSafety.slice(0, 2).map((note) => (
                                            <li key={note}>{note}</li>
                                          ))}
                                          {notableSafety.length > 2 ? (
                                            <li className="text-slate-500">+ more safety notes</li>
                                          ) : null}
                                        </ul>
                                      ) : null}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}

                    {heroAgentResponse ? (
                      <details className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 text-slate-200">
                        <summary className="cursor-pointer text-sm font-semibold text-slate-100">
                          View raw agent payload
                        </summary>
                        <pre className="mt-3 max-h-[320px] overflow-auto rounded-2xl bg-slate-950/80 p-4 text-sm text-sky-100">
                          {heroAgentResponse}
                        </pre>
                      </details>
                    ) : null}
                  </div>
                ) : heroAgentStatus === "success" ? (
                  <p className="text-sm text-slate-200/80">
                    Agent completed, but no recommendations were returned. Try refining your
                    answers and run the concierge again.
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <section
          id="features"
          className="mx-auto mb-24 max-w-6xl px-6 sm:px-10"
        >
          <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/70 text-sky-400">
                  ●
                </div>
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section
        id="how-it-works"
        className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-24 sm:px-10"
      >
        <h2 className="text-3xl font-semibold text-white sm:text-4xl">
          How Teen Driver guides your decision
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.label}
              className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg shadow-slate-900/40"
            >
              <span className="text-sm font-semibold uppercase tracking-wide text-sky-400">
                Step {index + 1}
              </span>
              <h3 className="mt-3 text-xl font-semibold text-white">{step.label}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{step.detail}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-6 rounded-3xl border border-white/10 bg-linear-to-r from-slate-900/80 via-slate-900 to-slate-900/70 p-8 sm:grid-cols-3">
          <div>
            <p className="text-4xl font-semibold text-white">92%</p>
            <p className="mt-2 text-sm text-slate-300">
              of parents felt more confident negotiating after using Teen Driver.
            </p>
          </div>
          <div>
            <p className="text-4xl font-semibold text-white">3.5 hrs</p>
            <p className="mt-2 text-sm text-slate-300">
              average research time saved per family in the first week.
            </p>
          </div>
          <div>
            <p className="text-4xl font-semibold text-white">4.9 ★</p>
            <p className="mt-2 text-sm text-slate-300">
              satisfaction across concierge calls and shortlist reports.
            </p>
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="mx-auto max-w-6xl space-y-8 px-6 pb-24 sm:px-10"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              FAQs for vigilant parents
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Straight answers to the most common questions we hear.
            </p>
          </div>
          <a
            href="mailto:hello@teendriver.ai"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white hover:text-white"
          >
            Still curious? Email us →
          </a>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {faqs.map((faq) => (
            <div
              key={faq.question}
              className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg shadow-slate-900/40"
            >
              <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
              <p className="text-sm leading-relaxed text-slate-300">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <p>© {new Date().getFullYear()} Teen Driver. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a className="transition hover:text-white" href="#">
              Privacy
            </a>
            <a className="transition hover:text-white" href="#">
              Terms
            </a>
            <a className="transition hover:text-white" href="#">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
