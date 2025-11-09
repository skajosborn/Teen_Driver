# Vehicle Data Sources & Schema

Updated: 2025-11-08

## Goal

Provide consistent, trustworthy vehicle information that can be referenced by the Teen Driver concierge. This doc outlines the planned schema, sourcing strategy, and maintenance approach.

## Planned Schema (initial JSON)

```jsonc
{
  "id": "honda-civic-2022",
  "make": "Honda",
  "model": "Civic",
  "year": 2022,
  "bodyStyle": "sedan",
  "drivetrain": "FWD",
  "msrpRange": [21500, 29000],
  "insuranceTier": "moderate",
  "fuelEconomy": {
    "city": 31,
    "highway": 38
  },
  "safety": {
    "iihsTopSafetyPick": true,
    "nhtsaOverall": 5,
    "notableFeatures": [
      "Honda Sensing suite (AEB, lane-keep, adaptive cruise)",
      "Teen driver monitoring via HondaLink"
    ]
  },
  "techHighlights": [
    "Apple CarPlay / Android Auto",
    "Blind-spot monitoring (EX+)",
    "Rear cross-traffic alert"
  ],
  "teenFriendlyFactors": [
    "Predictable handling",
    "Strong resale value",
    "Low running costs"
  ],
  "maintenanceNotes": [
    "Recommend 2-year/24k extended coverage for peace of mind"
  ],
  "fitTags": [
    "daily-commute",
    "shared-family"
  ],
  "extrasTags": [
    "eco-conscious"
  ],
  "sources": [
    {
      "type": "IIHS",
      "url": "https://www.iihs.org/ratings/vehicle/honda/civic-4-door-sedan/2022"
    },
    {
      "type": "Manufacturer",
      "url": "https://automobiles.honda.com/civic-sedan"
    }
  ],
  "lastReviewed": "2024-11-01"
}
```

### Field Notes
- **`fitTags`** map to quiz usage answers (e.g., `daily-commute`, `shared-family`, `weekend-adventure`).
- **`extrasTags`** align with quiz extras (e.g., `american-made`, `higher-seating`, `bright-color`, `eco-conscious`).
- **`insuranceTier`** rough bucket (`low`, `moderate`, `high`) to flag cost implications.
- **`teenFriendlyFactors`** describe why parents may feel confident.
- **`maintenanceNotes`** highlight ownership considerations.
- **`sources`** track where data came from; maintain credibility.

## Sourcing Strategy

1. **Kick-off dataset:** Curate 10–15 representative vehicles manually (mixture of sedans, hatchbacks, small SUVs, hybrids) with public data.
2. **Expansion:** Add more entries as needs evolve (sporty options, rural-friendly, premium).
3. **Validation:** Periodically verify safety ratings and pricing (preferably annually or when model years change).
4. **Automation (future):** Move to scraping + human review, or integrate a third-party API (Edmunds, NHTSA) as the project grows.

## Storage Plan

| Stage | Storage | Notes |
| ----- | ------- | ----- |
| Phase 2 | `data/vehicles.json` | Fast iteration, easy to ship with repo. |
| Phase 3+ | Postgres (Supabase) via Prisma | Enables scoring queries, updates, and integration with feedback. Seeded from the JSON file. |
| Future | Vector store (pgvector, Pinecone) | Supports semantic retrieval and multi-attribute search. |

### Current Implementation (2025-11-09)
- **Database:** Supabase (managed Postgres)  
- **ORM:** Prisma (`prisma/schema.prisma`)  
- **Seed:** `npx prisma db seed` reads `data/vehicles.json` and populates `Vehicle` / `VehicleSource` tables.  
- **NHTSA enrichment:** `npm run import:nhtsa` updates crash-test scores and recall counts.  
- **CarQuery enrichment:** `npm run import:carquery [--make=Honda --year=2023 --limit=20 --missing-only]` writes MSRP, drivetrain, fuel data, doors/seats, and trim IDs.  
- **Pexels imagery:** `npm run import:pexels [--limit=20 --refresh --make=Toyota]` fills `imageUrl` + attribution (requires `PEXELS_API_KEY`).  
- **Client:** `src/lib/prisma.ts` provides a singleton Prisma client for server-side usage.  
- **Retrieval helpers:** `src/lib/retrieval.ts` scores and fetches vehicles for the concierge pipeline.  
- **Preference mapping:** `src/lib/preferences.ts` converts quiz answers into scoring profiles and agent context.

## Maintenance
- Document each addition/change in this file (date, reason).
- Track outstanding questions (e.g., need more AWD coverage?).
- Consider a simple script to validate schema (JSON schema or TypeScript types).

## Outstanding Decisions
- [ ] Finalize attribute list (do we need more price bands? interior tech?).
- [ ] Choose canonical naming for `fitTags` and `extrasTags`.
- [ ] Decide on target number of vehicles for MVP shortlist (e.g., 25 core entries).
- [ ] Integrate fuel economy & imagery sources (FuelEconomy.gov, Car imagery APIs).
- [ ] Add dealer availability lookups (e.g., Marketcheck API) and cache listings per region.
- [ ] Schedule nightly ingestion jobs (Supabase edge functions / GitHub Actions) once importers are stable.
- [ ] Expand Pexels script to prefer manufacturer imagery when licensing allows.

Update this doc whenever the dataset schema or sourcing process changes.

