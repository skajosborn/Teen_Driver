'use client';

import { useCallback, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import type { AgentVehicleCandidate } from "@/lib/agent";
import { questions, type Question } from "@/lib/quiz/questions";

function humanizeTag(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

const SCORE_BREAKDOWN_LABELS: Record<string, string> = {
  budget: "Budget",
  safety: "Safety",
  usage: "Usage",
  extras: "Extras",
};

type Response = {
  optionId?: string;
  optionIds?: string[];
  priority: number;
  text?: string;
};

type StructuredPreference = {
  questionId: string;
  label: string;
  priority: number;
  type: Question["type"];
  selectedValues?: string[];
  selectedLabels?: string[];
  descriptions?: string[];
  notes?: string;
};

type SummarizedEntry = {
  uniqueId: string;
  questionId: string;
  question: string;
  choice: string;
  description: string;
  value: string;
  priority: number;
  type: Question["type"];
};

const DEFAULT_PRIORITY = 3;

const isQuestionAnswered = (question: Question, response?: Response) => {
  if (!response) {
    return question.required === false;
  }

  if (question.type === "single") {
    return Boolean(response.optionId);
  }

  if (question.type === "multi") {
    const min = question.minSelections ?? 1;
    return (response.optionIds?.length ?? 0) >= min;
  }

  if (question.type === "text") {
    if (question.required === false) {
      return true;
    }
    return Boolean(response.text?.trim());
  }

  return false;
};

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
    if (!candidate.includes('"recommendations"')) {
      continue;
    }
    const parsed = attemptParse(candidate);
    if (parsed) {
      return parsed;
    }
  }

  return null;
};

const hasRecommendations = (
  value: ParsedRecommendationPayload,
): value is ParsedRecommendationSuccess =>
  Boolean(value && Array.isArray(value.items));

