# TripChecklist MVP — Technical Specification

**Engineering companion to [PRD.md](PRD.md)**
**UI/UX companion: [UISPEC.md](UISPEC.md)**

---

## Architecture Overview

```
┌─────────────────┐     SuggestionService          ┌──────────────────────┐
│                  │     (interface)                 │                      │
│   Next.js (FE)   │ ─────────────────────────────▸ │  FastAPI + LangChain │
│   Vercel          │                                │  Railway / Fly       │
│                  │◂───────────────────────────── │                      │
│                  │     JSON suggestions            │                      │
└──┬──────────┬───┘                                └──────────┬───────────┘
   │          │                                               │
   │          │ ChecklistRepository                           │ OpenWeatherMap (forecast)
   │          │ TripRepository                                │ Meteostat (climate normals)
   │          │ (interfaces)                                  │
   │          ▼                                               ▼
   │  ┌─────────────────┐                          ┌──────────────────────┐
   │  │  Supabase        │                          │  OpenWeatherMap API  │
   │  │  (PostgreSQL +   │                          │  (free tier)         │
   │  │   Anonymous Auth)│                          │                      │
   │  └─────────────────┘                          │  Meteostat library   │
   │                                                │  (30-yr normals,     │
   │  AuthService                                   │   no API key)        │
   │  (interface)                                   └──────────────────────┘
   │          │
   │          ▼
   └▸ ┌─────────────────┐
      │  Supabase Auth   │
      │  (Anonymous Auth)│
      └─────────────────┘
```

**Key architectural decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend framework | Next.js (not Vite) | API route pairing + native Vercel deployment. SSR not needed for MVP but available later. |
| AI backend | Separate FastAPI service | Keeps AI logic independently deployable and scalable. Python ecosystem for LangChain. |
| LLM | Claude (Anthropic API) | Primary LLM. Project uses Claude Code for development — staying in Anthropic ecosystem. GPT-4o as fallback. |
| Persistence | Supabase (PostgreSQL) + repository pattern | Production-grade PostgreSQL via Supabase. Real schema, constraints, indexes, and RLS policies. Repository interface decouples UI from storage — swap implementations without touching components. |
| Auth | Supabase Anonymous Auth | No login screen. App auto-signs in each browser session behind the scenes. Each session gets a real UUID for RLS scoping. Upgradable to email/password later. |
| Frontend CRUD | ChecklistRepository interface | UI programs against an abstraction. MVP ships `SupabaseChecklistRepository`. Alternative implementations (e.g., `LocalStorageChecklistRepository`) can be swapped in for offline/testing. Reduces coupling to zero. |
| Auth abstraction | AuthService interface | Components never import Supabase auth directly. `useAuth()` hook consumes `AuthProvider` context. MVP ships `SupabaseAuthService`. Swappable to Firebase, Auth0, etc. |
| AI suggestion abstraction | SuggestionService interface | Centralizes fetch, caching, rate limiting behind one interface. MVP ships `FastAPISuggestionService`. Components call `useAISuggestions()` — never `fetch()` directly. |
| Trip data abstraction | TripRepository interface | Same repository pattern as checklist. MVP ships `HardcodedTripRepository`. Production swaps to `SupabaseTripRepository` with zero component changes. |

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | React (Next.js) | Mobile-only SPA (375–430px target). Basic CSS transitions for interactions. See [UISPEC.md](UISPEC.md) for UI details. |
| AI Engine | LangChain (Python) | Orchestrates LLM + weather tool. Pydantic output parser for structured JSON. |
| LLM | Claude (Anthropic API) | Structured JSON output mode. Few-shot prompting for consistent checklist format. GPT-4o fallback. |
| Forecast API | OpenWeatherMap (free tier) | LangChain Tool integration. Cached per destination+date. 5-day forecast limit only. |
| Climate data | Meteostat (Python library) | Pre-processing step (not a LangChain Tool). 30-year monthly normals for any lat/lon. No API key, no rate limits. `pip install meteostat`. Cached long-term. |
| Backend | FastAPI (Python) | AI suggestions endpoint only. Single endpoint: `POST /api/suggestions`. |
| Persistence | Supabase (PostgreSQL) | Production-grade hosted PostgreSQL. Anonymous auth for no-login UX. RLS policies for data isolation. Swappable via `ChecklistRepository` interface. **Realtime disabled** — unnecessary for single-user checklist. Initialize with `realtime: { enabled: false }`. All data via direct PostgREST calls. |
| Hosting | Vercel (FE) + Railway/Fly (BE) | Fast deploy. Free tier sufficient for demo. |

---

## Code Architecture

Concrete file/folder structure mapping TECHSPEC interfaces to implementation files. Optimized for developer navigation speed in a 1-week AI-assisted MVP build.

### Frontend (Next.js)

