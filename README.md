# Teen Driver Concierge

Teen Driver is a Next.js application that guides parents from preference intake to AI‑assisted vehicle recommendations. The experience begins on the landing page: a compact quiz captures the family’s priorities and immediately returns a shortlist of cars drawn from a structured Postgres dataset. A dedicated quiz page offers the same flow in long form.

---

## Current Capabilities

### Guided intake
- Landing page hero quiz (`HeroQuizPreview`) collects budget, safety, usage, extras, and notes in a carousel.
- Results render inline: structured summary cards, AI recommendations, and a comparison table.
- The `/quiz` route provides the full multi-step version of the survey with the same scoring logic.

### Recommendation pipeline
1. **Preference mapping** – `src/lib/preferences.ts` converts quiz answers into a normalized `PreferenceProfile` and a set of human-readable context snippets.
2. **Candidate retrieval** – `src/lib/retrieval.ts` uses Prisma to pull vehicles from Supabase Postgres, score them across budget/safety/usage/extras, and return the top matches (with hard budget cut-offs).
3. **AI concierge call** – `src/lib/agent.ts` wraps the OpenAI Responses API (defaults to `gpt-4o-mini`), constraining output to a JSON schema. The agent receives:
   - Structured preferences and parent context
   - The scored candidate list, including image URLs, safety data, MSRP range, and highlights
4. **Result rendering** – The UI parses the agent JSON and displays recommendation cards, “next best steps,” and the full payload (optional details accordion).

### Data sources
- **Supabase Postgres** persists the curated vehicle dataset (`prisma/schema.prisma`).
- **Prisma** handles all ORM interactions (singleton client in `src/lib/prisma.ts`).
- **Enrichment scripts** (TypeScript in `scripts/`):
  - `import-carquery.ts` – fetches specs/MSRP from CarQuery.
  - `import-pexels.ts` – attaches hero imagery from Pexels (with attribution).
  - `import-nhtsa.ts` – ingests crash-test scores from NHTSA.
  - `run-fixture.ts` – runs canned quiz payloads through retrieval + agent for regression testing.

### Landing-page results
By default the landing hero submits the quiz payload to `/api/recommendations` and renders the shortlist inline. The API response includes the top vehicles and the raw agent JSON for inspection.

---

## Tech Stack

| Layer              | Details                                                                 |
|--------------------|-------------------------------------------------------------------------|
| Frontend           | Next.js (App Router), TypeScript, Tailwind CSS                          |
| Persistence        | Supabase Postgres + Prisma                                              |
| AI                  | OpenAI Responses API (`gpt-4o-mini` by default)                         |
| Styling            | Tailwind CSS (`src/app/globals.css`)                                    |
| Deployment         | Vercel                                                                  |
| Utilities          | Supabase session pooler via pgBouncer, Pexels API, CarQuery API         |

---

## Local Development

### Prerequisites
- Node.js 18.18+ or 20.x
- npm 9+

### Setup
```bash
git clone <repo>
cd Teen_Driver
npm install
```

Create `.env.local` (not committed) with the required variables:

```bash
# Supabase
DATABASE_URL=postgresql://postgres.<project-ref>:<ENCODED_PASSWORD>@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&schema=public&sslmode=require
DIRECT_URL=postgresql://postgres.<project-ref>:<ENCODED_PASSWORD>@aws-1-us-east-1.pooler.supabase.com:5432/postgres

# OpenAI
OPENAI_API_KEY=sk-...
# optional – defaults to gpt-4o-mini
OPENAI_MODEL=gpt-4o-mini

# Third-party enrichment
PEXELS_API_KEY=...
```

> **Note:** Percent-encode special characters in the database password (`!` → `%21`, `@` → `%40`). The Supabase session pooler URL must include the project-suffixed user (`postgres.<project-ref>`).

Generate Prisma client (run after installing or changing env vars):
```bash
npx prisma generate
```

### Common commands
- `npm run dev` – Start the Next.js dev server (http://localhost:3000).
- `npm run lint` – ESLint using the Next.js config.
- `npm run build` – Production build to validate TypeScript + Prisma connectivity.
- `npm run start` – Serve the production build locally.

### Seeding & enrichment
- `npx prisma db push` – (optional) sync schema if you create a fresh database.
- `npm run import:carquery -- --make=Honda --model=Civic --year=2023` – Enrich specs for a specific vehicle.
- `npm run import:pexels -- --limit=20 --refresh` – Refresh hero imagery.
- `npm run import:nhtsa` – Import crash-test data.
- `npm run eval:fixture fixtures/quiz/value-first.json` – Exercise the retrieval → agent pipeline with canned input.

---

## Request Flow

```
HeroQuizPreview (landing) / Quiz Page
        │
        │ submit preferences
        ▼
/api/recommendations (Next.js route)
  ├─ mapPreferencesToProfile → PreferenceProfile + context
  ├─ getTopVehicles (Prisma) → scored candidate list
  ├─ generateRecommendations (OpenAI) → JSON shortlist
  └─ return { recommendations, candidates }

UI parses JSON
  ├─ Summary cards
  ├─ AI recommendation cards
  ├─ Comparison table
  └─ Raw payload (accordion)
```

---

## Deployment Notes (Vercel)
- Provision Supabase connection pooling (Session mode) and set `DATABASE_URL` without quotes.
- Regenerate Prisma client locally after any schema change.
- Use `vercel env add` / `vercel env pull` to keep local and deployed env vars in sync.
- `vercel --prod` to deploy once env vars are updated (Vercel caches variables per deployment).

---

## Roadmap: Moving Toward RAG

The app already grounds the model with structured data. To evolve into a retrieval-augmented generation (RAG) system:

1. **Expand structured facts** – Continue enriching Postgres with trims, recalls, insurance tiers, owner anecdotes, etc.
2. **Add vector search** – Store long-form content (reviews, maintenance history, deal availability) in a vector database (Supabase `pgvector`, Pinecone, etc.).
3. **Embed + retrieve** – For each quiz submission, embed the parent profile or candidate names, retrieve the top-k passages, and include them in the prompt alongside the structured list.
4. **RAG-aware prompting** – Update `src/lib/agent.ts` prompt to cite retrieved passages explicitly and to refuse facts not present in the retrieved context.
5. **Evaluate continuously** – Extend `scripts/run-fixture.ts` with acceptance checks (e.g., “never recommend cars above budget,” “surface any recall warnings”) to catch regressions as you iterate.

This staged approach keeps the concierge grounded today while giving you a clear path toward richer, context-aware recommendations tomorrow.

---

Happy driving!
