# Slice 03: FE Data Layer

**Version:** 1.0
**Created:** 2026-02-23
**Target Completion:** 2026-02-25
**Status:** In Progress

---

## Scope

**User Journey:** Anonymous auth works silently; checklist CRUD operations work through hooks; trip data loads from hardcoded repository.

**Layers Involved:**
- Database: `supabase/migrations/001_checklist_schema.sql` — Schema, RLS, triggers, indexes
- Backend/API: None (frontend-only; suggestion service is a stub)
- Hooks/Logic: `use-auth`, `use-checklist`, `use-trip`, `use-suggestions`, `use-checklist-state`, `use-suggestion-banner`
- UI/Components: None (hooks + providers only; no React components)
- Providers: `auth-provider`, `repository-provider`, `suggestion-provider`, `app/providers`

**Duration Estimate:** 2 days

**Dependencies:** Slice 1 (FE Foundation) must be 100% complete

**TECHSPEC Coverage:**
- Data Layer → Repository implementations (SupabaseChecklistRepository, HardcodedTripRepository)
- Data Layer → Service implementations (SupabaseAuthService, FastAPISuggestionService stub)
- Data Layer → Provider Wiring (AuthProvider > RepositoryProvider > SuggestionProvider)
- Data Layer → Hook layer (all 6 data hooks)
- Data Layer → PostgreSQL Schema (tables, RLS, triggers, indexes)
- Data Layer → Optimistic Updates (toggle, add, update with rollback)
- Anonymous Auth Flow → SupabaseAuthService with retry logic

---

## Exit Criteria

- [ ] All tests in this plan passing (`npm run test:unit`)
- [ ] `supabase/migrations/001_checklist_schema.sql` matches TECHSPEC schema exactly
- [ ] All providers compose correctly in `AppProviders`
- [ ] Anonymous auth with 3x retry works through useAuth hook
- [ ] Checklist CRUD with optimistic updates and rollback tested
- [ ] Trip data loads through hardcoded repository and useTrip hook
- [ ] Suggestion service stub returns empty data through useSuggestions hook
- [ ] Banner localStorage state management works per tripId
- [ ] No TypeScript/linter errors
- [ ] Code committed (structural and behavioral changes separated)
- [ ] Ready to archive and move to Slice 5 (FE UI Layer)

---

## Steel Thread (#13)
<!-- parallel: sequential | executor: lead -->

**Goal:** Supabase migration ready, mock infrastructure in place, providers compose correctly, test helper works. This establishes shared infrastructure that all independent sections depend on.

- [x] Test: `001_checklist_schema.sql` contains valid SQL creating `checklist_items`, `dismissed_suggestions`, `user_categories` tables with all columns, CHECK constraints (priority, quantity, assigned_day/activity_ref mutual exclusion), indexes, RLS policies, and `update_updated_at` trigger matching TECHSPEC
- [x] Test: Mock Supabase client provides chainable query builder (`.from().select().eq().order()` returns `{ data, error }`), auth methods (`getUser`, `signInAnonymously`, `onAuthStateChange`), and test fixtures provide `createMockChecklistItem()` and `createMockUser()` factories with predefined scenarios
- [x] Test: `AppProviders` renders children within nested AuthProvider > RepositoryProvider > SuggestionProvider without errors; create minimal provider skeletons with context defaults
- [x] Test: `createTestWrapper()` helper produces a React component wrapping children in all providers with mock implementations; a trivial hook renders without errors in the wrapper

**Commit checkpoint:** Steel thread complete — migration SQL validated, mock infrastructure ready, providers compose, test helper working.

---

## Test Checklist

*Each test = one session: Red → Green → Refactor → Mark done*

### Auth Layer (#14)
<!-- parallel: independent | files: src/services/implementations/supabase-auth-service.ts, src/providers/auth-provider.tsx, src/hooks/use-auth.ts, tests/services/implementations/supabase-auth-service.test.ts, tests/providers/auth-provider.test.tsx, tests/hooks/use-auth.test.ts -->

