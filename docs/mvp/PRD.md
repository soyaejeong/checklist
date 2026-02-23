# TripChecklist — AI-Powered Trip Checklist

**MVP Product Requirements Document**

| Owner | Timeline | Team | Status |
|-------|----------|------|--------|
| Solo developer | 1 week (AI-assisted via Claude Code) | 1 engineer, no designer | Draft |

---

## Problem Statement

Travelers preparing for a trip face two problems: they forget essential items, and existing checklist tools offer no intelligence about what is actually needed for their specific trip. Current solutions are either generic static templates (PackPoint, Packr) or afterthought features in travel super-apps (Triple, Stippl, Toki) — none of which connect items to specific days and activities.

---

## Solution

> **Given structured trip data and a user profile with preferences, AI generates smart checklist suggestions where every item is mapped to the day and activity where it's needed. Suggestions are personalized to the traveler and layered on top of any items the user has already added.**

Users can view items by category (for packing) or by day/activity (for preparation). The checklist is fully editable — users add their own items freely, and AI suggestions complement what's already on the list.

---

## Goals

- **G1:** Demonstrate that AI can generate useful, context-aware checklist items from trip data (stakeholder demo)
- **G2:** Validate the day/activity mapping as a differentiated UX (beta tester feedback)
- **G3:** Ship a working mobile web app in 1 week that is good enough to iterate on

## Non-Goals

- ~~Itinerary / schedule planning~~ — trip data is input, not built here
- ~~Budget tracking / expense management~~
- ~~User accounts / authentication~~ — no login screen for MVP (transparent anonymous auth used for data isolation)
- ~~Cross-device sync~~ — follow-up phase (shareable URL tokens)
- ~~Native mobile app~~ — mobile web only
- ~~Social features / community~~
- ~~Real booking transactions~~ — deep link UI shown but non-functional
- ~~Collaborative sharing~~ — follow-up phase
- ~~Re-suggest on itinerary change~~ — follow-up phase

---

## MVP Scope

### Input

**Trip data:** Hardcoded sample trip JSON payloads (2–3 trips covering different scenarios: domestic leisure, international adventure, business trip). No user input form in MVP.

**User profile:** Hardcoded sample user profiles paired with each trip. Each profile includes health/medical info, travel style, and item preferences that influence AI suggestions.

> See [TECHSPEC.md](TECHSPEC.md) for data model schemas, architecture, and API contracts.

### User Profile

The user profile is passed alongside the trip data to the AI engine. In MVP, profiles are hardcoded. Each profile includes:

- **Health/medical:** Allergies, medications, conditions
- **Travel style:** Active, relaxed, business, etc.
- **Must-have items:** Personal essentials regardless of trip type
- **Weather sensitivity:** How the user responds to temperature (e.g., "gets cold easily")

**How the AI uses the profile:**

- **Health/medical:** Suggests relevant medications, allergy meds, inhaler, first-aid items. Flags items critical to user's conditions (e.g., "Inhaler — you have mild asthma, essential for Hallasan high-altitude hike").
- **Travel style:** Adjusts suggestion volume and type. "Active" travelers get more gear suggestions; "relaxed" travelers get fewer, comfort-focused items.
- **Must-have items:** Always included in suggestions (if not already on the list). These are the user's personal essentials regardless of trip type.
- **Weather sensitivity:** Shifts clothing suggestions warmer/cooler. "Gets cold easily" → extra layers, thermal underwear even in mild forecasts.

### Checklist Model

A trip's checklist consists of **user-added items** and **AI-suggested items** coexisting in the same list. When the user opens a checklist page for a trip:

1. **Previously added items are loaded first** — items the user has already added (manually or from prior AI suggestions they accepted) are shown with their current checked/unchecked state.
2. **AI suggestions appear separately** — new suggestions from the AI are shown as pending recommendation cards, clearly distinguished from existing items. The AI is aware of what's already on the list to avoid duplicates.
3. **Accepted suggestions become regular items** — once the user accepts a suggestion, it joins the main checklist and behaves like any user-added item.

```
Checklist State
├── Existing Items (persisted)
│   ├── User-added items
│   └── Previously accepted AI suggestions
│   → Shown in main checklist with check/uncheck state
│
└── New AI Suggestions (pending)
    → Shown as recommendation cards
    → Accept → moves to Existing Items
    → Dismiss → hidden (stored as dismissed to avoid re-suggesting)
```

### AI Capabilities

| Capability | MVP | Detail |
|-----------|-----|--------|
| Generate checklist from trip + profile | **IN** | Takes trip data + user profile + existing items → returns categorized, day-mapped suggestions with reasoning. Personalizes based on health, travel style, and preferences. Avoids suggesting items already on the list. |
| Weather-aware suggestions | **IN** | Real weather forecast integrated into suggestions. Adjusted by user's weather sensitivity preference. |
| User profile personalization | **IN** | Must-have items always suggested. Health/medical items flagged as essential. Travel style adjusts suggestion volume and type. Weather sensitivity adjusts clothing recommendations. |
| Cultural context | **OUT** | Visa requirements, power adapter type, local customs. Follow-up — hardcode per sample trip if needed for demo. |
| Re-suggest on itinerary edit | **OUT** | Follow-up. MVP uses static trip data. |
| Smart quantities | **PARTIAL** | Basic quantity suggestions based on trip length. No laundry/reuse logic. |

