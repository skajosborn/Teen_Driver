'use server';

import OpenAI from "openai";

export type AgentPreference = {
  questionId: string;
  label: string;
  priority: number;
  type: "single" | "multi" | "text";
  selectedValues?: string[];
  notes?: string;
};

export type AgentContext = {
  budgetSummary?: string;
  safetySummary?: string;
  usageSummary?: string;
  extrasSummary?: string;
  techPreference?: string;
  timelineExpectation?: string;
  notes?: string[];
};

export type AgentVehicleCandidate = {
  id: string;
  name: string;
  score: number;
  scoreBreakdown: Record<string, number>;
  msrpRange: { min: number; max: number };
  bodyStyle: string;
  drivetrain: string;
  tags: {
    fit: string[];
    extras: string[];
  };
  safety: {
    iihsTopSafetyPick: boolean;
    nhtsaOverall?: number | null;
    notableFeatures: string[];
  };
  highlights: {
    tech: string[];
    teenFriendly: string[];
    maintenance: string[];
  };
  sources: { type: string; url: string }[];
};

export type AgentRequestPayload = {
  preferences: AgentPreference[];
  context?: AgentContext;
  candidates?: AgentVehicleCandidate[];
  metadata?: {
    submittedAt?: string;
    sessionId?: string;
  };
};

export type AgentResponse = {
  recommendations: string;
};

const ensureClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to your environment before calling the agent.",
    );
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

const defaultModel = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export async function generateRecommendations(
  payload: AgentRequestPayload,
): Promise<AgentResponse> {
  const client = ensureClient();

  const snapshot = {
    preferences: payload.preferences,
    context: payload.context,
    candidates: payload.candidates?.map((candidate) => ({
      ...candidate,
      // keep only a couple of sources to limit prompt size
      sources: candidate.sources.slice(0, 3),
    })),
    metadata: payload.metadata,
  };

  const response = await client.responses.create({
    model: defaultModel,
    max_output_tokens: 900,
    input: [
      {
        role: "system",
        content:
          "You are Teen Driver, a parent-first automotive concierge. You will receive the parent's structured preferences plus a short list of pre-filtered vehicle candidates. Use those candidates as your primary consideration set (you may introduce others only if strongly justified). Produce a concise shortlist of 3-4 vehicles. For each recommendation, include: vehicle name, why it fits the parent priorities, safety highlights, cost context, and next action a parent should take. Keep tone confident and collaborative.",
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Parent profile and vehicle candidates (JSON):\n${JSON.stringify(snapshot, null, 2)}\n\nReturn a JSON object with the shape:\n{\n  "recommendations": [\n    {\n      "vehicle": string,\n      "fitSummary": string,\n      "safetyHighpoints": string,\n      "costInsights": string,\n      "nextStep": string\n    }\n  ]\n}\n\nRespond with JSON only. No markdown, commentary, or extra text.`,
          },
        ],
      },
    ],
  });

  const segments: string[] = [];

  if (Array.isArray(response.output)) {
    for (const item of response.output) {
      if (item.type === "message") {
        for (const content of item.content ?? []) {
          if (content.type === "output_text") {
            segments.push(content.text);
          } else if (content.type === "output_json_schema") {
            try {
              segments.push(JSON.stringify(content.output, null, 2));
            } catch (error) {
              // ignore parsing issues, fallback below
            }
          }
        }
      } else if (item.type === "output_text") {
        segments.push(item.text);
      }
    }
  }

  if (response.output_text) {
    segments.push(response.output_text);
  }

  const parsed = segments.filter(Boolean).join("\n");

  if (!parsed) {
    return {
      recommendations:
        "We were unable to generate recommendations at this time. Please try again in a moment.",
    };
  }

  try {
    const json = JSON.parse(parsed);
    return {
      recommendations: JSON.stringify(json, null, 2),
    };
  } catch (error) {
    return {
      recommendations: parsed,
    };
  }
}

