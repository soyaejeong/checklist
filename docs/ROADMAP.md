# TripChecklist MVP — Implementation Roadmap

**Companion to [TECHSPEC.md](mvp/TECHSPEC.md)** | **Workflow: [PLAN_GENERATION_GUIDE.md](../.claude/skills/generating-plans/references/PLAN_GENERATION_GUIDE.md)**

---

## Execution Model

Two levels of parallelism:

1. **Worktree-level** (cross-slice): Frontend and backend develop simultaneously in separate git worktrees
2. **Section-level** (within-slice, tweep): Each slice uses `/parallel-sweep` with 2 TDD worker agents on independent sections

| Worktree | Branch | Scope | Runtime | Slices |
|----------|--------|-------|---------|--------|
| **Primary** | `main` | `src/`, `supabase/`, project config | Node/TypeScript | 1, 3, 5, 7 |
| **Backend** | `feat/ai-pipeline` | `backend/` | Python | 2, 4, 6 |

```bash
# Create backend worktree (run once, before Wave 1)
git worktree add ../checklist-backend -b feat/ai-pipeline
```

---

## Dependency DAG

```
         WAVE 1              WAVE 2              WAVE 3            WAVE 4
    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐  ┌──────────────┐
    │ S1: FE Fdn   │──▸│ S3: FE Data  │──▸│ S5: FE UI    │─▸│              │
    │ (main)       │   │ (main)       │   │ (main)       │  │ S7: Integr.  │
    └──────────────┘   └──────────────┘   └──────────────┘  │ (main,merged)│
                                                             │              │
    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐  │              │
    │ S2: BE Fdn   │──▸│ S4: BE Svcs  │──▸│ S6: BE API   │─▸│              │
    │ (feat/ai)    │   │ (feat/ai)    │   │ (feat/ai)    │  └──────────────┘
    └──────────────┘   └──────────────┘   └──────────────┘
```

**Frontend chain:** S1 → S3 → S5 → S7
**Backend chain:** S2 → S4 → S6 → S7
**Parallel pairs (no file conflicts):** S1 ‖ S2, S3 ‖ S4, S5 ‖ S6

---

## Timeline

```
Day:     1       2       3       4       5       6       7       8
         |       |       |       |       |       |       |       |

[PRIMARY WORKTREE — main]
S1 ██████████████
                 S3 █████████████████████
                                         S5 ██████████████████████████████████████
                                                                         S7 ██████████████

[BACKEND WORKTREE — feat/ai-pipeline]
S2 ██████████████
                 S4 █████████████████████
                                         S6 ██████████████████
                                                             ▲
                                                         merge into main
```

**Critical path:** S1 (1.5d) → S3 (2d) → S5 (3d) → S7 (1.5d) = **8 days**
**Backend path:** S2 (1.5d) → S4 (2d) → S6 (1.5d) = **5 days**
**Sequential baseline:** ~13 days → **38% faster** with worktree parallelism

---

## Slice Inventory

| # | Slice | Duration | Worktree | Wave | Dependencies | Tasks (est.) |
|---|-------|----------|----------|------|-------------|-------------|
| 1 | FE Foundation | 1.5d | main | 1 | None | ~12 |
| 2 | BE Foundation | 1.5d | feat/ai-pipeline | 1 | None | ~10 |
| 3 | FE Data Layer | 2d | main | 2 | Slice 1 | ~16 |
| 4 | BE AI Services | 2d | feat/ai-pipeline | 2 | Slice 2 | ~14 |
| 5 | FE UI Layer | 3d | main | 3 | Slice 3 | ~22 |
| 6 | BE API Endpoint | 1.5d | feat/ai-pipeline | 3 | Slice 4 | ~8 |
| 7 | Integration + Polish | 1.5d | main (merged) | 4 | Slices 5 + 6 | ~10 |
| | **Total** | **8d critical** | | | | **~92** |

---

## Slice Details

### Slice 1: FE Foundation

