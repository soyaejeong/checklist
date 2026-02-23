---
completed: 2026-02-23
tasks_total: 16
tasks_completed: 16
tests_passing: 150
status: Completed
---

# Slice 01: FE Foundation

**Version:** 1.0
**Created:** 2026-02-22
**Target Completion:** 2026-02-24
**Status:** Complete

---

## Scope

**User Journey:** Developer runs `npm run dev` and sees blank app shell with design tokens applied; `npm run test:unit` passes with all foundation tests green.

**Layers Involved:**
- Database: None (foundation slice — no schema)
- Backend/API: None (frontend-only)
- Hooks/Logic: `use-local-storage`, `use-viewport-lock`
- UI/Components: Design tokens, global styles (no React components)
- Types: All domain types, repository interfaces, service interfaces
- Infrastructure: Supabase client, FastAPI HTTP client, constants

**Duration Estimate:** 1.5 days

**Dependencies:** None (first slice)

**TECHSPEC Coverage:**
- Code Architecture → Frontend file tree (all `types/`, `repositories/*.ts`, `services/*.ts`, `lib/`, `data/`, `utils/`, `hooks/use-local-storage.ts`, `hooks/use-viewport-lock.ts`, `styles/`)
- Data Models → TypeScript Data Shapes (ChecklistItem, DismissedSuggestion, UserCategory)
- Data Layer → Repository Interface, Service Interfaces
- Data Layer → Frontend Rendering Rules (item-sorting, category ordering)

---

## Exit Criteria

- [x] All tests in this plan passing (150/150)
- [x] `npm run dev` starts Next.js dev server without errors
- [x] `npm run test:unit` passes with zero failures
- [x] No TypeScript errors (`tsc --noEmit` clean); no lint script configured yet
- [x] All design tokens from UISPEC present as CSS custom properties (42 tokens verified)
- [x] All TECHSPEC interfaces exported with correct method signatures
- [x] Code committed (structural and behavioral changes separated)
- [x] Ready to archive and move to Slice 3 (FE Data Layer)

---

## Steel Thread (#5)
<!-- parallel: sequential | executor: lead -->

**Goal:** Establish a working Next.js project with Vitest, design tokens, and proof that dev server + test runner both work.

- [x] Scaffold Next.js project with TypeScript, Vitest, and config files (`package.json`, `tsconfig.json`, `next.config.js`, `vitest.config.ts`); verify `npm run dev` starts and `npm run test:unit` executes
- [x] Test: `tokens.css` exports all UISPEC design tokens (colors, typography, spacing, elevation, motion, interaction states) as CSS custom properties; `globals.css` imports tokens and applies reset + base styles

**Commit checkpoint:** Steel thread complete — dev server runs, test runner works, design system tokens in place.

---

## Test Checklist

*Each test = one session: Red → Green → Refactor → Mark done*

### Types + Constants (#6)
<!-- parallel: independent | files: src/types/checklist.ts, src/types/trip.ts, src/types/suggestion.ts, src/lib/constants.ts, src/data/trips.ts, tests/types/checklist.test.ts, tests/types/trip.test.ts, tests/types/suggestion.test.ts, tests/lib/constants.test.ts, tests/data/trips.test.ts -->

#### Behavioral Tests
- [x] Test: `checklist.ts` exports ChecklistItem, DismissedSuggestion, and UserCategory types matching TECHSPEC schema fields (type assertion tests with valid/invalid objects)
- [x] Test: `trip.ts` exports Trip, UserProfile, and Activity types; `suggestion.ts` exports Suggestion type — all matching TECHSPEC data shapes
- [x] Test: `constants.ts` exports CATEGORIES array with 10 taxonomy entries, localStorage key factory, and API URL configuration
- [x] Test: `trips.ts` exports sample Trip objects with complete structure (travelers, itinerary with activity_ids, destination with coordinates)

---

### Interfaces + Infrastructure (#7)
<!-- parallel: depends_on=[Types + Constants] | files: src/repositories/checklist-repository.ts, src/repositories/trip-repository.ts, src/services/auth-service.ts, src/services/suggestion-service.ts, src/lib/supabase/client.ts, src/lib/http/fastapi-client.ts, tests/repositories/checklist-repository.test.ts, tests/repositories/trip-repository.test.ts, tests/services/auth-service.test.ts, tests/services/suggestion-service.test.ts, tests/lib/supabase/client.test.ts, tests/lib/http/fastapi-client.test.ts -->

#### Behavioral Tests
- [x] Test: ChecklistRepository interface declares getItems, addItem, updateItem, deleteItem, toggleCheck, getDismissed, dismissSuggestion, getCustomCategories, addCustomCategory, deleteCategory with correct signatures
- [x] Test: TripRepository interface declares getTripById and listTrips; AuthService declares getCurrentUser, signInAnonymously, upgradeToEmail, signOut, onAuthStateChange; SuggestionService declares getSuggestions, getCachedSuggestions, invalidateCache
- [x] Test: Supabase client module exports singleton `createClient` with realtime disabled and correct environment variable usage
- [x] Test: FastAPI HTTP client exports configured fetch wrapper that builds URLs from API base constant and handles JSON request/response

---

### Pure Utilities + Hooks (#8)
<!-- parallel: independent | files: src/utils/item-sorting.ts, src/utils/formatting.ts, src/hooks/use-local-storage.ts, src/hooks/use-viewport-lock.ts, tests/utils/item-sorting.test.ts, tests/utils/formatting.test.ts, tests/hooks/use-local-storage.test.ts, tests/hooks/use-viewport-lock.test.ts -->

#### Behavioral Tests
- [x] Test: `useLocalStorage` hook reads initial value from localStorage, writes updates with JSON serialization, and returns fallback for missing keys
- [x] Test: `useViewportLock` hook applies `overflow: hidden` and `overscroll-behavior: none` to document body when active, restores on deactivate/unmount
- [x] Test: `formatting` displays dates in human-readable format and formats labels (e.g., quantity display, priority labels)
- [x] Test: `item-sorting` sorts checked items to bottom of group while preserving insertion order for unchecked items
- [x] Test: `item-sorting` orders items by category taxonomy (CATEGORIES array index) when sorting by category

---

### Integration (#9)
<!-- parallel: sequential | executor: lead | depends_on: ALL -->

- [x] Test: All type exports are importable from their modules without circular dependencies; module dependency rules match TECHSPEC (types import nothing, utils import nothing, lib imports only external packages)

---

## Refactoring Opportunities

*Discovered during development. Address before moving to next slice.*

---

## Next Slice

**Planned:** Slice 3: FE Data Layer (repository implementations, providers, data hooks)
**Dependencies:** This slice (Slice 1) must be complete
**Estimated Duration:** 2 days

---

## Notes & Discoveries

*Capture learnings, deviations from TECHSPEC, technical debt*
