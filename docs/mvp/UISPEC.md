# TripChecklist MVP — UI/UX Specification

**Design companion to [PRD.md](PRD.md) and [TECHSPEC.md](TECHSPEC.md)**

---

## Design Principles

| Principle | Description |
|-----------|-------------|
| **Feel** | Calm & organized — reduces travel anxiety by showing clear progress |
| **Visual** | Monochrome + one accent color. Paper-like. System font stack. |
| **Target** | Mobile-only (375–430px). No tablet/desktop breakpoints for MVP. |
| **Philosophy** | Show information on demand. Keep the default view minimal. |

---

## Color Tokens

```
Background:  #FAFAFA  (warm white)
Surface:     #FFFFFF
Text:        #1A1A1A  (primary)
Text muted:  #666666  (secondary)
Border:      #E5E5E5
Accent:      #35A76E  (green)
Checked:     #35A76E
Unchecked:   #E5E5E5
Danger:      #DC2626  (delete actions)
```

Typography: system font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`)
Spacing: generous (16–24px gaps), 16px horizontal padding

---

## Screen Flow

```
Trip List (entry) ──► Checklist (main)
       ◄──── (← back)
```

Two screens total. No deep navigation. No modals (item editing is inline).

---

## Screen 1: Trip List

Entry point. Simple vertical list of 2–3 hardcoded sample trips.

```
┌─────────────────────────────────────┐
│                                     │
│  TripChecklist                      │
│                                     │
│  Your trips                         │
│                                     │
│ ─────────────────────────────────── │
│  Tokyo Summer Trip         12/20 ›  │
│  Jul 15–20 · 2 travelers           │
│ ─────────────────────────────────── │
│  Bali Retreat                   ›   │
│  Dec 1–8 · 1 traveler              │
│ ─────────────────────────────────── │
│  NYC Weekend Getaway            ›   │
│  Nov 7–9 · 2 travelers             │
│ ─────────────────────────────────── │
│                                     │
└─────────────────────────────────────┘
```

**Details:**
- Each row: trip name (semibold) + chevron (›), dates + traveler count (muted text)
- If a trip has progress, show subtle fraction (e.g., "12/20") right-aligned
- Tap anywhere on the row → navigate to that trip's Checklist
- No images, no cards — just clean list rows with generous spacing

---

## Screen 2: Checklist

Single screen with these zones (top to bottom):

### Header

```
┌─────────────────────────────────────┐
│  ← Tokyo Summer Trip                │
│  Jul 15–20 · 2 travelers            │
│  12 of 20 packed                    │
│  ████████████████░░░░░░░░░░         │
└─────────────────────────────────────┘
```

- Back arrow (←) + trip name
- Trip dates + traveler count (muted)
- "X of Y packed" text + full-width progress bar (accent #35A76E fill)

### View Toggle

```
              ┌──────┬──────┐
              │ ▦▦   │ 1│2│3│
              └──────┴──────┘
               active