**Wave 1 · main · 1.5 days · No dependencies**

Types, interfaces, infrastructure, and project scaffolding. Establishes the pure-dependency foundation that all subsequent frontend slices import from.

**User journey:** Developer runs `npm run dev` and sees blank app shell with design tokens; `npm run test:unit` passes.

**Files owned:**
- `src/types/checklist.ts` — ChecklistItem, DismissedSuggestion, UserCategory
- `src/types/trip.ts` — Trip, UserProfile, Activity
- `src/types/suggestion.ts` — Suggestion (AI response shape)
- `src/repositories/checklist-repository.ts` — ChecklistRepository interface
- `src/repositories/trip-repository.ts` — TripRepository interface
- `src/services/auth-service.ts` — AuthService interface
- `src/services/suggestion-service.ts` — SuggestionService interface
- `src/lib/supabase/client.ts` — Singleton Supabase client
- `src/lib/http/fastapi-client.ts` — Fetch wrapper for backend API
- `src/lib/constants.ts` — Category taxonomy, localStorage keys, API URLs
- `src/data/trips.ts` — Sample trip JSON + user profiles
- `src/utils/item-sorting.ts` — Checked-to-bottom sort, category ordering
- `src/utils/formatting.ts` — Date display, label formatting
- `src/hooks/use-local-storage.ts` — Generic localStorage hook
- `src/hooks/use-viewport-lock.ts` — Body scroll lock
- `src/styles/tokens.css` — UISPEC design tokens as CSS variables
- `src/styles/globals.css` — Reset, base styles
- Project config: `package.json`, `tsconfig.json`, `next.config.js`, `vitest.config.ts`

**Tweep sections (4):**

| Section | Parallel | Key Files |
|---------|----------|-----------|
| Steel Thread | sequential, executor: lead | Project scaffold, `package.json`, config files, `styles/` |
| Types + Constants | independent | `types/`, `lib/constants.ts`, `data/trips.ts` |
| Interfaces + Infrastructure | independent | `repositories/*.ts`, `services/*.ts`, `lib/supabase/`, `lib/http/` |
| Pure Utilities + Hooks | independent | `utils/`, `hooks/use-local-storage.ts`, `hooks/use-viewport-lock.ts` |

---

### Slice 2: BE Foundation

**Wave 1 · feat/ai-pipeline · 1.5 days · No dependencies**

FastAPI scaffold, Pydantic schemas, core infrastructure. Establishes the Python project structure.

**User journey:** Developer runs `uvicorn app.main:app` and hits health endpoint; Pydantic schemas validate; config loads from .env.

**Files owned:**
- `backend/app/__init__.py`
- `backend/app/main.py` — FastAPI instance, CORS, router mount
- `backend/app/schemas/request.py` — SuggestionRequest Pydantic model
- `backend/app/schemas/response.py` — SuggestionResponse, ErrorResponse
- `backend/app/core/config.py` — pydantic-settings env vars
- `backend/app/core/logging.py` — Logging config
- `backend/app/core/exceptions.py` — Custom exceptions + error handlers
- `backend/app/utils/cache.py` — TTL/lru_cache wrappers
- `backend/requirements.txt`
- `backend/Dockerfile`
- `backend/.env.example`
- `backend/tests/conftest.py` — Pytest config + fixtures

**Tweep sections (3):**

| Section | Parallel | Key Files |
|---------|----------|-----------|
| Steel Thread | sequential, executor: lead | `main.py`, `requirements.txt`, `Dockerfile`, `.env.example` |
| Schemas + Config | independent | `schemas/`, `core/config.py` |
| Core Infrastructure | independent | `core/logging.py`, `core/exceptions.py`, `utils/cache.py` |

---

### Slice 3: FE Data Layer

**Wave 2 · main · 2 days · Depends on Slice 1**

Concrete implementations, providers (DI wiring), and all data hooks. After this slice, the full data pipeline works end-to-end (auth → repository → hooks → state).