#### Behavioral Tests
- [x] Test: `SupabaseAuthService.getCurrentUser()` returns `{ id, isAnonymous }` when session exists, returns null when no session; `signInAnonymously()` calls Supabase auth method successfully
- [x] Test: `signInAnonymously()` retries up to 3 times with exponential backoff on failure (use fake timers), throws after all retries exhausted; `signOut()` calls Supabase signOut; `upgradeToEmail()` calls updateUser; `onAuthStateChange()` subscribes and returns unsubscribe function
- [x] Test: `AuthProvider` initializes by checking for existing session, auto-signs in anonymously if no session, exposes `{ user, loading, error }` through context; children re-render when auth state changes; error state surfaced when auth fails
- [x] Test: `useAuth()` returns `{ user, loading, error, signOut }` from AuthContext; throws meaningful error when used outside AuthProvider

---

### Checklist Repository + Hooks (#15)
<!-- parallel: independent | files: src/repositories/implementations/supabase-checklist-repository.ts, src/providers/repository-provider.tsx, src/hooks/use-checklist.ts, src/hooks/use-checklist-state.ts, tests/repositories/implementations/supabase-checklist-repository.test.ts, tests/providers/repository-provider.test.tsx, tests/hooks/use-checklist.test.ts, tests/hooks/use-checklist-state.test.ts -->

#### Behavioral Tests
- [x] Test: `SupabaseChecklistRepository.getItems(tripId)` queries checklist_items filtered by trip_id, returns typed ChecklistItem[]; `addItem(item)` inserts with auto-injected user_id from current session
- [x] Test: `updateItem(id, updates)` updates matching row and returns updated item; `deleteItem(id)` deletes row; `toggleCheck(id)` reads current checked state, flips it, and returns result
- [x] Test: `getDismissed(tripId)` returns DismissedSuggestion[]; `dismissSuggestion()` inserts with user_id; `getCustomCategories()` returns UserCategory[]; `addCustomCategory()` inserts; `deleteCategory()` batch-updates items to "Miscellaneous" then deletes category row (two calls)
- [x] Test: `RepositoryProvider` creates SupabaseChecklistRepository and HardcodedTripRepository, provides them via context; `useChecklist()` returns checklist repository methods; throws when used outside provider
- [x] Test: `useChecklistState(tripId)` loads items via repository and applies checked-to-bottom sort; `toggleCheck` performs optimistic update (immediate local state flip, rollback on repo failure); `addItem` appends optimistically

---

### Trip + Suggestion Stubs (#16)
<!-- parallel: independent | files: src/repositories/implementations/hardcoded-trip-repository.ts, src/services/implementations/fastapi-suggestion-service.ts, src/providers/suggestion-provider.tsx, src/hooks/use-trip.ts, src/hooks/use-suggestions.ts, src/hooks/use-suggestion-banner.ts, tests/repositories/implementations/hardcoded-trip-repository.test.ts, tests/services/implementations/fastapi-suggestion-service.test.ts, tests/providers/suggestion-provider.test.tsx, tests/hooks/use-trip.test.ts, tests/hooks/use-suggestions.test.ts, tests/hooks/use-suggestion-banner.test.ts -->

#### Behavioral Tests
- [x] Test: `HardcodedTripRepository.getTripById(tripId)` returns matching trip from sample data or null for unknown IDs; `listTrips()` returns all sample trips with correct Trip structure
- [x] Test: `FastAPISuggestionService` stub — `getSuggestions()` returns empty array; `getCachedSuggestions()` returns null; `invalidateCache()` is a no-op (real wiring in Slice 7)
- [x] Test: `SuggestionProvider` creates FastAPISuggestionService, provides via context; `useSuggestions()` returns service methods; throws when used outside provider
- [x] Test: `useTrip(tripId)` loads trip data via repository context, exposes `{ trip, loading, error }`; returns null trip for unknown IDs; re-fetches when tripId changes
- [x] Test: `useSuggestionBanner(tripId)` manages localStorage flags — first visit: bannerSeen=false, bannerExpanded=true (auto-expand per UISPEC); after markSeen: bannerSeen=true, subsequent visits default collapsed; setExpanded toggles

---

### Integration (#17)
<!-- parallel: sequential | executor: lead | depends_on: ALL -->

- [x] Test: Full provider stack renders with all real implementations wired; useAuth + useChecklist + useTrip + useSuggestions hooks all return expected shapes when consumed within AppProviders; no circular dependencies between modules

---

## Refactoring Opportunities

*Discovered during development. Address before moving to next slice.*

---

## Next Slice

**Planned:** Slice 5: FE UI Layer (all React components and pages)
**Dependencies:** This slice (Slice 3) must be complete
**Estimated Duration:** 3 days

---

## Notes & Discoveries

*Capture learnings, deviations from TECHSPEC, technical debt*
