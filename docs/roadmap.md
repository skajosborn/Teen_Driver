# Teen Driver AI Concierge Roadmap

This roadmap tracks the staged plan for evolving the Teen Driver quiz into a fully featured AI concierge. Each phase includes its goals, expected deliverables, and documentation touchpoints so the system remains explainable.

---

## Phase 1 · Foundation & Documentation

**Goals**
- Capture the current architecture and define a consistent documentation structure.
- Align on terminology (preferences, recommendations, retrieval, agent).
- Select storage format for vehicle knowledge.

**Deliverables**
- `docs/architecture.md` with high-level diagram + request flow.
- `docs/data-sources.md` describing vehicle attributes, sources, and update cadence.
- `docs/prompt-playbook.md` to log prompts, parameters, and observed behavior.
- Decision on storage strategy for the vehicle dataset (JSON, SQLite, Postgres, etc.).

---

## Phase 2 · Vehicle Knowledge Dataset

**Goals**
- Create a curated dataset of teen-friendly vehicle candidates covering safety, budget, body style, drivetrain, tech packages, and notable pros/cons.
- Align attribute names with quiz outputs to enable deterministic filtering.

**Deliverables**
- Seed dataset (`data/vehicles.json` to start, with plan to migrate to DB later).
- Data schema documentation (`docs/data-sources.md` update).
- Import/helpers ensuring the Next.js app can access this dataset server-side.

---

## Phase 3 · Retrieval & Scoring Layer

**Goals**
- Implement a helper that accepts quiz preferences and returns top vehicles based on weightings (budget, safety priority, usage, extras).
- Prepare for future vector search by abstracting the scoring logic.

**Deliverables**
- `src/lib/retrieval.ts` (or similar) with functions:
  - `scoreVehicle(preferences, vehicle)`
  - `getTopVehicles(preferences, limit)`
- Unit tests or sample scripts verifying expected matches for canonical quiz profiles.
- Documentation section explaining scoring heuristics and how to tweak weights.

---

## Phase 4 · Agent Prompt Upgrade & Tooling

**Goals**
- Feed summarized parent priorities + retrieval results into OpenAI.
- Introduce function calling (e.g., `getVehicles`) or multi-step chaining when needed.
- Strengthen prompts with explicit guardrails and fallback instructions.

**Deliverables**
- Updated `generateRecommendations` pipeline using retrieval output.
- New prompt snippets documented in `docs/prompt-playbook.md`.
- Optional: separate agents for selection vs. narrative components.

---

## Phase 5 · Evaluation & Feedback Loop

**Goals**
- Create reusable fixtures (canonical quiz entries) to test output quality.
- Track prompt revisions and their effects.
- Capture parent feedback (thumbs up/down) to inform future runs.

**Deliverables**
- `scripts/evaluate.ts` (or similar) that runs fixtures through the pipeline.
- Evaluation logs committed for regression tracking.
- Documentation updates on evaluation methodology and future improvements (vector search, CRM integration, multi-agent workflows).

---

## Documentation Structure

- `docs/architecture.md` — System overview, request flow diagrams.
- `docs/data-sources.md` — Vehicle dataset schema, sourcing, maintenance notes.
- `docs/prompt-playbook.md` — Prompt versions, parameters, observed behavior.
- `docs/evaluation.md` (planned) — How we test, metrics, fixtures.
- `docs/roadmap.md` (this file) — Staged plan with milestone tracking.

Doc updates should accompany major code changes to maintain alignment.

---

## Next Steps

1. Create `docs/architecture.md` with current flow (quiz → recommendations API → OpenAI → cards).
2. Draft `docs/data-sources.md` template.
3. Decide on initial vehicle data source (start with curated JSON to move quickly).
4. Begin Phase 2: build the seed dataset and ensure it loads into the app.


