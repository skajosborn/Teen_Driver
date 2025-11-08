# Prompt Playbook

Updated: 2025-11-08

This playbook tracks the prompts, parameters, and observed behavior for the Teen Driver concierge agent. Use it to record experiments, regression findings, and best practices as the system evolves.

## Current Production Prompt (Phase 1)

**Location:** `src/lib/agent.ts`  
**Model:** `gpt-4o-mini` (temperature default)  
**Input Template (abridged):**

- **System Prompt:**  
  Emphasises that the model is an automotive concierge, must produce 3–4 vehicles, and now receives a pre-filtered candidate list that it should treat as the primary consideration set.

- **User Prompt (JSON payload):**  
  ```json
  {
    "preferences": [...],
    "context": {
      "budgetSummary": "...",
      "safetySummary": "...",
      "usageSummary": "...",
      "extrasSummary": "...",
      "techPreference": "...",
      "timelineExpectation": "...",
      "notes": ["..."]
    },
    "candidates": [
      {
        "id": "honda-civic-2023",
        "name": "2022-2023 Honda Civic EX",
        "score": 17.5,
        "scoreBreakdown": { "budget": 8, "safety": 6, "usage": 3, "extras": 0 },
        "msrpRange": { "min": 25500, "max": 29500 },
        "bodyStyle": "SEDAN",
        "drivetrain": "FWD",
        "tags": { "fit": ["DAILY_COMMUTE"], "extras": ["ECO_CONSCIOUS"] },
        "safety": {
          "iihsTopSafetyPick": true,
          "nhtsaOverall": 5,
          "notableFeatures": ["Honda Sensing suite", "..."]
        },
        "highlights": {
          "tech": ["Wireless CarPlay", "..."],
          "teenFriendly": ["Predictable handling", "..."],
          "maintenance": ["Recommend 24k extended coverage"]
        },
        "sources": [{ "type": "IIHS", "url": "..." }]
      }
      // up to 4 candidates
    ],
    "metadata": { "submittedAt": "..." }
  }
  ```

- **Instruction:** return JSON of the shape:
  ```json
  {
    "recommendations": [
      {
        "vehicle": "...",
        "fitSummary": "...",
        "safetyHighpoints": "...",
        "costInsights": "...",
        "nextStep": "..."
      }
    ]
  }
  ```
  Respond with JSON only (no markdown).

**Observations:**
- Candidate vehicles are now supplied, leading to more grounded outputs. The agent occasionally still freeforms text outside JSON; the parsing fallback handles this.
- Temperature=1 (default) keeps the tone collaborative but can introduce creative phrasing. Revisit after evaluation.
- Context fields (budget/safety summaries, timeline, notes) help personalise recommendations and reduce repeated prompt tuning.

**Known Issues:**
- 429 errors if OpenAI quota exhausted.
- Non-strict JSON when model adds commentary; mitigated by regex extraction.

## Future Prompt Goals

- Include retrieval output (top candidate vehicles) with explicit format.
- Provide summary of parent priorities in prose + the raw JSON.
- Add instructions for handling missing data (“If unsure, flag this as ‘Needs manual verification’”).
- Integrate function calling for `getVehicles` once retrieval layer is ready.

## Experiment Log Template

| Date | Change | Fixture | Outcome | Notes |
| ---- | ------ | ------- | ------- | ----- |
| 2025-11-08 | Baseline prompt | `fixtures/safety-focused.json` | ✅ Good | N/A |

Add entries as you experiment with prompts, parameters, or model versions.