**User journey:** Anonymous auth works silently; checklist CRUD operations work through hooks; trip data loads from hardcoded repository.

**Files owned:**
- `src/repositories/implementations/supabase-checklist-repository.ts`
- `src/repositories/implementations/hardcoded-trip-repository.ts`
- `src/services/implementations/supabase-auth-service.ts`
- `src/services/implementations/fastapi-suggestion-service.ts` (stub — wired in Slice 7)
- `src/providers/auth-provider.tsx`
- `src/providers/repository-provider.tsx`
- `src/providers/suggestion-provider.tsx`
- `src/app/providers.tsx` — AppProviders composition
- `src/hooks/use-auth.ts`
- `src/hooks/use-checklist.ts`
- `src/hooks/use-trip.ts`
- `src/hooks/use-suggestions.ts`
- `src/hooks/use-checklist-state.ts`
- `src/hooks/use-suggestion-banner.ts`
- `supabase/migrations/001_checklist_schema.sql` — Schema + RLS + triggers

**Tweep sections (4):**

| Section | Parallel | Key Files |
|---------|----------|-----------|
| Steel Thread | sequential, executor: lead | Supabase migration, `app/providers.tsx`, basic wiring proof |
| Auth Layer | independent | `supabase-auth-service.ts`, `auth-provider.tsx`, `use-auth.ts` |
| Checklist Repository + Hooks | independent | `supabase-checklist-repository.ts`, `repository-provider.tsx`, `use-checklist.ts`, `use-checklist-state.ts` |
| Trip + Suggestion Stubs | independent | `hardcoded-trip-repository.ts`, `fastapi-suggestion-service.ts`, `suggestion-provider.tsx`, `use-trip.ts`, `use-suggestions.ts`, `use-suggestion-banner.ts` |

---

### Slice 4: BE AI Services

**Wave 2 · feat/ai-pipeline · 2 days · Depends on Slice 2**

External API clients and the AI pipeline orchestrator. After this slice, the full suggestion pipeline works in isolation with mocks.

**User journey:** Pipeline accepts trip data, fetches climate normals, calls Claude, parses output, and deduplicates suggestions.

**Files owned:**
- `backend/app/clients/anthropic_client.py` — Claude API wrapper
- `backend/app/clients/openweather_client.py` — OpenWeatherMap HTTP client
- `backend/app/clients/meteostat_client.py` — Meteostat wrapper + LRU cache
- `backend/app/services/prompts.py` — System prompt, few-shot examples
- `backend/app/services/dedup.py` — Item normalization + dedup
- `backend/app/services/pipeline.py` — Orchestrator: climate → weather → LLM → parser → dedup
- `backend/tests/test_dedup.py`

**Tweep sections (4):**

| Section | Parallel | Key Files |
|---------|----------|-----------|
| Steel Thread | sequential, executor: lead | `pipeline.py` skeleton, orchestration proof |
| Weather Clients | independent | `openweather_client.py`, `meteostat_client.py` |
| LLM Client + Prompts | independent | `anthropic_client.py`, `prompts.py` |
| Dedup + Pipeline Assembly | depends_on=[Weather Clients, LLM Client + Prompts] | `dedup.py`, `pipeline.py` (full), `test_dedup.py` |

---

### Slice 5: FE UI Layer

**Wave 3 · main · 3 days · Depends on Slice 3**

All React components and pages. The densest slice — benefits most from tweep parallelism.

**User journey:** Complete end-to-end checklist UX — user selects trip, views items in Category/Day views, checks/unchecks, adds items, edits via bottom sheet, sees AI suggestion banner (stub data).