```
src/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout, global CSS, viewport meta
│   ├── providers.tsx                 # AppProviders — composes all React contexts
│   ├── page.tsx                      # Landing page (trip selection)
│   └── trip/[tripId]/
│       ├── page.tsx                  # Checklist page (Category/Day views)
│       └── loading.tsx               # Skeleton fallback during data fetch
│
├── components/                       # React UI components (never import implementations/)
│   ├── ui/                           # Reusable primitives (Button, Card, BottomSheet, Collapsible)
│   ├── checklist/                    # Checklist feature components
│   │   ├── ChecklistHeader.tsx       # Trip name, progress bar, view toggle
│   │   ├── CategoryGroup.tsx         # Collapsible category with progress count
│   │   ├── DayView.tsx              # Day timeline with activity items
│   │   ├── ItemRow.tsx              # Single checklist item (checkbox, name, quantity, badge)
│   │   ├── AddItemSheet.tsx         # Bottom sheet for add/edit item
│   │   ├── QuantityStepper.tsx      # Quantity +/- control
│   │   └── ProgressBar.tsx          # 3px accent-fill bar
│   ├── suggestions/                  # AI suggestion components
│   │   ├── SuggestionBanner.tsx     # Collapsible banner with loading/results
│   │   ├── SuggestionCard.tsx       # Accept/dismiss card with reasoning
│   │   └── SuggestionList.tsx       # List of suggestion cards
│   └── common/                       # App-level shared components
│       ├── ErrorBoundary.tsx         # Top-level error fallback
│       ├── PriorityBadge.tsx        # essential/recommended/optional badge
│       └── BookingChip.tsx          # 📎 booking link chip
│
├── providers/                        # React Context providers (DI wiring)
│   ├── auth-provider.tsx             # AuthContext + creates SupabaseAuthService
│   ├── repository-provider.tsx       # RepositoryContext + creates Supabase/Hardcoded repos
│   └── suggestion-provider.tsx       # SuggestionContext + creates FastAPISuggestionService
│
├── repositories/                     # Repository pattern (data access)
│   ├── checklist-repository.ts       # ChecklistRepository interface
│   ├── trip-repository.ts            # TripRepository interface
│   └── implementations/
│       ├── supabase-checklist-repository.ts  # MVP: Supabase-backed CRUD
│       └── hardcoded-trip-repository.ts      # MVP: Sample trip data
│
├── services/                         # Service interfaces (auth, AI)
│   ├── auth-service.ts               # AuthService interface
│   ├── suggestion-service.ts         # SuggestionService interface
│   └── implementations/
│       ├── supabase-auth-service.ts          # MVP: Anonymous auth
│       └── fastapi-suggestion-service.ts     # MVP: HTTP client + cache + rate limit
│
├── types/                            # TypeScript types (per domain, pure — no imports)
│   ├── checklist.ts                  # ChecklistItem, DismissedSuggestion, UserCategory
│   ├── trip.ts                       # Trip, UserProfile, Activity
│   └── suggestion.ts                 # Suggestion (AI response shape)
│
├── hooks/                            # Custom React hooks
│   ├── use-auth.ts                   # Consumes AuthContext via useContext
│   ├── use-checklist.ts              # Consumes RepositoryContext — checklist operations
│   ├── use-trip.ts                   # Consumes RepositoryContext — trip data
│   ├── use-suggestions.ts            # Consumes SuggestionContext
│   ├── use-checklist-state.ts        # Orchestrates checklist data, optimistic updates, sort
│   ├── use-suggestion-banner.ts      # localStorage flags, auto-trigger on first visit
│   ├── use-local-storage.ts          # Generic localStorage hook
│   └── use-viewport-lock.ts          # Body scroll lock for bottom sheet
│
├── lib/                              # Infrastructure (external clients)
│   ├── supabase/
│   │   └── client.ts                 # Singleton Supabase client (realtime: disabled)
│   ├── http/
│   │   └── fastapi-client.ts         # Configured fetch wrapper for backend API
│   └── constants.ts                  # Category taxonomy, localStorage keys, API URLs
│
├── data/                             # Hardcoded MVP data
│   └── trips.ts                      # Sample trip JSON + user profiles (typed)
│
├── utils/                            # Pure utility functions
│   ├── item-sorting.ts               # Checked-to-bottom sort, category ordering
│   └── formatting.ts                 # Date display, label formatting
│
└── styles/
    ├── globals.css                   # Reset, base styles, CSS imports
    └── tokens.css                    # UISPEC design tokens as CSS variables
```

