'use client';

import { useMemo, useState } from "react";
import Link from "next/link";

type Option = {
  id: string;
  label: string;
  description: string;
  value: string;
};

type BaseQuestion = {
  id: string;
  title: string;
  prompt: string;
  helper?: string;
};

type SingleQuestion = BaseQuestion & {
  type: "single";
  options: Option[];
};

type MultiQuestion = BaseQuestion & {
  type: "multi";
  options: Option[];
  minSelections?: number;
  maxSelections?: number;
};

type TextQuestion = BaseQuestion & {
  type: "text";
  placeholder?: string;
};

type Question = SingleQuestion | MultiQuestion | TextQuestion;

const questions: Question[] = [
  {
    id: "budget",
    title: "Budget & financing comfort zone",
    prompt:
      "How would you describe the budget you are comfortable with for your teen’s car?",
    helper:
      "Consider total purchase price, financing, and insurance costs you’d be comfortable authorizing today.",
    type: "single",
    options: [
      {
        id: "budget-value",
        label: "Value-first purchase",
        description:
          "Prioritize reliability and total cost of ownership under $18K. OK with higher mileage if documented.",
        value: "value",
      },
      {
        id: "budget-certified",
        label: "Certified pre-owned sweet spot",
        description:
          "Prefer 1–3 year old vehicles with warranties intact. Budget $18K–$28K and flexible on trims.",
        value: "cpo-balance",
      },
      {
        id: "budget-premium",
        label: "Premium peace of mind",
        description:
          "Willing to invest $28K+ for top-tier safety, tech, and dealer service history.",
        value: "premium",
      },
    ],
  },
  {
    id: "safety",
    title: "Safety & crash-test expectations",
    prompt: "What describes your minimum safety threshold?",
    helper:
      "Think about the crash ratings, driver assistance, and insurance implications that make you confident handing over the keys.",
    type: "single",
    options: [
      {
        id: "safety-essential",
        label: "Essential protections",
        description:
          "NHTSA 4★ minimum, rear camera, and stability control are must-haves. ADAS is a bonus.",
        value: "baseline-safety",
      },
      {
        id: "safety-advanced",
        label: "Advanced driver assistance",
        description:
          "Requires blind-spot, lane-keep, and automatic emergency braking with strong IIHS ratings.",
        value: "advanced-adas",
      },
      {
        id: "safety-max",
        label: "Maximum assurance",
        description:
          "Top Safety Pick+, teen driver monitoring, crash avoidance suites, and excellent insurance loss results.",
        value: "max-safety",
      },
    ],
  },
  {
    id: "usage",
    title: "How your teen will use the car",
    prompt: "What best matches how the car will be used week-to-week?",
    helper:
      "We’ll use this to balance city vs. highway mileage, storage, and the convenience features you’ll actually use.",
    type: "single",
    options: [
      {
        id: "usage-commute",
        label: "Daily commute & errands",
        description:
          "Focus on fuel efficiency, easy parking, and durable interiors for constant in-and-out use.",
        value: "daily-commute",
      },
      {
        id: "usage-shared",
        label: "Shared family duty",
        description:
          "Needs flexible seating, cargo room, and comfort for longer trips with siblings or teammates.",
        value: "shared-family",
      },
      {
        id: "usage-adventure",
        label: "Weekend adventures",
        description:
          "Prioritize all-weather confidence, roof/cargo mounts, and infotainment to make road trips fun.",
        value: "adventure",
      },
    ],
  },
  {
    id: "tech",
    title: "Tech & convenience priorities",
    prompt: "Which tech package feels essential for your family?",
    helper:
      "We’ll balance driver coaching features with the infotainment and remote tools you expect.",
    type: "single",
    options: [
      {
        id: "tech-core",
        label: "Core connectivity",
        description:
          "Apple CarPlay/Android Auto, USB-C, and basic drive mode selectors. Teen can learn without distractions.",
        value: "core-connectivity",
      },
      {
        id: "tech-monitoring",
        label: "Teen monitoring suite",
        description:
          "Built-in speed alerts, geofencing, remote start, and app control for coaching while you’re away.",
        value: "monitoring-suite",
      },
      {
        id: "tech-lux",
        label: "Premium tech experience",
        description:
          "Heads-up display, surround view cameras, premium audio, and adaptive cruise so every ride feels modern.",
        value: "premium-tech",
      },
    ],
  },
  {
    id: "timeline",
    title: "Timeline & readiness",
    prompt: "How quickly do you plan to finalize a vehicle?",
    helper:
      "Understanding timing helps us decide whether to surface nationwide inventory or local test drives first.",
    type: "single",
    options: [
      {
        id: "timeline-urgent",
        label: "Within 2 weeks",
        description:
          "Need ready-to-drive options immediately, ideally available locally with minimal paperwork.",
        value: "two-weeks",
      },
      {
        id: "timeline-month",
        label: "Within 30–45 days",
        description:
          "Open to a broader search radius and flexible financing conversations to find the right fit.",
        value: "month",
      },
      {
        id: "timeline-research",
        label: "Still researching",
        description:
          "Want education, benchmarks, and practice negotiations before committing to a shortlist.",
        value: "researching",
      },
    ],
  },
  {
    id: "extras",
    title: "Unique preferences & feel-good factors",
    prompt: "Do you have any other must-haves that define the right fit?",
    helper:
      "These signals help us source options that align with your family’s values and the driving experience your teen will enjoy.",
    type: "multi",
    minSelections: 1,
    options: [
      {
        id: "extras-american",
        label: "American-made confidence",
        description:
          "Prefer vehicles assembled in the U.S. with domestic supply chains and dealership footprints.",
        value: "american-made",
      },
      {
        id: "extras-import",
        label: "Precision import engineering",
        description:
          "Opt for foreign-built models known for craftsmanship, resale value, and distinctive styling.",
        value: "import",
      },
      {
        id: "extras-suv",
        label: "Higher seating position",
        description:
          "Compact SUVs and crossovers that provide a commanding view of the road and easier entry/exit.",
        value: "higher-seating",
      },
      {
        id: "extras-bright",
        label: "Bright exterior colors",
        description:
          "Eye-catching finishes to increase visibility to other drivers and make the car easy to spot.",
        value: "bright-color",
      },
      {
        id: "extras-eco",
        label: "Eco-conscious pick",
        description:
          "Hybrid, plug-in hybrid, or highly efficient powertrains to keep fuel costs and emissions low.",
        value: "eco-conscious",
      },
      {
        id: "extras-certified",
        label: "Dealer certified only",
        description:
          "Must come with dealer-backed warranties, inspections, and roadside assistance programs.",
        value: "certified-only",
      },
      {
        id: "extras-flexible",
        label: "Open to the best match",
        description:
          "No strong preference—prioritize the overall score across safety, cost, and availability.",
        value: "flexible",
      },
    ],
  },
  {
    id: "notes",
    title: "Anything else your concierge should know?",
    prompt:
      "Share specific models to avoid, non-negotiable features, or any context you want our AI agent to keep in mind.",
    helper:
      "We’ll attach these notes to your profile so recommendations always reflect your family’s voice.",
    type: "text",
    placeholder:
      "Example: Avoid recalled models from 2016–2018. Needs rear-seat airbags. Teen is 6'2\" so headroom matters.",
  },
];

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
  if (!response) return false;

  if (question.type === "single") {
    return Boolean(response.optionId);
  }

  if (question.type === "multi") {
    const min = question.minSelections ?? 1;
    return (response.optionIds?.length ?? 0) >= min;
  }

  if (question.type === "text") {
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

  const hasSummary = summarizedEntries.length > 0;

  const handleSendToAgent = async () => {
    if (!hasSummary || agentStatus === "loading") {
      return;
    }

    try {
      setAgentStatus("loading");
      setAgentError(null);
      setAgentResponse(null);

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

      const data = (await response.json()) as { recommendations?: string };
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

      setAgentStatus("success");
    } catch (error) {
      setAgentStatus("error");
      setAgentError(
        error instanceof Error
          ? error.message
          : "Something went wrong sending your profile to the agent.",
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

            <div className="space-y-4 rounded-3xl border border-sky-400/30 bg-sky-500/10 p-6 text-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Send to Teen Driver agent</h2>
                  <p className="text-sm text-slate-200/80">
                    We’ll hand this payload to your AI concierge and return a tailored
                    shortlist.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSendToAgent}
                  disabled={!hasSummary || agentStatus === "loading"}
                  className="inline-flex items-center justify-center rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
                >
                  {agentStatus === "loading" ? "Contacting agent..." : "Generate shortlist"}
                </button>
              </div>

              {agentStatus === "error" && agentError ? (
                <p className="rounded-2xl border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {agentError}
                </p>
              ) : null}

              {agentStatus === "loading" ? (
                <p className="text-sm text-slate-200/80">
                  Gathering live inventory, insurance data, and negotiation insights…
                </p>
              ) : agentStatus === "success" && recommendations.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid gap-5 lg:grid-cols-2">
                    {recommendations.map((rec, index) => (
                      <div
                        key={`${rec.vehicle}-${index}`}
                        className="flex h-full flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-lg shadow-slate-900/40"
                      >
                        <div className="space-y-3">
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
                          </div>
                        </div>
                        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50">
                          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">
                            Next best step
                          </p>
                          <p className="mt-1 leading-relaxed">{rec.nextStep}</p>
                        </div>
                      </div>
                    ))}
                  </div>
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