**Files owned:**
- `src/components/ui/Button.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/BottomSheet.tsx`
- `src/components/ui/Collapsible.tsx`
- `src/components/checklist/ChecklistHeader.tsx`
- `src/components/checklist/CategoryGroup.tsx`
- `src/components/checklist/DayView.tsx`
- `src/components/checklist/ItemRow.tsx`
- `src/components/checklist/AddItemSheet.tsx`
- `src/components/checklist/QuantityStepper.tsx`
- `src/components/checklist/ProgressBar.tsx`
- `src/components/suggestions/SuggestionBanner.tsx`
- `src/components/suggestions/SuggestionCard.tsx`
- `src/components/suggestions/SuggestionList.tsx`
- `src/components/common/ErrorBoundary.tsx`
- `src/components/common/PriorityBadge.tsx`
- `src/components/common/BookingChip.tsx`
- `src/app/layout.tsx`
- `src/app/page.tsx` — Trip List page
- `src/app/trip/[tripId]/page.tsx` — Checklist page
- `src/app/trip/[tripId]/loading.tsx` — Skeleton fallback

**Tweep sections (5):**

| Section | Parallel | Key Files |
|---------|----------|-----------|
| Steel Thread | sequential, executor: lead | `layout.tsx`, `page.tsx` skeleton, `ErrorBoundary.tsx` |
| UI Primitives | independent | `components/ui/` (Button, Card, BottomSheet, Collapsible) |
| Checklist Read Components | independent | `ChecklistHeader`, `CategoryGroup`, `DayView`, `ItemRow`, `ProgressBar`, `PriorityBadge`, `BookingChip` |
| Checklist Write Components | depends_on=[UI Primitives] | `AddItemSheet`, `QuantityStepper` |
| Pages + Suggestions | depends_on=[Checklist Read, Checklist Write] | `page.tsx` (full), `trip/[tripId]/`, `SuggestionBanner`, `SuggestionCard`, `SuggestionList` |

---

### Slice 6: BE API Endpoint

**Wave 3 · feat/ai-pipeline · 1.5 days · Depends on Slice 4**

The `POST /api/suggestions` endpoint wiring the pipeline to HTTP.

**User journey:** `POST /api/suggestions` accepts request body, runs full pipeline, returns validated suggestions JSON.

**Files owned:**
- `backend/app/api/suggestions.py`
- `backend/tests/test_suggestions.py`

**Tweep sections (3):**

| Section | Parallel | Key Files |
|---------|----------|-----------|
| Steel Thread | sequential, executor: lead | `suggestions.py` skeleton, happy path proof |
| Endpoint Logic | independent | `suggestions.py` (validation, error handling) |
| Integration Tests | depends_on=[Endpoint Logic] | `test_suggestions.py` (mocked external calls) |

---

### Slice 7: Integration + Polish

**Wave 4 · main (merged) · 1.5 days · Depends on Slices 5 + 6**

Wire the frontend to the real backend. End-to-end validation.

**Pre-requisite:** Merge backend branch into main:
```bash
git checkout main
git merge feat/ai-pipeline --no-ff -m "[B] Merge AI pipeline backend"
git worktree remove ../checklist-backend
```

**User journey:** User taps "Get AI Suggestions", real Claude-powered suggestions appear, user accepts/dismisses them, they persist in Supabase.

**Files owned:**
- `src/services/implementations/fastapi-suggestion-service.ts` (wire real HTTP calls — was stubbed in Slice 3)
- E2E test files
- Any polish/bugfix files discovered during integration

**Tweep sections (3):**

| Section | Parallel | Key Files |
|---------|----------|-----------|
| Steel Thread | sequential, executor: lead | Merge branch, verify builds, wire `fastapi-suggestion-service.ts` |
| Suggestion Flow | independent | E2E: suggestion request → accept → dismiss cycle |
| Edge Cases + Polish | depends_on=[Suggestion Flow] | Error states, rate limiting, loading UX, UISPEC compliance |

---

## Merge Strategy

| When | Action | Conflicts? |
|------|--------|-----------|
| Before Wave 1 | `git worktree add ../checklist-backend -b feat/ai-pipeline` | N/A |
| Before Slice 7 | `git merge feat/ai-pipeline --no-ff` | None — `backend/` vs `src/` |
| After Slice 7 | `git worktree remove ../checklist-backend` | N/A |