### Backend (FastAPI)

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                       # FastAPI instance, CORS middleware, router mount
│   ├── api/
│   │   └── suggestions.py            # POST /api/suggestions endpoint
│   ├── schemas/
│   │   ├── request.py                # Pydantic models: SuggestionRequest (trip, profile, items)
│   │   └── response.py              # Pydantic models: SuggestionResponse, ErrorResponse
│   ├── services/
│   │   ├── pipeline.py               # Orchestrator: climate → weather → LLM → parser → dedup
│   │   ├── dedup.py                  # Item normalization (lowercase, trim, strip plurals) + dedup
│   │   └── prompts.py               # System prompt, few-shot examples, prompt templates
│   ├── clients/
│   │   ├── anthropic_client.py       # Claude API wrapper (structured JSON output)
│   │   ├── openweather_client.py     # OpenWeatherMap HTTP client (5-day forecast)
│   │   └── meteostat_client.py       # Meteostat library wrapper + LRU cache
│   ├── core/
│   │   ├── config.py                 # Environment vars via pydantic-settings
│   │   ├── logging.py               # Logging config (LLM token usage tracking)
│   │   └── exceptions.py            # Custom exceptions + error response handlers
│   └── utils/
│       └── cache.py                  # TTL/lru_cache wrappers for climate data
│
├── tests/
│   ├── test_suggestions.py           # Endpoint integration tests
│   └── test_dedup.py                # Dedup unit tests
│
├── requirements.txt
├── Dockerfile
└── .env.example
```

### Module Dependency Rules

The following import boundaries enforce the abstractions defined in this spec. Violations indicate coupling that should be refactored.

```
FRONTEND — What imports what:
  app/            → providers/, components/, hooks/
  components/     → hooks/, types/, utils/
  providers/      → services/implementations/, repositories/implementations/
  hooks/          → providers/ (via useContext), types/
  repositories/   → types/   (interfaces only)
  services/       → types/   (interfaces only)
  implementations/→ lib/, types/
  lib/            → (external packages only)
  types/          → (nothing — pure type definitions)
  data/           → types/
  utils/          → (nothing — pure functions)

FRONTEND — What must NEVER import what:
  components/     ✗ repositories/, services/, implementations/, lib/supabase/
  hooks/          ✗ implementations/
  types/          ✗ (anything internal)

BACKEND — What imports what:
  api/            → schemas/, services/
  services/       → clients/, schemas/, core/
  clients/        → core/config, utils/
  schemas/        → (nothing internal — pure Pydantic models)

BACKEND — What must NEVER import what:
  api/            ✗ clients/   (always go through services/)
  schemas/        ✗ services/, clients/
```

### Interface-to-File Mapping

| TECHSPEC Interface | Interface File | MVP Implementation File |
|--------------------|---------------|------------------------|
| `ChecklistRepository` | `repositories/checklist-repository.ts` | `repositories/implementations/supabase-checklist-repository.ts` |
| `TripRepository` | `repositories/trip-repository.ts` | `repositories/implementations/hardcoded-trip-repository.ts` |
| `AuthService` | `services/auth-service.ts` | `services/implementations/supabase-auth-service.ts` |
| `SuggestionService` | `services/suggestion-service.ts` | `services/implementations/fastapi-suggestion-service.ts` |

### Provider Wiring

Providers are the **only** files that import concrete implementations. All other code depends on interfaces via hooks.

| Provider | Hook | Creates | Context Value |
|----------|------|---------|---------------|
| `auth-provider.tsx` | `use-auth.ts` | `SupabaseAuthService` | `{ user, signIn, signOut, ... }` |
| `repository-provider.tsx` | `use-checklist.ts`, `use-trip.ts` | `SupabaseChecklistRepository`, `HardcodedTripRepository` | `{ checklistRepo, tripRepo }` |
| `suggestion-provider.tsx` | `use-suggestions.ts` | `FastAPISuggestionService` | `{ getSuggestions, cached, ... }` |

Composed in `app/providers.tsx`:
```tsx
<AuthProvider>
  <RepositoryProvider>
    <SuggestionProvider>
      {children}
    </SuggestionProvider>
  </RepositoryProvider>
