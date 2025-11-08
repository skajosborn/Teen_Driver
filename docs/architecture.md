# Teen Driver Architecture Overview

Updated: 2025-11-08

## High-Level Flow

1. **Parent Quiz (`/quiz`)**  
   Collects structured preferences (budget, safety, usage, extras, notes) and stores answers in state.

2. **Summary View**  
   Displays parent priorities, structured payload, and the “Generate shortlist” action.  
   When clicked, sends `{ preferences, metadata }` to `POST /api/recommendations`.

3. **API Route (`/api/recommendations`)**  
   - Validates payload shape.  
   - Converts parent answers into a `PreferenceProfile` + contextual summary.  
   - Fetches & scores candidate vehicles via `getTopVehicles` (Supabase Postgres + Prisma).  
   - Calls `generateRecommendations` with both the parent preferences and candidate list.  
   - Returns JSON `{ recommendations, candidates }`.

4. **Agent Layer (`generateRecommendations`)**  
   - Uses OpenAI Responses API (`gpt-4o-mini` by default).  
   - Prompt includes system instructions, parent summary, and pre-filtered vehicle candidates.  
   - Expects JSON with shortlist entries.  
   - Handles parsing & fallbacks.

5. **Quiz UI Rendering**  
   - Parses agent JSON (with robust extraction).  
   - Displays recommendation cards (vehicle, fit summary, safety, cost, next step).  
   - Shows raw payload in collapsible for debugging.

6. **Vehicle Retrieval (new)**  
   - `src/lib/db.ts` exposes Prisma client connected to Supabase Postgres.  
   - `src/lib/retrieval.ts` scores vehicles in the database against parent preferences (budget, safety, usage, extras).  
   - Future phases will invoke retrieval before contacting OpenAI so the agent writes against curated data.

## Current Components

| Layer | File(s) | Responsibility |
| ----- | ------- | -------------- |
| UI | `src/app/quiz/page.tsx` | Quiz questions, summary, agent call, rendering cards |
| API | `src/app/api/recommendations/route.ts` | Validates payload, invokes agent |
| Agent | `src/lib/agent.ts` | OpenAI call, prompt orchestration, parsing |
| Data | `data/vehicles.json`, `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/db.ts` | Structured vehicle knowledge + Prisma models |
| Retrieval | `src/lib/retrieval.ts` | Score + fetch vehicles (Phase 3 foundation) |
| Styling | Tailwind CSS via app layout | Hero, cards, states |

## Planned Enhancements

- **Vehicle Knowledge Dataset:** curated JSON/DB with safety ratings, budgets, etc.
- **Retrieval Layer:** score and filter vehicles prior to agent call.
- **Prompt Upgrades:** include retrieval output, function calling.
- **Evaluation:** fixture-based testing and logging.
- **Feedback Storage:** persist parent reactions, shortlists.

## Notes

- Environment: `.env.local` must include `OPENAI_API_KEY` (optional `OPENAI_MODEL`).
- Model: currently `gpt-4o-mini`; future phases may switch to larger models or structured output support.
- Error Handling: 429s, parsing fallback; logs for debugging.

Keep this doc updated as new layers (retrieval, evaluation, feedback) go live.

