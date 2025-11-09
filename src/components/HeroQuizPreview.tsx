'use client';

import { useCallback, useMemo, useState } from "react";
import { questions, type Question } from "@/lib/quiz/questions";

const quizQuestions = questions;
const DEFAULT_PRIORITY = 3;

type PreviewResponse = {
  optionId?: string;
  optionIds?: string[];
  text?: string;
};

export type HeroStructuredPreference = {
  questionId: string;
  label: string;
  priority: number;
  type: Question["type"];
  selectedValues?: string[];
  selectedLabels?: string[];
  descriptions?: string[];
  notes?: string;
};

export type HeroSummaryEntry = {
  uniqueId: string;
  questionId: string;
  question: string;
  choice: string;
  description: string;
  value: string;
  type: Question["type"];
};

type HeroQuizPreviewProps = {
  onSubmit: (payload: {
    preferences: HeroStructuredPreference[];
    summary: HeroSummaryEntry[];
  }) => void;
  submitting?: boolean;
  status?: "idle" | "loading" | "success" | "error";
  error?: string | null;
};

function isAnswered(question: Question, response?: PreviewResponse) {
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
    return question.required === false || Boolean(response.text?.trim());
  }

  return false;
}

function buildStructuredPreferences(
  responses: Record<string, PreviewResponse>,
): HeroStructuredPreference[] {
  return quizQuestions
    .map((question) => {
      const response = responses[question.id];
      if (!isAnswered(question, response)) {
        return null;
      }

      if (question.type === "single" && response?.optionId) {
        const option = question.options.find((item) => item.id === response.optionId);
        if (!option) return null;

        return {
          questionId: question.id,
          label: question.title,
          priority: DEFAULT_PRIORITY,
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
          priority: DEFAULT_PRIORITY,
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
          priority: DEFAULT_PRIORITY,
          type: question.type,
          notes: response.text.trim(),
        };
      }

      if (question.type === "text" && question.required === false) {
        return {
          questionId: question.id,
          label: question.title,
          priority: DEFAULT_PRIORITY,
          type: question.type,
          notes: response?.text?.trim(),
        };
      }

      return null;
    })
    .filter(Boolean) as HeroStructuredPreference[];
}

function buildSummary(preferences: HeroStructuredPreference[]): HeroSummaryEntry[] {
  return preferences.flatMap((preference) => {
    if (preference.type === "text" && preference.notes) {
      return [
        {
          uniqueId: `${preference.questionId}-notes`,
          questionId: preference.questionId,
          question: preference.label,
          choice: preference.notes,
          description: "Custom notes provided by the family.",
          value: "custom-note",
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
        type: preference.type,
      }));
    }

    return [];
  });
}

export default function HeroQuizPreview({
  onSubmit,
  submitting = false,
  status = "idle",
  error,
}: HeroQuizPreviewProps) {
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, PreviewResponse>>({});

  const question = quizQuestions[step];
  const total = quizQuestions.length;
  const isFinal = step === total - 1;

  const handleSingleSelect = useCallback((questionId: string, optionId: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        optionId,
      },
    }));
  }, []);

  const handleMultiToggle = useCallback((questionId: string, optionId: string) => {
    setResponses((prev) => {
      const prevSelection = prev[questionId]?.optionIds ?? [];
      const exists = prevSelection.includes(optionId);
      return {
        ...prev,
        [questionId]: {
          optionIds: exists
            ? prevSelection.filter((id) => id !== optionId)
            : [...prevSelection, optionId],
        },
      };
    });
  }, []);

  const handleTextChange = useCallback((questionId: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        text: value,
      },
    }));
  }, []);

  const canAdvance = useMemo(() => isAnswered(question, responses[question.id]), [question, responses]);

  const progressPercent = useMemo(
    () => Math.round(((step + 1) / total) * 100),
    [step, total],
  );

  const handleNext = () => {
    setStep((prev) => Math.min(prev + 1, total - 1));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    const preferences = buildStructuredPreferences(responses);
    const summary = buildSummary(preferences);
    onSubmit({ preferences, summary });
  };

  return (
    <div
      id="hero-quiz"
      className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl shadow-slate-950/50 backdrop-blur"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-300">
          <span>{status === "success" ? "Quiz completed" : "Parent quiz"}</span>
          <span>
            {step + 1} / {total}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 via-sky-500 to-emerald-400 transition-all"
            style={{ width: `${Math.max(progressPercent, 8)}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
          {question.title}
        </p>
        <h3 className="text-2xl font-semibold text-white">{question.prompt}</h3>
        {question.helper ? (
          <p className="text-sm text-slate-300">{question.helper}</p>
        ) : null}
      </div>

      <div className="space-y-3">
        {question.type === "text" ? (
          <textarea
            rows={4}
            placeholder={question.placeholder}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
            value={responses[question.id]?.text ?? ""}
            onChange={(event) => handleTextChange(question.id, event.target.value)}
          />
        ) : (
          question.options.map((option) => {
            const response = responses[question.id];
            const isSelected =
              question.type === "multi"
                ? response?.optionIds?.includes(option.id)
                : response?.optionId === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() =>
                  question.type === "multi"
                    ? handleMultiToggle(question.id, option.id)
                    : handleSingleSelect(question.id, option.id)
                }
                className={[
                  "w-full rounded-2xl border p-4 text-left transition-all",
                  "border-white/10 bg-slate-900/50 hover:border-sky-400/60 hover:bg-slate-900/80",
                  isSelected ? "border-sky-400/80 bg-slate-900/80 shadow-lg shadow-sky-500/20" : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{option.label}</p>
                    <p className="mt-1 text-sm text-slate-300">{option.description}</p>
                  </div>
                  <span
                    className={[
                      "mt-1 inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
                      isSelected
                        ? "border border-sky-400/80 bg-sky-400/20 text-sky-100"
                        : "border border-white/10 text-slate-500",
                    ].join(" ")}
                  >
                    {question.type === "multi"
                      ? isSelected
                        ? "Selected"
                        : "Choose"
                      : isSelected
                        ? "Selected"
                        : "Choose"}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 0 || submitting}
          className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-white hover:text-white disabled:cursor-not-allowed disabled:border-white/10 disabled:text-slate-500"
        >
          ← Back
        </button>
        {isFinal ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !canAdvance}
            className="inline-flex items-center justify-center rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
          >
            {submitting ? "Generating..." : "See my teen's matches"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canAdvance || submitting}
            className="inline-flex items-center justify-center rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
          >
            Next question →
          </button>
        )}
      </div>
      {error ? (
        <p className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
          {error}
        </p>
      ) : null}
      <p className="text-center text-xs text-slate-400">
        Your answers feed the concierge instantly; adjust anytime to refine the shortlist.
      </p>
    </div>
  );
}