The merge is guaranteed conflict-free because the two worktrees operate on completely separate directory trees (`src/` vs `backend/`), different languages (TypeScript vs Python), and different dependency managers (`package.json` vs `requirements.txt`).

---

## File Ownership Matrix

Every file from the TECHSPEC Code Architecture section assigned to exactly one slice. No overlaps between any parallel work.

### Frontend (`src/`)

| Directory | Slice | Wave |
|-----------|-------|------|
| `types/` | 1 | 1 |
| `utils/` | 1 | 1 |
| `styles/` | 1 | 1 |
| `lib/` | 1 | 1 |
| `data/` | 1 | 1 |
| `repositories/*.ts` (interfaces) | 1 | 1 |
| `services/*.ts` (interfaces) | 1 | 1 |
| `hooks/use-local-storage.ts` | 1 | 1 |
| `hooks/use-viewport-lock.ts` | 1 | 1 |
| `repositories/implementations/` | 3 | 2 |
| `services/implementations/` | 3 (stub), 7 (wire) | 2, 4 |
| `providers/` | 3 | 2 |
| `hooks/use-auth.ts` | 3 | 2 |
| `hooks/use-checklist.ts` | 3 | 2 |
| `hooks/use-trip.ts` | 3 | 2 |
| `hooks/use-suggestions.ts` | 3 | 2 |
| `hooks/use-checklist-state.ts` | 3 | 2 |
| `hooks/use-suggestion-banner.ts` | 3 | 2 |
| `app/providers.tsx` | 3 | 2 |
| `components/` (all subdirectories) | 5 | 3 |
| `app/layout.tsx` | 5 | 3 |
| `app/page.tsx` | 5 | 3 |
| `app/trip/[tripId]/` | 5 | 3 |

### Backend (`backend/`)

| Directory | Slice | Wave |
|-----------|-------|------|
| `app/main.py` | 2 | 1 |
| `app/schemas/` | 2 | 1 |
| `app/core/` | 2 | 1 |
| `app/utils/` | 2 | 1 |
| `app/clients/` | 4 | 2 |
| `app/services/` | 4 | 2 |
| `app/api/` | 6 | 3 |
| `tests/` | 4 (dedup), 6 (suggestions) | 2, 3 |

### Shared (read-only for both worktrees)

| File | Purpose |
|------|---------|
| `docs/mvp/TECHSPEC.md` | API contract, interfaces, module rules |
| `docs/mvp/UISPEC.md` | Design tokens, component specs |
| `docs/mvp/PRD.md` | Requirements |
| `prototype.html` | Interactive prototype reference |

---

## Per-Wave Execution

Each wave runs two Claude Code sessions in parallel — one per worktree:

| Wave | Main Worktree | Backend Worktree |
|------|---------------|-----------------|
| 1 | Slice 1: `/generating-plans` → `tweep` | Slice 2: `/generating-plans` → `tweep` |
| 2 | Slice 3: `/generating-plans` → `tweep` | Slice 4: `/generating-plans` → `tweep` |
| 3 | Slice 5: `/generating-plans` → `tweep` | Slice 6: `/generating-plans` → `tweep` |
| 4 | Slice 7: merge → `/generating-plans` → `tweep` | (done, worktree removed) |

Between waves, use `/advancing-slices` to archive the completed slice before generating the next.

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Backend merge conflict | `backend/` and `src/` share zero files — merge is trivially clean |
| API contract drift | TECHSPEC.md is source of truth; both sides implement independently against spec; Slice 7 validates with contract tests |
| Slice 5 (UI) exceeds 3 days | Densest slice with 5 tweep sections — if it slips, Wave 4 shifts proportionally |
| Backend finishes before frontend | Expected — backend path is 5d vs 8d critical path. Branch sits ready until merge |
| Supabase schema changes in later slices | All schema created in Slice 3; Slices 5-7 are pure UI/service — no schema changes |

---

**Last Updated:** 2026-02-22