</AuthProvider>
```

---

## Data Models

### User Profile Schema

```json
{
  "user_id": "user-001",
  "name": "Minjun",
  "health": {
    "allergies": ["pollen"],
    "medications": ["antihistamine"],
    "conditions": ["mild asthma"]
  },
  "travel_style": "active",
  "preferences": {
    "must_have_items": ["Kindle", "neck pillow", "antihistamine"],
    "weather_sensitivity": "gets cold easily"
  }
}
```

### Trip JSON Schema

Each activity includes a stable `activity_id` for reliable cross-referencing between checklist items and itinerary activities.

```json
{
  "trip_id": "jeju-adventure-001",
  "travelers": [{ "name": "Minjun", "age": 32 }, { "name": "Soye", "age": 29 }],
  "departure": { "location": "Seoul, KR", "date": "2026-04-10" },
  "destination": {
    "location": "Jeju Island, KR",
    "country_code": "KR",
    "coordinates": { "lat": 33.4996, "lon": 126.5312 }
  },
  "return_date": "2026-04-14",
  "itinerary": [
    { "day": 1, "date": "2026-04-10", "activities": [
        { "activity_id": "d1-flight", "type": "flight", "detail": "GMP→CJU 08:30", "booking_ref": "KE1234" },
        { "activity_id": "d1-seongsan", "type": "sightseeing", "detail": "Seongsan Ilchulbong", "notes": "1hr hike" }
    ]},
    { "day": 2, "date": "2026-04-11", "activities": [
        { "activity_id": "d2-hallasan", "type": "outdoor_activity", "detail": "Hallasan full-day hike",
          "notes": "Eorimok trail, 6-8hrs" }
    ]},
    { "day": 3, "date": "2026-04-12", "activities": [
        { "activity_id": "d3-beach", "type": "beach", "detail": "Hyeopjae Beach" },
        { "activity_id": "d3-bbq", "type": "dining", "detail": "Black pork BBQ", "booking_ref": "REST789" }
    ]}
  ],
  "preferences": { "travel_style": "active", "budget_level": "mid-range" },
  "accommodation": { "type": "hotel", "name": "Jeju Shinhwa Resort", "booking_ref": "HTL456" }
}
```

**`destination.coordinates`** — optional `{ lat, lon }` used by the Meteostat climate lookup. Required for MVP hardcoded trips. When missing, the climate pre-processing step is skipped and the LLM falls back to its own seasonal knowledge. No geocoding API needed — MVP hardcodes coordinates; production frontend populates them at trip creation.

### Category Taxonomy

Default set enforced by Pydantic enum on AI output. Users can create additional custom categories via the UI (see [UISPEC.md](UISPEC.md)). User-added items default to "Miscellaneous" if no category selected. Custom categories are stored as free-text strings in the `category` column (no SQL CHECK constraint). Custom categories are also persisted in the `user_categories` table so they survive even when empty. The 10 default categories are always rendered (even when empty) and are not stored in `user_categories`. Deleting a custom category atomically reassigns its items to "Miscellaneous" via `deleteCategory()`. AI suggestions only use the 10 canonical categories.

| Category | Examples |
|----------|----------|
| Clothing | T-shirts, jackets, thermal layers |
| Documents | Passport, boarding pass, insurance |
| Toiletries | Sunscreen, toothbrush, shampoo |
| Electronics | Phone charger, power bank, camera |
| Health | Medications, first-aid kit, inhaler |
| Footwear | Hiking boots, sandals, sneakers |
| Accessories | Sunglasses, hat, watch |
| Gear | Backpack, trekking poles, snorkel |
| Food & Snacks | Trail mix, water bottle, snacks |
| Miscellaneous | Anything that doesn't fit above |

---

## Data Layer

### PostgreSQL Schema (Supabase)

```sql
-- Checklist items table
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,  -- 10 default categories + user-created custom categories (no CHECK constraint)
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  priority TEXT NOT NULL DEFAULT 'recommended'
    CHECK (priority IN ('essential', 'recommended', 'optional')),
  assigned_day INTEGER,             -- null = General (no day assignment)
  activity_ref TEXT,                -- null = no activity assignment
  -- Mutual exclusion: item assigned to day OR activity, not both
  CHECK (NOT (assigned_day IS NOT NULL AND activity_ref IS NOT NULL)),
  reasoning TEXT,
  checked BOOLEAN NOT NULL DEFAULT FALSE,
  booking_link TEXT,
  source TEXT NOT NULL DEFAULT 'user' CHECK (source IN ('user', 'ai')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dismissed suggestions table
CREATE TABLE dismissed_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT,
  activity_ref TEXT,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, trip_id, item_name, category)
);

-- Custom categories table (persists empty custom categories)
CREATE TABLE user_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, trip_id, category_name)
);

