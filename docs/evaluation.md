# Evaluation Toolkit

Updated: 2025-11-08

This guide explains how to run repeatable evaluations of the Teen Driver concierge pipeline using curated fixtures. The goal is to catch regressions when we tweak scoring weights, prompt wording, or retrieval logic.

---

## Fixtures

Location: `fixtures/quiz/`

Each fixture is a JSON payload that mirrors the data submitted by the quiz:

- `preferences`: array of structured responses (`questionId`, `type`, `selectedValues`, etc.).
- Optional `metadata` (tags, submitter).
- Optional `description` for quick reference.
- Optional `limit` (override default 4 vehicles).
- Optional `runAgent` flag (set to `false` to skip the OpenAI call).

### Example

```jsonc
{
  "description": "Safety-focused sedan under $30k with monitoring tech",
  "preferences": [
    {
      "questionId": "budget",
      "type": "single",
      "priority": 4,
      "selectedValues": ["cpo-balance"]
    }
    // ...
  ],
  "metadata": {
    "fixture": "safety-focused"
  }
}
```

Fixtures included:

- `fixtures/quiz/safety-focused.json`
- `fixtures/quiz/adventure-hybrid.json`
- `fixtures/quiz/value-first.json`

Add more fixtures as new scenarios emerge (e.g., premium EV, rural truck).

---

## Running a Fixture

```bash
npm run eval:fixture fixtures/quiz/safety-focused.json
```

CLI options:
- `--no-agent` — skip the OpenAI call (retrieval scoring only).
- `--limit=N` — override vehicle candidate limit (default 4).

The script will:
1. Load the fixture.
2. Map the preferences to a `PreferenceProfile` + context summary.
3. Fetch scored vehicle candidates via Prisma/Supabase.
4. Optionally call the agent (OpenAI) and print the JSON response.

Make sure your environment variables are set (especially `DATABASE_URL` and `OPENAI_API_KEY`). The script loads `.env`/`.env.local` automatically.

---

## Workflow Tips

- **Regression checks:** run key fixtures after adjusting retrieval weights, prompt text, or candidate selection logic.
- **Prompt experiments:** log results (copy JSON output) alongside the fixture description and prompt change in `docs/prompt-playbook.md`.
- **Scoring tweaks:** update `src/lib/retrieval.ts`, re-run fixtures, and note changes.
- **Agent quotas:** use `--no-agent` while tweaking retrieval; save the full agent call for final verification to conserve API usage.

---

## Future Enhancements

- Snapshot results to disk for diffing (e.g., `fixtures/results/<timestamp>.json`).
- Integrate with automated test runner (CI) once we have stable expectations.
- Add evaluation metrics (e.g., did all recommendations respect the budget?).

