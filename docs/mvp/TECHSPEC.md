# TripChecklist MVP — Technical Specification

**Engineering companion to [PRD.md](PRD.md)**

---

## Architecture Overview

```
┌─────────────────┐     POST /api/suggestions     ┌──────────────────────┐
│                  │ ──────────────────────────────▸│                      │
│   Next.js (FE)   │                                │  FastAPI + LangChain │
│   Vercel          │◂──────────────────────────────│  Railway / Fly       │
│                  │     JSON suggestions            │                      │
└────────┬─────────┘                                └──────────┬───────────┘
         │                                                     │
         │ ChecklistRepository                                 │ OpenWeatherMap
         │ (interface)                                         │ (weather tool)
         ▼                                                     ▼
┌─────────────────┐                                ┌──────────────────────┐
│  localStorage    │                                │  OpenWeatherMap API  │
│  (MVP impl.)     │                                │  (free tier)         │
└─────────────────┘                                └──────────────────────┘
```

**Key architectural decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend framework | Next.js (not Vite) | API route pairing + native Vercel deployment. SSR not needed for MVP but available later. |
| AI backend | Separate FastAPI service | Keeps AI logic independently deployable and scalable. Python ecosystem for LangChain. |
| LLM | Claude (Anthropic API) | Primary LLM. Project uses Claude Code for development — staying in Anthropic ecosystem. GPT-4o as fallback. |
| Persistence | localStorage + repository pattern | Prototype will integrate with production DB (TBD). Both Supabase and localStorage are equally throwaway — localStorage is simpler, has zero external dependencies, and works offline. Repository interface makes the future DB swap a single-file change. |
| Frontend CRUD | ChecklistRepository interface | UI programs against an abstraction. MVP ships `LocalStorageChecklistRepository`. Production swaps in `ApiChecklistRepository`. Reduces coupling to zero. |

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | React (Next.js) | Mobile-first SPA. Basic CSS transitions for interactions. |
| AI Engine | LangChain (Python) | Orchestrates LLM + weather tool. Pydantic output parser for structured JSON. |
| LLM | Claude (Anthropic API) | Structured JSON output mode. Few-shot prompting for consistent checklist format. GPT-4o fallback. |
| Weather API | OpenWeatherMap (free tier) | LangChain Tool integration. Cached per destination+date. 5-day forecast limit. |
| Backend | FastAPI (Python) | AI suggestions endpoint only. Single endpoint: `POST /api/suggestions`. |
| Persistence | localStorage | Browser-native storage via repository pattern. No external service needed. Swappable to any backend via `ChecklistRepository` interface. |
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
  "destination": { "location": "Jeju Island, KR", "country_code": "KR" },
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

### TypeScript Data Shapes

Same fields as previous SQL schema, expressed as TypeScript interfaces for localStorage persistence.

```typescript
interface ChecklistItem {
  id: string;                          // crypto.randomUUID()
  tripId: string;
  itemName: string;
  category: Category;                  // canonical taxonomy enum
  quantity: number;                    // default: 1
  priority: 'essential' | 'recommended' | 'optional';  // default: 'recommended'
  dayRelevance: number[];              // default: []
  activityRef: string | null;          // references activity_id from trip JSON
  reasoning: string | null;            // AI-generated reasoning (null for user-added)
  checked: boolean;                    // default: false
  bookingLink: string | null;
  source: 'user' | 'ai';              // default: 'user'
  createdAt: string;                   // ISO 8601
  updatedAt: string;                   // ISO 8601
}

interface DismissedSuggestion {
  id: string;
  tripId: string;
  itemName: string;
  category: string | null;
  activityRef: string | null;
  dismissedAt: string;                 // ISO 8601
}
```

### localStorage Keys

```
tripchecklist:items:{tripId}       → ChecklistItem[]
tripchecklist:dismissed:{tripId}   → DismissedSuggestion[]
```

### Repository Interface

UI components depend on this interface, never on localStorage directly.