-- Performance indexes
CREATE INDEX idx_checklist_items_user_trip ON checklist_items(user_id, trip_id);
CREATE INDEX idx_dismissed_user_trip ON dismissed_suggestions(user_id, trip_id);
CREATE INDEX idx_user_categories_user_trip ON user_categories(user_id, trip_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER checklist_items_updated_at
  BEFORE UPDATE ON checklist_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Row Level Security (RLS)

Every table is locked down so users can only access their own data. Anonymous auth users get a real UUID, so these policies work identically for anonymous and authenticated users.

```sql
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dismissed_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own checklist items"
  ON checklist_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own dismissed suggestions"
  ON dismissed_suggestions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own categories"
  ON user_categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### TypeScript Data Shapes

Frontend interfaces mapped 1:1 from the PostgreSQL schema. Supabase client returns these shapes directly.

```typescript
interface ChecklistItem {
  id: string;                          // UUID from Supabase
  user_id: string;                     // auth.uid() — set automatically
  trip_id: string;
  item_name: string;
  category: string;                     // 10 defaults + user-created custom categories
  quantity: number;                    // default: 1
  priority: 'essential' | 'recommended' | 'optional';
  assigned_day: number | null;         // null = General (no day assignment)
  activity_ref: string | null;         // references activity_id from trip JSON; mutually exclusive with assigned_day
  reasoning: string | null;            // AI-generated reasoning (null for user-added)
  checked: boolean;                    // default: false
  booking_link: string | null;
  source: 'user' | 'ai';              // default: 'user'
  created_at: string;                  // ISO 8601 (timestamptz)
  updated_at: string;                  // ISO 8601 (auto-updated by trigger)
}

interface DismissedSuggestion {
  id: string;
  user_id: string;
  trip_id: string;
  item_name: string;
  category: string | null;
  activity_ref: string | null;
  dismissed_at: string;                // ISO 8601
}

interface UserCategory {
  id: string;
  user_id: string;
  trip_id: string;
  category_name: string;
  display_order: number;               // default: 0
  created_at: string;                  // ISO 8601
}
```

### Repository Interface

UI components depend on this interface, never on Supabase directly.

```typescript
interface ChecklistRepository {
  getItems(tripId: string): Promise<ChecklistItem[]>;
  addItem(item: Omit<ChecklistItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<ChecklistItem>;
  updateItem(id: string, updates: Partial<ChecklistItem>): Promise<ChecklistItem>;
  deleteItem(id: string): Promise<void>;
  toggleCheck(id: string): Promise<ChecklistItem>;

  getDismissed(tripId: string): Promise<DismissedSuggestion[]>;
  dismissSuggestion(tripId: string, itemName: string, category: string | null): Promise<void>;

  getCustomCategories(tripId: string): Promise<UserCategory[]>;
  addCustomCategory(tripId: string, categoryName: string): Promise<UserCategory>;
  deleteCategory(tripId: string, categoryName: string): Promise<void>;
  // deleteCategory: batch-updates all items in that category to "Miscellaneous", then deletes the category row
}
```

MVP ships `SupabaseChecklistRepository` implementing this interface. The repository automatically injects `user_id` from the current Supabase session (`auth.uid()`) on inserts — callers never need to know about auth.

**Key design decisions (preserved from consensus review):**
- `priority` field matches AI response format (was missing in original PRD)
- `assigned_day` is a single integer (replaces `day_relevance` array) — items belong to one day or one activity, not both
- `activity_ref` references `activity_id` from trip JSON (stable ID, not descriptive string); mutually exclusive with `assigned_day` (enforced by CHECK constraint)
- Dismissed suggestions include `category` for robust dedup (unique constraint on `user_id + trip_id + item_name + category`)
- `user_id` column + RLS ensures data isolation even with anonymous auth
- `updated_at` auto-managed by database trigger — frontend never sets it manually
- All fields have explicit defaults in the schema (enforced at database level, not just application level)

**Optimistic updates:** Repository methods (`toggleCheck`, `addItem`, `updateItem`) should apply **optimistic updates** — update local state immediately, then confirm with Supabase. On failure, rollback local state and show toast error. This prevents perceivable latency on mobile networks.

### Frontend Rendering Rules

The following behaviors are implemented as client-side rendering logic, not persisted in the database:

| Rule | Description |
|------|-------------|
| Checked-to-bottom | Checked items sort to the bottom of their category/day group; unchecked items stay in insertion order |
| Progress computation | "X of Y" counts computed client-side from `getItems()` result — no server-side aggregation |
| Scroll restoration | Per-view scroll offset stored in React state (sessionStorage fallback); preserved when switching between Category and Day views |
| Category ordering | Default 10 categories rendered in taxonomy order; custom categories appear after defaults in `display_order` |

### Service Interfaces

Same decoupling pattern as `ChecklistRepository`. Components depend on interfaces, never on concrete implementations.

#### AuthService

Wraps authentication so components never import Supabase auth directly. Consumed via `useAuth()` hook from an `AuthProvider` context.

```typescript
interface AuthService {
  getCurrentUser(): Promise<{ id: string; isAnonymous: boolean } | null>;
  signInAnonymously(): Promise<void>;
  upgradeToEmail(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  onAuthStateChange(cb: (user: { id: string; isAnonymous: boolean } | null) => void): () => void;
}
```

MVP ships `SupabaseAuthService`. The `ChecklistRepository` receives the auth service as a dependency to resolve `user_id` on inserts.

#### SuggestionService

Wraps the AI suggestion pipeline. Centralizes fetch, caching, rate limiting (max 3 per trip per session), and error recovery. Consumed via `useAISuggestions()` hook.

```typescript
interface SuggestionService {
  getSuggestions(params: {
    trip: Trip;
    userProfile: UserProfile;
    existingItems: string[];
    dismissedItems: DismissedSuggestion[];
  }): Promise<Suggestion[]>;
  getCachedSuggestions(tripId: string): Suggestion[] | null;
  invalidateCache(tripId: string): void;
}
```

MVP ships `FastAPISuggestionService`. Caching is per `trip_id` in memory (session-scoped). The 3-request limit and cache invalidation are enforced inside this implementation.

#### TripRepository

Same pattern as `ChecklistRepository` for trip data. MVP uses hardcoded sample trips; production swaps to Supabase.

```typescript
interface TripRepository {
  getTripById(tripId: string): Promise<Trip | null>;
  listTrips(): Promise<Trip[]>;
}
```

MVP ships `HardcodedTripRepository`. Production ships `SupabaseTripRepository` (schema not in MVP scope).

#### Provider Wiring

All interfaces provided via React context. Components consume through hooks only:

| Interface | Provider | Hook | MVP Implementation |
|-----------|----------|------|--------------------|
| `AuthService` | `AuthProvider` | `useAuth()` | `SupabaseAuthService` |
| `ChecklistRepository` | `RepositoryProvider` | `useChecklistRepository()` | `SupabaseChecklistRepository` |
| `SuggestionService` | `SuggestionProvider` | `useAISuggestions()` | `FastAPISuggestionService` |
| `TripRepository` | `RepositoryProvider` | `useTripRepository()` | `HardcodedTripRepository` |

Swapping implementations requires changing only the provider setup — no component code changes.

---

## API Contracts

### Checklist CRUD — Repository Pattern

Frontend calls `ChecklistRepository` methods. CRUD operations go directly to Supabase via the client library (no custom backend needed).

| Operation | Repository Call |
|-----------|----------------|
| Load checklist items for a trip | `repo.getItems(tripId)` |
| Add item | `repo.addItem({ tripId, itemName, category, ... })` |
| Toggle check | `repo.toggleCheck(itemId)` |
| Edit item | `repo.updateItem(itemId, { itemName, category, quantity })` |
| Delete item | `repo.deleteItem(itemId)` |
| Dismiss AI suggestion | `repo.dismissSuggestion(tripId, itemName, category)` |
| Load dismissed suggestions | `repo.getDismissed(tripId)` |

### AI Suggestions — FastAPI Endpoint

```
POST /api/suggestions

Request Body:
{
  "trip": <trip JSON>,
  "user_profile": <user profile JSON>,
  "existing_items": ["hiking boots", "passport", ...],
  "dismissed_items": [{"item_name": "rain poncho", "category": "Gear"}, ...]
}

Response:
{
  "suggestions": [
    {
      "item_name": "Hiking boots",
      "category": "Footwear",
      "quantity": 1,
      "priority": "essential",
      "assigned_day": null,
      "activity_ref": "d2-hallasan",
      "reasoning": "6-8hr Eorimok trail requires ankle support",
      "booking_link": null
    },
    {
      "item_name": "Antihistamine",
      "category": "Health",
      "quantity": 1,
      "priority": "essential",
      "assigned_day": null,
      "activity_ref": null,
      "reasoning": "User has pollen allergy — Jeju April is peak pollen season",
      "booking_link": null
    },
    {
      "item_name": "Thermal base layer",
      "category": "Clothing",
      "quantity": 1,
      "priority": "recommended",
      "assigned_day": null,
      "activity_ref": "d2-hallasan",
      "reasoning": "Summit temp ~8°C. User profile: gets cold easily",
      "booking_link": null
    }
  ]
}
```

**Notes:**
- `assigned_day` is a single integer (day number) or `null` for General items. Mutually exclusive with `activity_ref`.
- `activity_ref` uses `activity_id` from trip JSON (e.g., `"d2-hallasan"`) or `null` when item is assigned to a day or is General
- When AI assigns an item to an activity, `assigned_day` must be `null` (the day is implied by the activity)
- `category` must be one of the canonical taxonomy values
- `priority` must be one of: `essential`, `recommended`, `optional`
- Request includes `dismissed_items` so the AI avoids re-suggesting them

**Abstraction:** Frontend components never call this endpoint directly. All access goes through the `SuggestionService` interface (see Service Interfaces). The `FastAPISuggestionService` implementation handles the HTTP call, response parsing, caching, and rate limiting internally.

---

## AI Pipeline Details

### LangChain Architecture

```
Trip JSON + User Profile + Existing Items + Dismissed Items
                          │
            ┌─────────────┴──────────────┐
            │                            │
            ▼                            ▼
  ┌──────────────────┐        ┌─────────────────────┐
  │  Climate Step     │        │  Weather Tool        │
  │  (pre-processing) │        │  (LangChain Tool)    │
  │                   │        │                      │
  │  Meteostat lib    │        │  OpenWeatherMap API  │
  │  → 30-yr monthly  │        │  (trips ≤5 days      │
  │    normals         │        │   only; skipped for  │
  │                   │        │   distant trips)     │
  │  fallback: LLM    │        │                      │
  │  seasonal         │        │                      │
  │  knowledge        │        │                      │
  └────────┬──────────┘        └──────────┬───────────┘
           │ climate summary              │ weather context
           └──────────────┬───────────────┘
                          │ combined context
                          ▼
                ┌─────────────────┐
                │  LLM Chain       │ ── Claude (Anthropic API)
                │  + Few-shot      │    Structured JSON output
                │  + System prompt │
                └────────┬────────┘
                         │ raw suggestions
                         ▼
                ┌─────────────────┐
                │  Pydantic Parser │ ── Validates schema + category enum
                │  + Dedup Filter  │    Normalizes & removes duplicates
                └────────┬────────┘
                         │
                         ▼
                   Final suggestions
```

> **Design note:** Meteostat is deliberately NOT a LangChain Tool. LangChain Tools are for when the LLM decides whether to invoke them (agent-style). Climate normals are always relevant — implementing it as a pre-processing step is simpler, faster (no LLM round-trip to decide), and guaranteed to run.

### Dedup Strategy

1. Normalize item names: lowercase, trim whitespace, strip trailing plurals
2. Compare against existing items and dismissed items
3. Post-LLM filter removes any suggestions that match normalized existing/dismissed names

### Weather Integration

#### Real-time Forecast (OpenWeatherMap)

- **Source:** OpenWeatherMap free tier — 5-day forecast limit
- **For trips within 5 days:** Real forecast data fetched via LangChain Tool, cached per `destination+date`
- **For trips beyond 5 days:** Weather Tool skipped entirely; climate normals (below) provide seasonal context
- Weather data adjusted by user's `weather_sensitivity` preference before passing to LLM

#### Historical Climate Normals (Meteostat)

- **Source:** Meteostat Python library (`pip install meteostat`) — 30-year monthly averages, no API key required
- **Always executed** as a pre-processing step before the LLM call
- **Input:** `destination.coordinates` (lat/lon) from trip JSON + travel month derived from `departure.date`
- **Output:** A formatted climate summary string injected into the LLM prompt context, e.g.:
  `"Historical climate for Jeju in April: avg temp 12.8°C (min 8.2, max 17.5), avg precipitation 78mm, avg wind speed 12.1 km/h"`
- **Fields fetched:** `tavg`, `tmin`, `tmax`, `prcp`, `wspd`, `tsun` (monthly normals)
- **Fallback:** If Meteostat returns empty data (remote/unrecognized location) or `destination.coordinates` is missing, the climate summary is omitted and the LLM uses its own seasonal knowledge — no error surfaced to user
- **Caching:** Long-lived cache keyed by `(lat, lon, month)`. Static 30-year averages — TTL of 30 days. Cache backend: in-process `functools.lru_cache` for MVP

### Cost Controls

- Cache AI suggestions per `trip_id` — subsequent requests return cached results unless checklist changes. Encapsulated inside `SuggestionService.getCachedSuggestions()` — callers never manage cache state.
- Max 3 AI suggestion requests per trip per session — enforced inside `SuggestionService` implementation, not in UI code.
- LLM token usage logged for monitoring
- Meteostat climate normals cached by `(lat, lon, month)` with 30-day TTL — static 30-year averages, no expiration concern

---

## Edge States & Error Handling

| State | Behavior |
|-------|----------|
| AI loading | Collapsible banner: "Getting personalized suggestions..." with subtle animation (~5-10s expected) |
| AI failure (LLM error) | Toast notification: "Suggestions unavailable. Try again." + retry button |
| AI returns zero suggestions | Message: "AI has no additional suggestions for this trip." |
| Empty checklist (no items) | All default categories shown empty with inline add fields. AI suggestions auto-triggered on first visit. |
| Supabase unreachable | Toast notification: "Unable to save. Check your connection." Disable save actions; read-only mode with cached data if available. |
| Anonymous auth fails | `AuthService.signInAnonymously()` retries up to 3 times with exponential backoff. If still failing, show "Unable to connect" screen. Retry logic lives inside the service, not in components. |
| Malformed AI response | Pydantic validation catches invalid JSON. Return error to user, log for debugging. |
| Meteostat returns empty (remote location) | Climate summary silently omitted from LLM prompt. LLM falls back to its own seasonal knowledge. No error surfaced to user. Log miss server-side. |
| `destination.coordinates` missing | Climate step skipped entirely. Same LLM fallback. No user-visible error. Warn in server logs. |

### Banner UI State Persistence

The AI suggestion banner's UI state is persisted in `localStorage` (not Supabase) since it's ephemeral UI preference, not user data:

| Key | Type | Purpose |
|-----|------|---------|
| `tripchecklist_banner_seen_<tripId>` | boolean | Tracks whether AI suggestions have been triggered for this trip. Controls auto-trigger on first visit (UISPEC: "Expanded on first visit"). |
| `tripchecklist_banner_expanded_<tripId>` | boolean | Tracks collapsed/expanded state. First visit = expanded; subsequent visits = collapsed. |

These keys live outside the repository pattern — direct `localStorage` access from the suggestion banner component. The `SuggestionService` checks `banner_seen` to decide auto-trigger behavior. Clearing browser data resets these flags (new user gets first-visit behavior again, which is the correct UX).

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| Health/medical PII | Data stored in Supabase PostgreSQL with RLS. Each anonymous user can only read/write their own rows (`auth.uid() = user_id`). Acceptable for demo with hardcoded sample data. |
| Auth without login | Supabase Anonymous Auth assigns a real UUID per browser session. No email or password required. Session persists across page refreshes (Supabase stores session token in localStorage). Data is isolated per anonymous user via RLS. |
| Anonymous user data lifecycle | Anonymous sessions persist until browser data is cleared. Data remains in Supabase even if session is lost. For production: implement periodic cleanup of orphaned anonymous data. |
| Supabase API key exposure | `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe to expose — it's a public key. RLS policies (not the key) control data access. Never expose the `service_role` key in frontend code. |
| LLM prompt injection | Trip data is hardcoded for MVP. User-added item names are the only user input to LLM — sanitize before including in prompt. |

---

## Anonymous Auth Flow

No login screen. The app silently authenticates each browser session using Supabase Anonymous Auth.

```
App Load
  │
  ├── Existing Supabase session in browser?
  │   ├── YES → Use existing anonymous user (same UUID as before)
  │   └── NO  → Call supabase.auth.signInAnonymously()
  │             → Supabase creates a new anonymous user
  │             → Returns UUID + session token
  │             → Session stored in browser (managed by Supabase client)
  │
  ▼
All subsequent Supabase queries use auth.uid()
  → RLS policies enforce data isolation per user
  → user_id column auto-populated on inserts
```

**Supabase Dashboard Setup:**
1. Enable "Anonymous Sign-ins" in **Auth → Settings → Authentication**
2. No email provider configuration needed
3. No OAuth provider needed

**Session Persistence:**
- Supabase client stores the session token in `localStorage` automatically
- Same anonymous user persists across page refreshes and browser restarts
- Session is lost only when browser data is cleared (new anonymous user created on next visit)

**Future Upgrade Path:**
- Anonymous users can be linked to real accounts via `supabase.auth.updateUser({ email, password })`
- Existing data stays associated with the same `user_id` — no migration needed
- This is the standard Supabase pattern for "try before you sign up" flows

**Abstraction:** The auth flow above is encapsulated inside `SupabaseAuthService` (see Service Interfaces). Components use the `useAuth()` hook and never call `supabase.auth.*` directly. This makes the auth provider swappable without changing any component code.

---

## Hosting & Deployment

| Component | Platform | Plan | Notes |
|-----------|----------|------|-------|
| Frontend (Next.js) | Vercel | Free tier | Auto-deploy from GitHub. Custom domain optional. |
| Backend (FastAPI) | Railway or Fly.io | Free tier | Single `POST /api/suggestions` endpoint. Set `ANTHROPIC_API_KEY` and `OPENWEATHERMAP_KEY` as env vars. No additional env vars for Meteostat (no API key). Add `meteostat` to `requirements.txt`. First-run downloads ~1MB station index (~2s cold start). |
| Database | Supabase | Free tier | PostgreSQL with RLS. Anonymous auth enabled. 500MB database, 50K monthly active users on free tier — more than sufficient for MVP. |

### Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel (Frontend) | Supabase project URL (e.g., `https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel (Frontend) | Public anon key — safe to expose in frontend. RLS controls access. |
| `ANTHROPIC_API_KEY` | Railway/Fly (Backend) | Claude API key for AI suggestions |
| `OPENWEATHERMAP_KEY` | Railway/Fly (Backend) | Weather forecast API key |

**Note:** No `SUPABASE_SERVICE_ROLE_KEY` needed. All frontend access goes through the anon key + RLS. The service role key is only needed for admin operations (migrations, user management) done via CLI or dashboard.

---

## Mobile Viewport & Browser Handling

| Concern | Implementation |
|---------|---------------|
| Viewport meta | `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` |
| Safe areas | Bottom sheet respects `env(safe-area-inset-bottom)` via `padding-bottom` |
| Sheet height | Use `dvh` units for bottom sheet: `height: 65dvh` (falls back to `65vh`) |
| Scroll locking | `overscroll-behavior: none` on body while sheet is open; prevents pull-to-refresh |
| Sticky header | `position: sticky; top: 0; z-index: 10` — tested on iOS Safari with safe-area insets |
| Reduced motion | `prefers-reduced-motion: reduce` → all `duration-*` tokens collapse to `0ms` (per UISPEC) |

**No PWA for MVP** — Web App Manifest, Service Worker, and offline support deferred to v1.1 (per PRD Post-MVP roadmap). The app requires an active network connection for all CRUD operations and AI suggestions.
