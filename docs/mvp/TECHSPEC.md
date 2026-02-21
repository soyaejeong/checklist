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
         │ Supabase JS client                                  │ OpenWeatherMap
         │ (CRUD: items, dismissed)                            │ (weather tool)
         ▼                                                     ▼
┌─────────────────┐                                ┌──────────────────────┐
│   Supabase       │                                │  OpenWeatherMap API  │
│   (Postgres)     │                                │  (free tier)         │
└─────────────────┘                                └──────────────────────┘
```

**Key architectural decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend framework | Next.js (not Vite) | API route pairing + native Vercel deployment. SSR not needed for MVP but available later. |
| AI backend | Separate FastAPI service | Keeps AI logic independently deployable and scalable. Python ecosystem for LangChain. |
| LLM | Claude (Anthropic API) | Primary LLM. Project uses Claude Code for development — staying in Anthropic ecosystem. GPT-4o as fallback. |
| Persistence | Supabase (not LocalStorage) | ~2-3 hrs extra setup but avoids full persistence rebuild later. Real-time subscriptions ready for v2.0 collaborative sharing. |
| Frontend CRUD | Supabase JS client (direct) | No backend needed for checklist operations. Reduces FastAPI scope to AI only. |

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | React (Next.js) | Mobile-first SPA. Basic CSS transitions for interactions. |
| AI Engine | LangChain (Python) | Orchestrates LLM + weather tool. Pydantic output parser for structured JSON. |
| LLM | Claude (Anthropic API) | Structured JSON output mode. Few-shot prompting for consistent checklist format. GPT-4o fallback. |
| Weather API | OpenWeatherMap (free tier) | LangChain Tool integration. Cached per destination+date. 5-day forecast limit. |
| Backend | FastAPI (Python) | AI suggestions endpoint only. Single endpoint: `POST /api/suggestions`. |
| Database | Supabase (Postgres) | Hosted Postgres with JS client. Handles checklist CRUD directly from frontend. Free tier covers MVP. |
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

## Database Schema (Supabase)

```sql
-- Trips (hardcoded seed data for MVP)
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_json JSONB NOT NULL,
  user_profile JSONB NOT NULL
);

-- Checklist items (user-added + accepted AI suggestions)
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Miscellaneous',
  quantity INTEGER NOT NULL DEFAULT 1,
  priority TEXT NOT NULL DEFAULT 'recommended'
    CHECK (priority IN ('essential', 'recommended', 'optional')),
  day_relevance INTEGER[] DEFAULT '{}',
  activity_ref TEXT,                    -- references activity_id from trip JSON
  reasoning TEXT,                       -- AI-generated reasoning (null for user-added)
  checked BOOLEAN NOT NULL DEFAULT false,
  booking_link TEXT,
  source TEXT NOT NULL DEFAULT 'user'
    CHECK (source IN ('user', 'ai')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dismissed suggestions (to prevent re-suggesting)
CREATE TABLE dismissed_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT,
  activity_ref TEXT,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trip_id, item_name, category)
);

-- Indexes
CREATE INDEX idx_checklist_items_trip ON checklist_items(trip_id);
CREATE INDEX idx_dismissed_trip ON dismissed_suggestions(trip_id);
```

**Key schema decisions from consensus review:**
- `priority` column added to match AI response format (was missing in original PRD)
- `activity_ref` references `activity_id` from trip JSON (stable ID, not descriptive string)
- `dismissed_suggestions` includes `category` + unique constraint for robust dedup
- All columns have explicit defaults

---

## API Contracts

### Checklist CRUD — Supabase (direct from frontend)

Frontend uses `@supabase/supabase-js` client directly. No backend involved.

| Operation | Supabase Call |
|-----------|--------------|
| Load checklist items for a trip | `supabase.from('checklist_items').select('*').eq('trip_id', tripId)` |
| Add item | `supabase.from('checklist_items').insert({ trip_id, item_name, category, ... })` |
| Toggle check | `supabase.from('checklist_items').update({ checked: !current, updated_at: new Date() }).eq('id', itemId)` |
| Edit item | `supabase.from('checklist_items').update({ item_name, category, quantity, updated_at: new Date() }).eq('id', itemId)` |
| Delete item | `supabase.from('checklist_items').delete().eq('id', itemId)` |
| Dismiss AI suggestion | `supabase.from('dismissed_suggestions').insert({ trip_id, item_name, category })` |
| Load dismissed suggestions | `supabase.from('dismissed_suggestions').select('item_name, category').eq('trip_id', tripId)` |

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
| Supabase offline | Optimistic UI updates in React state. Queue failed writes and retry on reconnect. |
| Malformed AI response | Pydantic validation catches invalid JSON. Return error to user, log for debugging. |

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| Health/medical PII in Supabase | RLS policy: anon users can only access data matching their `trip_id`. No cross-trip data exposure. Consider proxying sensitive reads through FastAPI in post-MVP. |
| No auth for MVP | All data scoped to `trip_id` in URL. Acceptable for demo with hardcoded sample data. |
| Supabase anon key in frontend | Anon key with RLS policies. Service key stays server-side only (FastAPI env vars). |
| LLM prompt injection | Trip data is hardcoded for MVP. User-added item names are the only user input to LLM — sanitize before including in prompt. |

---

## Hosting & Deployment

| Component | Platform | Plan | Notes |
|-----------|----------|------|-------|
| Frontend (Next.js) | Vercel | Free tier | Auto-deploy from GitHub. Custom domain optional. |
| Backend (FastAPI) | Railway or Fly.io | Free tier | Single `POST /api/suggestions` endpoint. Set `ANTHROPIC_API_KEY` and `OPENWEATHERMAP_KEY` as env vars. |
| Database | Supabase | Free tier | Hosted Postgres. RLS enabled. Seed trips via SQL migration. |