export default function QuizPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [viewSummary, setViewSummary] = useState(false);
  const [agentStatus, setAgentStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [agentResponse, setAgentResponse] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<
    {
      vehicle: string;
      fitSummary: string;
      safetyHighpoints: string;
      costInsights: string;
      nextStep: string;
    }[]
  >([]);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [agentCandidates, setAgentCandidates] = useState<AgentVehicleCandidate[]>([]);
  const [lookupYear, setLookupYear] = useState("");
  const [lookupMake, setLookupMake] = useState("");
  const [lookupModel, setLookupModel] = useState("");
  const [lookupStatus, setLookupStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<{
    match: AgentVehicleCandidate | null;
    rank: number | null;
    totalCompared: number;
    leaderboard: AgentVehicleCandidate[];
    yearExact: boolean | null;
    availableYears: number[];
    message?: string;
  } | null>(null);

  const futureYear = useMemo(() => new Date().getFullYear() + 1, []);

  const currentQuestion = questions[stepIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = stepIndex === totalQuestions - 1;

  const completedCount = useMemo(() => {
    return questions.reduce((count, question) => {
      const response = responses[question.id];
      return count + (isQuestionAnswered(question, response) ? 1 : 0);
    }, 0);
  }, [responses]);

  const progressPercent = totalQuestions
    ? Math.round((completedCount / totalQuestions) * 100)
    : 0;

  const structuredPreferences: StructuredPreference[] = useMemo(() => {
    return questions
      .map((question) => {
        const response = responses[question.id];
        if (!isQuestionAnswered(question, response)) {
          return null;
        }

        const priority = response?.priority ?? DEFAULT_PRIORITY;

        if (question.type === "single" && response?.optionId) {
          const option = question.options.find(
            (item) => item.id === response.optionId,
          );
          if (!option) return null;

          return {
            questionId: question.id,
            label: question.title,
            priority,
            type: question.type,
            selectedValues: [option.value],
            selectedLabels: [option.label],
            descriptions: [option.description],
          };
        }

        if (question.type === "multi" && response?.optionIds?.length) {
          const selectedOptions = question.options.filter((option) =>
            response.optionIds?.includes(option.id),
          );
          if (!selectedOptions.length) return null;

          return {
            questionId: question.id,
            label: question.title,
            priority,
            type: question.type,
            selectedValues: selectedOptions.map((option) => option.value),
            selectedLabels: selectedOptions.map((option) => option.label),
            descriptions: selectedOptions.map((option) => option.description),
          };
        }

        if (question.type === "text" && response?.text?.trim()) {
          return {
            questionId: question.id,
            label: question.title,
            priority,
            type: question.type,
            notes: response.text.trim(),
          };
        }

        return null;
      })
      .filter(Boolean) as StructuredPreference[];
  }, [responses]);

  const summarizedEntries: SummarizedEntry[] = useMemo(() => {
    return structuredPreferences
      .flatMap((preference) => {
        if (preference.type === "text" && preference.notes) {
          return [
            {
              uniqueId: `${preference.questionId}-notes`,
              questionId: preference.questionId,
              question: preference.label,
              choice: preference.notes,
              description: "Custom notes provided by the family.",
              value: "custom-note",
              priority: preference.priority,
              type: preference.type,
            },
          ];
        }

        if (
          (preference.type === "single" || preference.type === "multi") &&
          preference.selectedLabels &&
          preference.selectedValues &&
          preference.descriptions
        ) {
          return preference.selectedValues.map((value, index) => ({
            uniqueId: `${preference.questionId}-${value}-${index}`,
            questionId: preference.questionId,
            question: preference.label,
            choice: preference.selectedLabels?.[index] ?? value,
            description: preference.descriptions?.[index] ?? "",
            value,
            priority: preference.priority,
            type: preference.type,
          }));
        }

        return [];
      })
      .sort((a, b) => b.priority - a.priority);
  }, [structuredPreferences]);

  const handleOptionChange = (questionId: string, optionId: string) => {
    const question = questions.find((item) => item.id === questionId);
    if (!question) return;

    if (question.type === "multi") {
      setResponses((prev) => {
        const prevSelection = prev[questionId]?.optionIds ?? [];
        const exists = prevSelection.includes(optionId);
        const nextSelection = exists
          ? prevSelection.filter((id) => id !== optionId)
          : [...prevSelection, optionId];
        const priority = prev[questionId]?.priority ?? DEFAULT_PRIORITY;

        return {
          ...prev,
          [questionId]: {
            optionIds: nextSelection,
            priority,
          },
        };
      });
      return;
    }

    if (question.type === "single") {
      setResponses((prev) => {
        const prevPriority = prev[questionId]?.priority ?? DEFAULT_PRIORITY;
        return {
          ...prev,
          [questionId]: {
            optionId,
            priority: prevPriority,
          },
        };
      });
    }
  };

  const handlePriorityChange = (questionId: string, priority: number) => {
    setResponses((prev) => {
      const prevResponse = prev[questionId] ?? { priority: DEFAULT_PRIORITY };
      return {
        ...prev,
        [questionId]: {
          ...prevResponse,
          priority,
        },
      };
    });
  };

  const handleTextChange = (questionId: string, value: string) => {
    setResponses((prev) => {
      const prevPriority = prev[questionId]?.priority ?? DEFAULT_PRIORITY;
      return {
        ...prev,
        [questionId]: {
          ...prev[questionId],
          text: value,
          priority: prevPriority,
        },
      };
    });
  };

  const goNext = () => {
    if (isLastQuestion) {
      setViewSummary(true);
    } else {
      setStepIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
    }
  };

  const goPrevious = () => {
    if (stepIndex === 0) return;
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const resetQuiz = () => {
    setResponses({});
    setStepIndex(0);
    setViewSummary(false);
    setAgentStatus("idle");
    setAgentResponse(null);
    setAgentError(null);
    setAgentCandidates([]);
    setRecommendations([]);
    setLookupYear("");
    setLookupMake("");
    setLookupModel("");
    setLookupStatus("idle");
    setLookupError(null);
    setLookupResult(null);
  };

  const canAdvance = useMemo(() => {
    if (!currentQuestion) return false;
    const response = responses[currentQuestion.id];
    return isQuestionAnswered(currentQuestion, response);
  }, [currentQuestion, responses]);

  const showPriorityControl =
    currentQuestion.type !== "text" ||
    Boolean(responses[currentQuestion.id]?.text?.trim());

  const structuredPayload = useMemo(() => {
    return {
      preferences: structuredPreferences.map((preference) => ({
        questionId: preference.questionId,
        label: preference.label,
        priority: preference.priority,
        type: preference.type,
        selectedValues: preference.selectedValues,
        notes: preference.notes,
      })),
    };
  }, [structuredPreferences]);

  const candidateLookup = useMemo(() => {
    const map = new Map<string, AgentVehicleCandidate>();
    agentCandidates.forEach((candidate) => {
      map.set(candidate.name.toLowerCase(), candidate);
    });
    return map;
  }, [agentCandidates]);

  const resolveCandidate = useCallback(
    (vehicleName: string) => {
      const lower = vehicleName.toLowerCase();
      if (candidateLookup.has(lower)) {
        return candidateLookup.get(lower);
      }
      return agentCandidates.find((candidate) => {
        const candidateName = candidate.name.toLowerCase();
        return candidateName.includes(lower) || lower.includes(candidateName);
      });
    },
    [agentCandidates, candidateLookup],
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
        const label = SCORE_BREAKDOWN_LABELS[key] ?? key;
        const rounded = Math.round(value);
        const prefix = rounded > 0 ? "+" : "";
        return `${label}: ${prefix}${rounded}`;
      })
      .filter(Boolean) as string[];
  }, []);

  const hasSummary = summarizedEntries.length > 0;
  const hasRecommendationsReady = agentStatus === "success" && recommendations.length > 0;
  const agentHelperText =
    agentStatus === "loading"
      ? "Gathering live inventory, insurance data, and negotiation insights…"
      : hasRecommendationsReady
      ? "Here’s your tailored shortlist from the Teen Driver concierge."
      : "We’ll hand this payload to your AI concierge and return a tailored shortlist.";
  const agentButtonLabel =
    agentStatus === "loading"
      ? "Contacting agent..."
      : hasRecommendationsReady
      ? "Regenerate shortlist"
      : "Generate shortlist";

  const handleSendToAgent = async () => {
    if (!hasSummary || agentStatus === "loading") {
      return;
    }

    try {
      setAgentStatus("loading");
      setAgentError(null);
      setAgentResponse(null);
      setAgentCandidates([]);

      const payload = {
        ...structuredPayload,
        metadata: {
          submittedAt: new Date().toISOString(),
          sessionId: crypto.randomUUID(),
        },
      };

      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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
      setAgentCandidates(data.candidates ?? []);
      const raw = data.recommendations;
      if (!raw) {
        setAgentResponse(
          "Agent completed without returning recommendations. Try again shortly.",
        );
        setRecommendations([]);
        setAgentStatus("success");
        return;
      }

      const parsed = extractRecommendationsFromRaw(raw);

      if (hasRecommendations(parsed)) {
        const items = parsed.items ?? [];
        setRecommendations(
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
        setAgentResponse(parsed.json);
      } else {
        console.error("[quiz] unable to parse recommendations payload", raw);
        setRecommendations([]);
        setAgentResponse(raw);
      }

      setAgentStatus("success");
    } catch (error) {
      setAgentStatus("error");
      setAgentError(
        error instanceof Error
          ? error.message
          : "Something went wrong sending your profile to the agent.",
      );
      setAgentCandidates([]);
    }
  };

  const handleVehicleLookup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasSummary) return;

    const trimmedMake = lookupMake.trim();
    const trimmedModel = lookupModel.trim();
    const trimmedYear = lookupYear.trim();

    if (!trimmedMake || !trimmedModel) {
      setLookupStatus("error");
      setLookupError("Please provide both a make and model to evaluate.");
      return;
    }

    let yearNumber: number | undefined;
    if (trimmedYear) {
      const parsed = Number.parseInt(trimmedYear, 10);
      if (Number.isNaN(parsed)) {
        setLookupStatus("error");
        setLookupError("Year must be a valid number (e.g., 2016).");
        return;
      }
      const currentYear = futureYear;
      if (parsed < 1985 || parsed > currentYear) {
        setLookupStatus("error");
        setLookupError(`Enter a year between 1985 and ${currentYear}.`);
        return;
      }
      yearNumber = parsed;
    }

    setLookupStatus("loading");
    setLookupError(null);

    try {
      const response = await fetch("/api/vehicle-ranking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preferences: structuredPayload.preferences,
          vehicle: {
            make: trimmedMake,
            model: trimmedModel,
            year: yearNumber ?? null,
          },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(
          errorBody?.error ?? "Unable to evaluate that vehicle right now.",
        );
      }

      const data = (await response.json()) as {
        match?: AgentVehicleCandidate | null;
        rank?: number | null;
        totalCompared?: number;
        leaderboard?: AgentVehicleCandidate[];
        yearExact?: boolean | null;
        message?: string;
      };

      setLookupResult({
        match: data.match ?? null,
        rank:
          typeof data.rank === "number" && Number.isFinite(data.rank)
            ? data.rank
            : null,
        totalCompared:
          typeof data.totalCompared === "number" && Number.isFinite(data.totalCompared)
            ? data.totalCompared
            : 0,
        leaderboard: Array.isArray(data.leaderboard) ? data.leaderboard : [],
        yearExact: typeof data.yearExact === "boolean" ? data.yearExact : null,
        availableYears: Array.isArray(data.availableYears)
          ? data.availableYears
              .map((value) => {
                if (typeof value === "number") return value;
                if (typeof value === "string") {
                  const parsed = Number.parseInt(value, 10);
                  return Number.isNaN(parsed) ? null : parsed;
                }
                return null;
              })
              .filter((value): value is number => value !== null)
          : [],
        message: data.message,
      });
      setLookupStatus("success");
    } catch (error) {
      setLookupStatus("error");
      setLookupError(
        error instanceof Error
          ? error.message
          : "Unable to evaluate that vehicle right now.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 sm:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/90 text-lg font-semibold text-slate-950 shadow-lg shadow-sky-500/30">
              TD
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">Teen Driver</p>
              <p className="text-sm text-slate-300">Parent-first car concierge</p>
            </div>
          </Link>
          <div className="hidden text-sm text-slate-300 sm:block">
            {viewSummary ? "Summary" : `Question ${stepIndex + 1} of ${totalQuestions}`}
          </div>
        </div>
      </header>

      <main className="mx-auto mt-12 max-w-5xl px-6 sm:px-10">
        {!viewSummary ? (
          <>
            <div className="mb-8">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-300">
                <span>Progress</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 via-sky-500 to-emerald-400 transition-all"
                  style={{ width: `${Math.max(progressPercent, 8)}%` }}
                />
              </div>
            </div>

            {currentQuestion ? (
              <section className="space-y-8">
                <div className="space-y-4">
                  <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                    {stepIndex + 1} / {totalQuestions}
                  </p>
                  <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                    {currentQuestion.title}
                  </h1>
                  <p className="text-lg text-slate-300">{currentQuestion.prompt}</p>
                  {currentQuestion.helper ? (
                    <p className="text-sm text-slate-400">{currentQuestion.helper}</p>
                  ) : null}
                </div>

                <div className="space-y-4">
                  {currentQuestion.type === "text" ? (
                    <textarea
                      rows={5}
                      placeholder={currentQuestion.placeholder}
                      value={responses[currentQuestion.id]?.text ?? ""}
                      onChange={(event) =>
                        handleTextChange(currentQuestion.id, event.target.value)
                      }
                      className="w-full rounded-3xl border border-white/10 bg-slate-900/50 p-6 text-sm text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                    />
                  ) : (
                    currentQuestion.options.map((option) => {
                      const response = responses[currentQuestion.id];
                      const isSelected =
                        currentQuestion.type === "multi"
                          ? response?.optionIds?.includes(option.id)
                          : response?.optionId === option.id;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            handleOptionChange(currentQuestion.id, option.id)
                          }
                          className={[
                            "w-full rounded-3xl border p-6 text-left transition-all",
                            "border-white/10 bg-slate-900/50 hover:border-sky-400/60 hover:bg-slate-900/80",
                            isSelected
                              ? "border-sky-400/80 bg-slate-900/80 shadow-lg shadow-sky-500/20"
                              : "",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2">
                              <p className="text-lg font-semibold text-white">
                                {option.label}
                              </p>
                              <p className="text-sm text-slate-300">
                                {option.description}
                              </p>
                            </div>
                            <span
                              className={[
                                "mt-1 inline-flex items-center justify-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider",
                                isSelected
                                  ? "border-sky-400 bg-sky-400/20 text-sky-100"
                                  : "border-white/10 text-slate-500",
                              ].join(" ")}
                            >
                              {currentQuestion.type === "multi" ? (
                                <>
                                  <span
                                    className={[
                                      "flex h-4 w-4 items-center justify-center rounded-sm border",
                                      isSelected
                                        ? "border-sky-300 bg-sky-400 text-slate-950"
                                        : "border-white/30 bg-transparent text-transparent",
                                    ].join(" ")}
                                  >
                                    ✓
                                  </span>
                                  {isSelected ? "Selected" : "Choose"}
                                </>
                              ) : (
                                <>{isSelected ? "Selected" : "Choose"}</>
                              )}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {showPriorityControl ? (
                  <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/50 p-6">
                    <div className="flex items-center justify-between gap-4 text-sm font-semibold text-slate-200">
                      <span>How important is this factor?</span>
                      <span>
                        Priority:{" "}
                        <strong className="text-white">
                          {responses[currentQuestion.id]?.priority ?? DEFAULT_PRIORITY} / 5
                        </strong>
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={responses[currentQuestion.id]?.priority ?? DEFAULT_PRIORITY}
                      onChange={(event) =>
                        handlePriorityChange(
                          currentQuestion.id,
                          Number.parseInt(event.target.value, 10),
                        )
                      }
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-sky-500"
                    />
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Nice to have</span>
                      <span>Non-negotiable</span>
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={goPrevious}
                    disabled={stepIndex === 0}
                    className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-white hover:text-white disabled:cursor-not-allowed disabled:border-white/10 disabled:text-slate-500"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canAdvance}
                    className="inline-flex items-center justify-center rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
                  >
                    {isLastQuestion ? "Review my plan" : "Next →"}
                  </button>
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <section className="space-y-10">
            <div className="space-y-4">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
                Summary Ready
              </p>
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                Your family’s Teen Driver blueprint
              </h1>
              <p className="text-lg text-slate-300">
                We prioritize each factor you selected so our AI agent can scout
                vehicles that honor your non-negotiables first.
              </p>
            </div>

            <div className="grid gap-6">
              {summarizedEntries.map((item) => (
                <div
                  key={item.uniqueId}
                  className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg shadow-slate-900/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold uppercase tracking-wide text-sky-400">
                        Priority {item.priority}
                      </p>
                      <h2 className="text-xl font-semibold text-white">{item.question}</h2>
                      <p className="text-sm text-slate-300">{item.choice}</p>
                    </div>
                    <span className="rounded-full border border-sky-400/50 bg-sky-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-100">
                      {item.value}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4 rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-6 text-emerald-50">
              <h2 className="text-lg font-semibold">What happens next?</h2>
              <ul className="space-y-3 text-sm leading-relaxed">
                <li>
                  • We feed this profile directly into your agentic Teen Driver concierge.
                </li>
                <li>
                  • You’ll receive a shortlist with market availability, negotiation notes,
                  and insurance insights ranked by priority.
                </li>
                <li>
                  • Want to fine-tune? Re-run the quiz anytime—your history stays synced.
                </li>
              </ul>
            </div>

            <details className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-slate-200">
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-left text-sm font-semibold text-white">
                <span>Structured payload (advanced)</span>
                <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200">
                  Copy for agent
                </span>
              </summary>
              <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950/80 p-4 text-sm text-sky-200">
                {JSON.stringify(structuredPayload, null, 2)}
              </pre>
              <p className="text-xs text-slate-400">
                Paste this JSON into your AI workflow or connect it directly via an API
                route to generate recommendations.
              </p>
            </details>

            <div className="space-y-5 rounded-3xl border border-purple-400/30 bg-purple-500/10 p-6 text-slate-100">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">
                  Already have a vehicle in mind?
                </h2>
                <p className="text-sm text-slate-200/80">
                  Enter a year, make, and model to see how it stacks up against your teen driver
                  priorities. We’ll compare it to every vehicle in your concierge catalog.
                </p>
              </div>

              <form
                onSubmit={handleVehicleLookup}
                className="grid gap-4 lg:grid-cols-[minmax(100px,140px)_repeat(2,minmax(0,1fr))_auto] lg:items-end"
              >
                <div className="space-y-1">
                  <label
                    htmlFor="lookup-year"
                    className="text-xs font-semibold uppercase tracking-wide text-slate-300"
                  >
                    Year (optional)
                  </label>
                  <input
                    id="lookup-year"
                    type="number"
                    min={1985}
                    max={futureYear}
                    value={lookupYear}
                    onChange={(event) => setLookupYear(event.target.value)}
                    placeholder="2016"
                    className="w-full rounded-2xl border border-white/20 bg-slate-900/40 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="lookup-make"
                    className="text-xs font-semibold uppercase tracking-wide text-slate-300"
                  >
                    Make *
                  </label>
                  <input
                    id="lookup-make"
                    type="text"
                    value={lookupMake}
                    onChange={(event) => setLookupMake(event.target.value)}
                    placeholder="Toyota"
                    className="w-full rounded-2xl border border-white/20 bg-slate-900/40 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="lookup-model"
                    className="text-xs font-semibold uppercase tracking-wide text-slate-300"
                  >
                    Model *
                  </label>
                  <input
                    id="lookup-model"
                    type="text"
                    value={lookupModel}
                    onChange={(event) => setLookupModel(event.target.value)}
                    placeholder="Corolla"
                    className="w-full rounded-2xl border border-white/20 bg-slate-900/40 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={
                    !hasSummary || lookupStatus === "loading" || !lookupMake.trim() || !lookupModel.trim()
                  }
                  className="flex h-11 items-center justify-center rounded-full bg-purple-400 px-6 text-sm font-semibold text-slate-950 shadow-lg shadow-purple-500/40 transition hover:bg-purple-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
                >
                  {lookupStatus === "loading" ? "Scoring…" : "Score this vehicle"}
                </button>
              </form>

              {lookupStatus === "error" && lookupError ? (
                <p className="rounded-2xl border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {lookupError}
                </p>
              ) : null}

              {lookupStatus === "success" && lookupResult ? (
                lookupResult.match ? (
                  <div className="space-y-5 rounded-2xl border border-white/15 bg-slate-900/50 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-300">
                          Ranked vehicle
                        </p>
                        <h3 className="text-xl font-semibold text-white">
                          {lookupResult.match?.name ?? "Vehicle"}
                        </h3>
                        <p className="mt-1 text-xs text-slate-300">
                          {lookupResult.message ??
                            `Calculated score with ${lookupResult.totalCompared} vehicles in your catalog.`}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-purple-300/40 bg-purple-500/20 px-4 py-2 text-sm font-semibold text-purple-100">
                        Score {lookupResult.match ? Math.round(lookupResult.match.score) : "—"}
                      </div>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-3">
                        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Placement
                          </p>
                          <p className="mt-2 text-sm text-slate-200">
                            {lookupResult.rank
                              ? `Ranked #${lookupResult.rank} out of ${lookupResult.totalCompared} scored vehicles.`
                              : "Evaluated against your priorities."}
                          </p>
                          {lookupResult.yearExact === false ? (
                            <p className="mt-2 text-xs text-amber-200">
                              We matched the closest trim in our data
                              {lookupResult.availableYears.length
                                ? ` (${lookupResult.availableYears.join(", ")})`
                                : ""}.
                              Update your catalog to include the exact year for even tighter scoring.
                            </p>
                          ) : null}
                        </div>
                        <div className="space-y-2 text-xs text-slate-300">
                          <div>
                            <span className="font-semibold text-slate-200">MSRP range:</span>{" "}
                            {formatMsrpRange(lookupResult.match) ?? "Not available"}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-200">Efficiency:</span>{" "}
                            {formatFuelEconomy(lookupResult.match) ?? "Fuel data coming soon"}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-200">Safety badges:</span>{" "}
                            {formatSafetySummary(lookupResult.match) ?? "Ratings pending"}
                          </div>
                          {lookupResult.match?.scoreBreakdown ? (
                            <div>
                              <span className="font-semibold text-slate-200">Score breakdown:</span>
                              <ul className="mt-1 space-y-1 text-slate-400">
                                {formatScoreBreakdown(lookupResult.match).map((item) => (
                                  <li key={item}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-300">
                          Top matches right now
                        </p>
                        <ul className="space-y-3">
                          {lookupResult.leaderboard.slice(0, 4).map((item, index) => (
                            <li
                              key={`${item.id}-${index}-leaderboard`}
                              className={`rounded-2xl border border-white/10 bg-slate-950/40 p-4 ${
                                lookupResult.match?.id === item.id
                                  ? "border-purple-300/60 bg-purple-500/10"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-white">
                                  #{index + 1} · {item.name}
                                </p>
                                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                                  Score {Math.round(item.score)}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-slate-400">
                                {formatMsrpRange(item) ?? "MSRP coming soon"} •{" "}
                                {formatFuelEconomy(item) ?? "Fuel TBD"}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
                    {lookupResult.message ??
                      "We couldn’t find that vehicle in the catalog yet. Try another year or confirm the spelling."}
                  </p>
                )
              ) : null}
            </div>

            <div className="space-y-4 rounded-3xl border border-sky-400/30 bg-sky-500/10 p-6 text-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Send to Teen Driver agent</h2>
                  <p className="text-sm text-slate-200/80">{agentHelperText}</p>
                </div>
                <button
                  type="button"
                  onClick={handleSendToAgent}
                  disabled={!hasSummary || agentStatus === "loading"}
                  className="inline-flex items-center justify-center rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
                >
                  {agentButtonLabel}
                </button>
              </div>

              {agentStatus === "error" && agentError ? (
                <p className="rounded-2xl border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {agentError}
                </p>
              ) : null}

              {agentStatus === "loading" ? null : hasRecommendationsReady ? (
                <div className="space-y-6">
                  <div className="grid gap-5 lg:grid-cols-2">
                    {recommendations.map((rec, index) => {
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
                            <h3 className="text-xl font-semibold text-white">
                              {rec.vehicle}
                            </h3>
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
                  {recommendations.length ? (
                    <div className="mx-auto space-y-4 rounded-3xl border border-white/10 bg-slate-900/60 p-5 lg:max-w-4xl">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="text-lg font-semibold text-white">Compare your shortlist</h4>
                          <p className="text-sm text-slate-300">
                            Scores and specs below reflect how each vehicle matches the priorities you
                            set for your teen driver.
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
                            {recommendations.map((rec, index) => {
                              const candidate = resolveCandidate(rec.vehicle);
                              const msrpLabel = formatMsrpRange(candidate);
                              const fuelLabel = formatFuelEconomy(candidate);
                              const safetySummary = formatSafetySummary(candidate);
                              const breakdownList = formatScoreBreakdown(candidate);
                              const fitTags = candidate?.tags?.fit?.map(humanizeTag) ?? [];
                              const extrasTags = candidate?.tags?.extras?.map(humanizeTag) ?? [];
                              const notableSafety = candidate?.safety?.notableFeatures ?? [];

                              return (
                                <tr key={`${rec.vehicle}-${index}-comparison`} className="align-top">
                                  <td className="px-4 py-4">
                                    <div className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-400">
                                      Rec {index + 1}
                                    </div>
                                    <div className="text-base font-semibold text-white">{rec.vehicle}</div>
                                    {candidate?.bodyStyle || candidate?.drivetrain ? (
                                      <p className="mt-1 text-xs text-slate-400">
                                        {[
                                          candidate?.bodyStyle ? `Body: ${candidate.bodyStyle}` : null,
                                          candidate?.drivetrain ? `Drivetrain: ${candidate.drivetrain}` : null,
                                        ]
                                          .filter(Boolean)
                                          .join(" • ")}
                                      </p>
                                    ) : null}
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
                                    <p className="mt-2 text-xs leading-relaxed text-slate-300">{rec.fitSummary}</p>
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
                                    <p className="mt-2 text-xs leading-relaxed text-slate-300">{rec.costInsights}</p>
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
                                          <li className="text-slate-500">+ more safety notes in detail</li>
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
                  {agentResponse ? (
                    <details className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 text-slate-200">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-100">
                        View raw agent payload
                      </summary>
                      <pre className="mt-3 max-h-[320px] overflow-auto rounded-2xl bg-slate-950/80 p-4 text-sm text-sky-100">
                        {agentResponse}
                      </pre>
                    </details>
                  ) : null}
                </div>
              ) : agentStatus === "success" ? (
                <p className="text-sm text-slate-200/80">
                  Agent completed, but no recommendations were returned. Try refining
                  your answers or running it again.
                </p>
              ) : (
                <p className="text-xs text-slate-300/80">
                  After generating, you can refine your answers and run the agent again.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-white hover:text-white"
              >
                ← Back to landing
              </Link>
              <button
                type="button"
                onClick={resetQuiz}
                className="inline-flex items-center justify-center rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 transition hover:bg-sky-400"
              >
                Start over
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