```typescript
interface ChecklistRepository {
  getItems(tripId: string): Promise<ChecklistItem[]>;
  addItem(item: Omit<ChecklistItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChecklistItem>;
  updateItem(id: string, updates: Partial<ChecklistItem>): Promise<ChecklistItem>;
  deleteItem(id: string): Promise<void>;
  toggleCheck(id: string): Promise<ChecklistItem>;

  getDismissed(tripId: string): Promise<DismissedSuggestion[]>;
  dismissSuggestion(tripId: string, itemName: string, category: string | null): Promise<void>;
}
```

MVP ships `LocalStorageChecklistRepository` implementing this interface. When the production DB is chosen, a new implementation (e.g., `ApiChecklistRepository`) replaces it without touching UI code.

**Key design decisions (preserved from consensus review):**
- `priority` field matches AI response format (was missing in original PRD)
- `activityRef` references `activity_id` from trip JSON (stable ID, not descriptive string)
- Dismissed suggestions include `category` for robust dedup (unique by tripId + itemName + category)
- All fields have explicit defaults in the repository implementation

---

## API Contracts

### Checklist CRUD — Repository Pattern

Frontend calls `ChecklistRepository` methods. No backend involved for CRUD operations.

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

---

## AI Pipeline Details

### LangChain Architecture

```
Trip JSON + User Profile + Existing Items + Dismissed Items
                          │
                          ▼
                ┌─────────────────┐
                │  Weather Tool    │ ── OpenWeatherMap API (cached)
                │  (LangChain)     │
                └────────┬────────┘
                         │ weather context
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

### Dedup Strategy

1. Normalize item names: lowercase, trim whitespace, strip trailing plurals
2. Compare against existing items and dismissed items
3. Post-LLM filter removes any suggestions that match normalized existing/dismissed names

### Weather Integration

- **OpenWeatherMap free tier:** 5-day forecast only
- **For trips within 5 days:** Real forecast data via LangChain Tool, cached per destination+date
- **For trips beyond 5 days:** Fallback to weather notes embedded in trip JSON (e.g., "April in Jeju: avg 12-18°C, pollen season, occasional rain")
- Weather data adjusted by user's `weather_sensitivity` preference before passing to LLM

### Cost Controls

- Cache AI suggestions per `trip_id` — subsequent requests return cached results unless checklist changes
- Max 3 AI suggestion requests per trip per session
- LLM token usage logged for monitoring

---

## Edge States & Error Handling

| State | Behavior |
|-------|----------|
| AI loading | Skeleton cards with shimmer animation (~5-10s expected) |
| AI failure (LLM error) | Toast notification: "Suggestions unavailable. Try again." + retry button |
| AI returns zero suggestions | Message: "AI has no additional suggestions for this trip." |
| Empty checklist (no items) | Prompt: "Add items manually or tap 'Get AI Suggestions' to get started." |
| localStorage full | Extremely unlikely for checklist data (~5MB limit vs ~few KB per trip). Show toast if `setItem` throws `QuotaExceededError`. |
| Malformed AI response | Pydantic validation catches invalid JSON. Return error to user, log for debugging. |

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| Health/medical PII in localStorage | Data stays client-side only — never transmitted to a server. Acceptable for demo with hardcoded sample data. Production integration will need server-side storage with auth. |
| No auth for MVP | All data scoped to `trip_id` and stored locally. No cross-user exposure possible (single-device, single-browser). |
| LLM prompt injection | Trip data is hardcoded for MVP. User-added item names are the only user input to LLM — sanitize before including in prompt. |

---

## Hosting & Deployment

| Component | Platform | Plan | Notes |
|-----------|----------|------|-------|
| Frontend (Next.js) | Vercel | Free tier | Auto-deploy from GitHub. Custom domain optional. |
| Backend (FastAPI) | Railway or Fly.io | Free tier | Single `POST /api/suggestions` endpoint. Set `ANTHROPIC_API_KEY` and `OPENWEATHERMAP_KEY` as env vars. |
| Persistence | localStorage (browser) | N/A | No hosted database needed for MVP. Data lives in the user's browser. |
