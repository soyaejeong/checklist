# TripChecklist MVP — Technical Specification

**Engineering companion to [PRD.md](PRD.md)**

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
| Frontend | React (Next.js) | Mobile-first SPA. Basic CSS transitions for interactions. |
| AI Engine | LangChain (Python) | Orchestrates LLM + weather tool. Pydantic output parser for structured JSON. |
| LLM | Claude (Anthropic API) | Structured JSON output mode. Few-shot prompting for consistent checklist format. GPT-4o fallback. |
| Forecast API | OpenWeatherMap (free tier) | LangChain Tool integration. Cached per destination+date. 5-day forecast limit only. |
| Climate data | Meteostat (Python library) | Pre-processing step (not a LangChain Tool). 30-year monthly normals for any lat/lon. No API key, no rate limits. `pip install meteostat`. Cached long-term. |
| Backend | FastAPI (Python) | AI suggestions endpoint only. Single endpoint: `POST /api/suggestions`. |
| Persistence | Supabase (PostgreSQL) | Production-grade hosted PostgreSQL. Anonymous auth for no-login UX. RLS policies for data isolation. Swappable via `ChecklistRepository` interface. |
| Hosting | Vercel (FE) + Railway/Fly (BE) | Fast deploy. Free tier sufficient for demo. |

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

Canonical set enforced by Pydantic enum on AI output. User-added items default to "Miscellaneous" if no category selected.

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
  category TEXT NOT NULL CHECK (category IN (
    'Clothing', 'Documents', 'Toiletries', 'Electronics',
    'Health', 'Footwear', 'Accessories', 'Gear',
    'Food & Snacks', 'Miscellaneous'
  )),
  quantity INTEGER NOT NULL DEFAULT 1,
  priority TEXT NOT NULL DEFAULT 'recommended'
    CHECK (priority IN ('essential', 'recommended', 'optional')),
  day_relevance INTEGER[] NOT NULL DEFAULT '{}',
  activity_ref TEXT,
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

-- Performance indexes
CREATE INDEX idx_checklist_items_user_trip ON checklist_items(user_id, trip_id);
CREATE INDEX idx_dismissed_user_trip ON dismissed_suggestions(user_id, trip_id);

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

CREATE POLICY "Users manage own checklist items"
  ON checklist_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own dismissed suggestions"
  ON dismissed_suggestions FOR ALL
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
  category: Category;                  // canonical taxonomy enum
  quantity: number;                    // default: 1
  priority: 'essential' | 'recommended' | 'optional';
  day_relevance: number[];             // PostgreSQL integer array
  activity_ref: string | null;         // references activity_id from trip JSON
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
}
```

MVP ships `SupabaseChecklistRepository` implementing this interface. The repository automatically injects `user_id` from the current Supabase session (`auth.uid()`) on inserts — callers never need to know about auth.

**Key design decisions (preserved from consensus review):**
- `priority` field matches AI response format (was missing in original PRD)
- `activity_ref` references `activity_id` from trip JSON (stable ID, not descriptive string)
- Dismissed suggestions include `category` for robust dedup (unique constraint on `user_id + trip_id + item_name + category`)
- `user_id` column + RLS ensures data isolation even with anonymous auth
- `updated_at` auto-managed by database trigger — frontend never sets it manually
- All fields have explicit defaults in the schema (enforced at database level, not just application level)

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
      "day_relevance": [2],
      "activity_ref": "d2-hallasan",
      "reasoning": "6-8hr Eorimok trail requires ankle support",
      "booking_link": null
    },
    {
      "item_name": "Antihistamine",
      "category": "Health",
      "quantity": 1,
      "priority": "essential",
      "day_relevance": [1, 2, 3],
      "activity_ref": "general",
      "reasoning": "User has pollen allergy — Jeju April is peak pollen season",
      "booking_link": null
    },
    {
      "item_name": "Thermal base layer",
      "category": "Clothing",
      "quantity": 1,
      "priority": "recommended",
      "day_relevance": [2],
      "activity_ref": "d2-hallasan",
      "reasoning": "Summit temp ~8°C. User profile: gets cold easily",
      "booking_link": null
    }
  ]
}
```

**Notes:**
- `activity_ref` uses `activity_id` from trip JSON (e.g., `"d2-hallasan"`) or `"general"` for all-day items
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
| AI loading | Skeleton cards with shimmer animation (~5-10s expected) |
| AI failure (LLM error) | Toast notification: "Suggestions unavailable. Try again." + retry button |
| AI returns zero suggestions | Message: "AI has no additional suggestions for this trip." |
| Empty checklist (no items) | Prompt: "Add items manually or tap 'Get AI Suggestions' to get started." |
| Supabase unreachable | Toast notification: "Unable to save. Check your connection." Disable save actions; read-only mode with cached data if available. |
| Anonymous auth fails | `AuthService.signInAnonymously()` retries up to 3 times with exponential backoff. If still failing, show "Unable to connect" screen. Retry logic lives inside the service, not in components. |
| Malformed AI response | Pydantic validation catches invalid JSON. Return error to user, log for debugging. |
| Meteostat returns empty (remote location) | Climate summary silently omitted from LLM prompt. LLM falls back to its own seasonal knowledge. No error surfaced to user. Log miss server-side. |
| `destination.coordinates` missing | Climate step skipped entirely. Same LLM fallback. No user-visible error. Warn in server logs. |

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
