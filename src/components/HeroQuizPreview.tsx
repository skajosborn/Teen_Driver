'use client';

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { questions, type Question } from "@/lib/quiz/questions";

type PreviewResponse = {
  optionId?: string;
  optionIds?: string[];
  text?: string;
};

const previewQuestions = questions;

function isAnswered(question: Question, response?: PreviewResponse) {
  if (!response) {
    return question.type === "text" ? true : false;
  }

  if (question.type === "single") {
    return Boolean(response.optionId);
  }

  if (question.type === "multi") {
    const min = question.minSelections ?? 1;
    return (response.optionIds?.length ?? 0) >= min;
  }

  if (question.type === "text") {
    return true;
  }

  return false;
}

export default function HeroQuizPreview() {
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, PreviewResponse>>({});

  const question = previewQuestions[step];
  const total = previewQuestions.length;
  const isFinal = step === total - 1;

  const handleSingleSelect = useCallback(
    (questionId: string, optionId: string) => {
      setResponses((prev) => ({
        ...prev,
        [questionId]: { optionId },
      }));
    },
    [],
  );

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
      [questionId]: { ...prev[questionId], text: value },
    }));
  }, []);

  const canAdvance = useMemo(() => {
    return isAnswered(question, responses[question.id]);
  }, [question, responses]);

  const progressPercent = useMemo(() => Math.round(((step + 1) / total) * 100), [step, total]);

  return (
    <div className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl shadow-slate-950/50 backdrop-blur">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-300">
          <span>Preview the parent quiz</span>
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
            className="w-full cursor-pointer rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
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
                  "w-full cursor-pointer rounded-2xl border p-4 text-left transition-all",
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
          onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
          disabled={step === 0}
          className="inline-flex cursor-pointer items-center justify-center rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-white hover:text-white disabled:cursor-not-allowed disabled:border-white/10 disabled:text-slate-500"
        >
          ← Back
        </button>
        {isFinal ? (
          <Link
            href="/quiz"
            className="inline-flex cursor-pointer items-center justify-center rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 transition hover:bg-sky-400"
          >
            Launch the full quiz
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setStep((prev) => Math.min(prev + 1, total - 1))}
            disabled={!canAdvance}
            className="inline-flex cursor-pointer items-center justify-center rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
          >
            Next question →
          </button>
        )}
      </div>
      <p className="text-center text-xs text-slate-400">
        Your answers are a preview. Start the full quiz to save them and hand off to the concierge.
      </p>
    </div>
  );
}