```

- Segmented control (pill toggle) with two **custom SVG icons**:
  - **Category view**: clustered grid blocks (small squares grouped by type — represents categorized groups)
  - **Day view**: connected calendar squares (sequential day cells |1|2|3| — represents daily itinerary)
- Both icons always visible. Active icon has accent (#35A76E) background with white fill. Inactive is muted.
- Custom SVG icons designed to match the app's minimal aesthetic (not emoji or icon library)
- Positioned right-aligned in header area or below progress bar

### AI Suggestions Banner

**Collapsed (default):**
```
┌─────────────────────────────────┐
│ ✨ 3 suggestions available    ▼ │
└─────────────────────────────────┘
```

**Expanded (tap banner):**
```
┌─────────────────────────────────┐
│ ✨ 3 suggestions available    ▲ │
│                                 │
│  Rain jacket  [Clothing]        │
│  Rain forecast on Day 3         │
│  [✓ Accept]  [✗ Dismiss]        │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  Sunscreen  [Toiletries]        │
│  UV index 8+ all week           │
│  [✓ Accept]  [✗ Dismiss]        │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  Power bank  [Electronics]      │
│  Long day trips Day 2, 4        │
│  [✓ Accept]  [✗ Dismiss]        │
└─────────────────────────────────┘
```

**Behavior:**
- Collapsed by default as a single-line banner
- Tap to expand → shows compact suggestion cards inline
- Each card: item name, `[Category]` badge, one-line AI reasoning, `[✓ Accept]` `[✗ Dismiss]` buttons
- Accept → item added to correct category, card removed, count decreases
- Dismiss → card fades out, count decreases
- When 0 suggestions remain → banner disappears entirely
- No suggestions available → banner hidden (not shown with 0 count)
- Loading state: banner shows "Getting personalized suggestions..." with subtle animation
- Auto-triggered on first visit to a trip

### Category View (Default)

```
┌─────────────────────────────────────┐
│  Clothing                      3/5  │
│  ☑ T-shirts (3)                     │
│  ☐ Shorts (2)                       │
│  ☐ Light jacket (1)                 │
│  ☑ Underwear (5)                    │
│  ☑ Swimsuit (1)                     │
│  ┌─────────────────────────┐        │
│  │ + Add item...           │        │
│  └─────────────────────────┘        │
│                                     │
│  Documents                     2/2  │
│  ☑ Passport                         │
│  ☑ Travel insurance                 │
│  ┌─────────────────────────┐        │
│  │ + Add item...           │        │
│  └─────────────────────────┘        │
│                                     │
│  ...more categories...              │
│                                     │
│  + New Category                     │
│                                     │
└─────────────────────────────────────┘
```

**Details:**
- Categories as collapsible sections
- Header: category name + fraction count (3/5). Tap header to collapse/expand.
- Items: checkbox + item name + quantity in parentheses
- Checked items: accent (#35A76E) checkbox, muted text (no strikethrough — item name stays readable)
- Inline "Add item..." field at bottom of each category section
- Type name, press enter → item created in that category with quantity 1
- New item shows subtle expand arrow (▼) to set quantity, priority, day mapping
- Swipe left on item → reveals red delete action
- Empty default category: "No items yet" muted text + add field visible

### Custom Categories

- **"+ New Category"** link at the bottom of all category sections
- Tap → inline text field appears. Type category name, press enter → new section created
- 10 default categories always shown (even when empty)
- Custom categories also persist until explicitly deleted
- Swipe left on a custom category header → delete option (only available for custom categories, not defaults)
- Deleting a custom category moves its items to "Miscellaneous"
- In item detail expand, category dropdown shows: 10 defaults + any custom categories + "New category..." option at bottom
- AI suggestions only use the 10 canonical categories (custom categories are user-only)

### Day/Activity View

```
┌─────────────────────────────────────┐
│  Day 1: Arrival              2/4    │
│ ─────────────────────────────────── │
│  Airport Transfer                   │
│    ☑ Passport                       │
│    ☐ Travel adapter                 │
│  Hotel Check-in                     │
│    ☐ Booking confirmation           │
│    ☑ Toiletries bag                 │
│                                     │
│  Day 2: Temple Tour          0/3    │
│ ─────────────────────────────────── │
│  Senso-ji Visit                     │
│    ☐ Comfortable shoes              │
│    ☐ Camera                         │
│    ☐ Water bottle                   │
│                                     │
│  General (no specific day)    6/8   │
│ ─────────────────────────────────── │
│    ☑ Underwear (5)                  │
│    ☑ T-shirts (3)                   │
│    ☐ Shorts (2)                     │
│    ...                              │
│                                     │
└─────────────────────────────────────┘
```

**Details:**
- Flat grouped list structure (same visual language as Category view)
- Day headers: "Day N: Theme" + fraction count (2/4)
- Activity names as sub-headers (muted weight, slightly indented)
- Items listed under their activity
- "General" section at bottom for items not mapped to specific days
- No add-item field in Day view (add items in Category view, then assign day via inline expand)
- Checking/unchecking updates the same item across both views (single source of truth)

---

## Interactions

| Interaction | Behavior |
|---|---|
| Check item | Checkbox fills accent. Text becomes muted (no strikethrough). Progress bar updates. |
| Uncheck item | Reverses above. |
| Accept suggestion | Card removed from banner. Item appears in correct category. Banner count decreases. |
| Dismiss suggestion | Card fades out. Banner count decreases. At 0 remaining, banner hides. |
| Add item (enter) | New item at bottom of category with brief slide-in animation. |
| Expand item details | Inline expansion below item: category dropdown (defaults + custom + "New category..."), quantity stepper, day picker. |
| Add custom category | "+ New Category" at bottom of categories. Inline text field → new section appears. |
| Delete custom category | Swipe left on custom category header → delete. Items moved to Miscellaneous. |
| Collapse category | Items slide up, header stays visible. Fraction count visible when collapsed. |
| Switch view toggle | Cross-fade between Category and Day views. Instant, no page load. |
| Delete item (swipe) | Swipe left → red delete zone. Release to confirm. Item slides off-screen. |
| Navigate back | ← arrow or swipe-back gesture. Checklist state persists (saved to Supabase). |

---

## Responsive Behavior

| Viewport | Treatment |
|---|---|
| **375–430px** | Design target. Full-width content, 16px horizontal padding. |
| **431px+** | Same mobile layout, centered with `max-width: 430px`. White/neutral background behind. No adaptation. |

Mobile-only for MVP. No tablet or desktop breakpoints.

---

## Empty & Loading States

| State | Treatment |
|---|---|
| First visit to trip | All default categories shown empty with add fields. AI suggestions auto-triggered. |
| AI loading | Banner shows "Getting personalized suggestions..." with subtle animation. |
| AI failure | Banner shows "Suggestions unavailable" with retry link. |
| AI returns 0 suggestions | Banner hidden entirely. |
| No items in category | "No items yet" muted text + inline add field visible. |
| No suggestions | Banner not rendered. |