**Key AI behavior:** The AI pipeline receives three inputs: the **trip data**, the **user profile**, and the **current checklist items**. This prevents duplicate suggestions, personalizes recommendations to the traveler's needs and preferences, and allows the AI to fill gaps — e.g., if the user already added "hiking boots" manually, the AI won't suggest it again but may suggest "hiking socks" or "trekking poles" as complementary items. Items in the user's must-have list are always suggested if not already present.

### Checklist Features

| Feature | MVP | Notes |
|---------|-----|-------|
| View: By Category | **IN** | Collapsible category groups (Clothing, Documents, Toiletries, Electronics, etc.) |
| View: By Day/Activity | **IN** | Timeline grouped by day. Each activity shows its mapped items. "General" section for all-day items. |
| Check / Uncheck items | **IN** | Toggle with progress tracking per category and per day. |
| Add / Edit / Delete items | **IN** | Manual CRUD. Inline editing. Delete button. User can assign category and day/activity when adding. |
| AI Suggestion cards | **IN** | AI items shown as accept/dismiss cards with reasoning preview. AI is aware of existing items. |
| Item quantities | **IN** | Quantity stepper per item. |
| Persist checklist state | **IN** | Items, check state, manual additions, and dismissed suggestions persisted via Supabase (PostgreSQL with RLS). Survives page refreshes and browser restarts. Cross-device sync available in future via account upgrade. |
| Booking deep link UI | **PARTIAL** | Link buttons rendered but non-functional (mock URLs). |
| Search / Filter | **OUT** | Follow-up. |
| Collaborative sharing | **OUT** | Follow-up. |
| Reusable templates | **OUT** | Follow-up. |

---

## Key User Flow

1. **User selects a sample trip** from the landing screen (e.g., "Jeju Island 4-day Adventure").
2. **Checklist page loads with any existing items** — if the user has previously added or accepted items, they appear immediately with their check state.
3. **User can manually add items at any time** — standard add flow with name, category, quantity, and optional day/activity assignment.
4. **User taps "Get AI Suggestions"** — triggers the AI pipeline with the trip data + user profile + current checklist. Loading state while AI processes.
5. **AI suggestions appear as cards** — clearly separated from existing items. Each card shows item name, category, day/activity, and reasoning. User accepts or dismisses each.
6. **User toggles between Category View and Day View** to pack and prepare.
7. **User checks off items** as they pack. Progress bar updates in real-time.

---

## Success Criteria

- **Working demo:** End-to-end flow from trip selection → existing items displayed → AI suggestion → checklist interaction is functional and presentable.
- **AI quality:** Suggestions are relevant, non-duplicative of existing items, correctly mapped to days/activities, and personalized to the user profile (health items appear for users with conditions, must-have items always present) for at least 2 out of 3 sample trips.
- **Day/Activity view works:** Users can clearly see which items belong to which day and why.
- **Persistence:** Checklist state persisted in Supabase. Items, check states, and dismissed suggestions survive page refreshes and browser restarts.
- **Mobile UX:** Usable and visually polished on mobile viewport (375px+).

---

## Follow-Up (Post-MVP)

| Phase | Feature | Description |
|-------|---------|-------------|
| v1.1 | Cross-device sync | Shareable URL tokens for accessing checklists across devices without auth. |
| v1.1 | Cultural context | AI suggests visa requirements, power adapters, local customs based on destination. |
| v2.0 | Collaborative sharing | Share checklist via link. Real-time sync with travel companions. |
| v2.0 | PWA offline support | Full offline capability with background sync. |

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM output inconsistency | Items poorly categorized or wrong day mapping | Schema validation on AI output. Few-shot examples. Manual QA on sample trips. |
| AI suggests duplicates of existing items | Annoying UX, erodes trust in AI | Pass existing items to AI pipeline. Post-process dedup before returning. |
| Weather API forecast limits | Free tier limited to 5-day forecast; trips may be further out | Cache responses. Fallback to weather notes embedded in trip data for distant trips. |
| 1-week timeline too tight | Incomplete features or poor polish | Cut search/filter and templates first. Focus: AI + two views + check/uncheck + persistence. |
| Supabase single-session | Anonymous auth ties data to one browser session | Acceptable for MVP demo — account upgrade is v1.1 follow-up. |
| Health data PII | Medical info in user profile used by AI | Health data stored in Supabase PostgreSQL with RLS. Each anonymous user can only access their own rows. Acceptable for demo with hardcoded sample data. Production requires formal privacy review. |
| LLM cost overrun | Uncapped AI calls during demo | Cache suggestions per trip. Limit suggestion requests per session. |
