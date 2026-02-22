# TripChecklist MVP — UI/UX Specification

**Design companion to [PRD.md](PRD.md) and [TECHSPEC.md](TECHSPEC.md)**

---

## Design Principles

| Principle | Description |
|-----------|-------------|
| **Feel** | Warm confidence — the app feels crafted and trustworthy. Like a well-organized travel companion, not a bare utility. Reduces travel anxiety by showing clear progress. |
| **Visual** | Container-driven. Hierarchy via tonal layering (warm background tones), thin borders, and rounded cards — reinforced by typography weight, size, and spacing. Brand green used for progress, completion, checked states, and positive text actions. |
| **Target** | Mobile-only (375–430px). No tablet/desktop breakpoints for MVP. |
| **Philosophy** | Every element earns its place by adding warmth, clarity, or delight. Cards group related content. Color zones separate functional areas. |

**Surviving chrome** — elements that need explicit justification beyond the card system:

| Element | Why it survives |
|---------|----------------|
| Progress bar (3px, accent fill, rounded caps) | Only at-a-glance completion indicator; typography cannot communicate a continuous percentage |
| View toggle underline (3px, accent) | Two adjacent text labels need a state indicator beyond muted-vs-not color difference |
| Sparkle emoji (✨) | AI content provenance — one Unicode character, not a badge or icon component |
| Booking chip (📎, accent-outlined) | Three tap targets on one row (checkbox, name, chip) need visual differentiation |
| Backdrop overlay (`Elevation.backdrop`) | Functional — blocks base interaction while sheet is open, not decorative |
| Text actions (`Accent text` color) | Accept, Retry, + New category — accent text reinforces actionability without adding button chrome |
| Suggestion dividers (`Border` inside card) | Multiple suggestions in one card need visual separation for scannability |

---

## Color Tokens

```
Background:       #F5F3EE  (warm cream canvas)
Surface:          #FFFFFF  (card white)
Surface tinted:   #F0F9F4  (subtle green tint — suggestion cards, completion feedback)
Text:             #1C1C1E  (primary — iOS-style near-black)
Text muted:       #5C5650  (warm gray secondary — WCAG 4.5:1 on Surface and Accent soft)
Text hint:        #767069  (ghost text — WCAG 4.5:1 on Surface; placeholders only)
Border:           #E8E4DE  (warm border — card edges, dividers)
Border tinted:    #D4E8DC  (green-tinted border — card-tinted edges)
Accent:           #35A76E  (brand green — fills, progress bar, checkbox, underline)
Accent text:      #217A4B  (brand green for text — WCAG 4.5:1 on Surface, Background, and Surface tinted)
Accent soft:      #E8F5EE  (light green wash — checked row backgrounds, selected toggles)
Checked:          #35A76E
Unchecked:        #D1CEC8  (warm soft outline)
Danger:           #C5291F  (delete actions — WCAG 4.5:1 on Surface)
```

## Typography

System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`). All numeric displays (progress fractions, category counts) use `font-variant-numeric: tabular-nums` for stable alignment.

**Text overflow:** All single-line content (item names, trip names, category names, day headers) use `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`. Full text is always visible in the bottom sheet when editing.

**Type scale:**

| Token | Size | Weight | Line-height | Additional | Used for |
|-------|------|--------|-------------|------------|----------|
| `title` | 20px | 700 | 1.3 | | App title, trip name in checklist header |
| `focus` | 18px | 600 | 1.3 | | Editable content under attention (bottom sheet item name) |
| `heading` | 16px | 600 | 1.4 | | Section/category/day headers, trip name in list |
| `body` | 16px | 400 | 1.4 | | Item labels, suggestion item names |
| `body` + muted | 16px | 400 | 1.4 | `Text muted` color | Checked item text |
| `caption` | 14px | 400 | 1.4 | `Text muted` color | Dates, counts, sub-headers, ghost text, reasoning, toggle labels |
| `micro` | 12px | 500 | 1.3 | uppercase, `letter-spacing: 0.05em`, `Text` color (not muted) | Structural labels |

## Spacing

Base unit: **4px**. All layout spacing derives from this grid.

| Token | Value | Base | Used for |
|-------|-------|------|----------|
| `space-xs` | 4px | 1× | Tight internal gaps |
| `space-sm` | 8px | 2× | Inline element gaps (icon-to-text, button padding) |
| `space-md` | 12px | 3× | Item gap (between checklist rows) |
| `space-lg` | 20px | 5× | Horizontal page padding |
| `space-xl` | 24px | 6× | Suggestion card gap |
| `space-2xl` | 32px | 8× | Section gap, trip-to-trip separation |

**Component-specific values** (not composable spacing tokens):

| Token | Value | Purpose |
|-------|-------|---------|
| `bar` | 3px | Progress bar thickness, view toggle underline — rounded caps (`border-radius: 2px`) |
| `touch-target-min` | 44px | Minimum interactive element height |

## Interaction States

Overlays compose across any surface color — no per-background variants needed.

| Token | Value | Purpose |
|-------|-------|---------|
| `state-pressed` | `rgba(0, 0, 0, 0.03)` | Tap feedback on tappable rows and areas |
| `state-pressed-accent` | `rgba(53, 167, 110, 0.08)` | Tap feedback on accent-colored text actions |
| `state-disabled-opacity` | `0.35` | Reduced opacity for disabled elements |

**Application rules:**

| Element | Pressed | Disabled |
|---------|---------|----------|
| Trip card | Card background shifts to `Background` (#F5F3EE) | — |
| Checklist item row | Full-row `state-pressed` tint | — |
| Checked item row | `Accent soft` (#E8F5EE) background (persistent, not just on press) | — |
| Checkbox | Scale to 0.95 + `state-pressed` | `state-disabled-opacity` |
| Text action (Accept, Dismiss, Retry, Delete) | `state-pressed-accent` behind text | `state-disabled-opacity` + muted color |
| Day card header (collapse toggle) | `state-pressed` tint on header row | — |
| Stepper +/− buttons | `state-pressed` tint on button area | `state-disabled-opacity` (e.g., − at quantity 1) |
| "Assign to" picker items | `state-pressed` tint on tap | — |

## Focus States

All interactive elements must show a visible focus indicator for keyboard and switch control users.

| Token | Value | Purpose |
|-------|-------|---------|
| `focus-ring` | `2px solid Accent text` | Visible outline on focused interactive elements |
| `focus-offset` | `2px` | Offset from element edge to avoid overlap |

**Rules:**
- Focus ring appears only on keyboard/switch navigation (`:focus-visible`), not on pointer clicks
- Applied to: checkboxes, text actions, day collapse toggles, view toggle, stepper buttons, "Assign to" picker, bottom sheet controls, trip cards
- Focus ring color uses `Accent text` for sufficient contrast on both Background and Surface
- Use `outline` with `outline-offset: 2px` (not `box-shadow`) to avoid clipping inside cards with `overflow: hidden`. Cards containing interactive children must not clip outlines (`overflow: visible` or `overflow: clip` with sufficient padding).

## Motion

**Principles:**

1. **Silence first** — no animation unless it communicates spatial relationship or state change
2. **Match the trigger** — tap-triggered motions use ease-out
3. **Never block** — all animations are non-blocking; user can interact immediately

**Tokens:**

| Token | Value | Used for |
|-------|-------|----------|
| `duration-quick` | 150ms | State changes: fade, checkbox fill, press feedback |
| `duration-normal` | 250ms | Spatial changes: slide-in, collapse/expand, sheet entry |
| `easing-default` | `cubic-bezier(0.25, 0.1, 0.25, 1.0)` | Near-linear ease-out for tap-triggered motion |
| `easing-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Reserved for future gesture-driven interactions |

**Animation catalog:**

| Animation | Duration | Easing | Behavior |
|-----------|----------|--------|----------|
| Checkbox fill | `duration-quick` | `easing-default` | Color transition: unchecked → accent |
| Item fade-in (add) | `duration-quick` | `easing-default` | Opacity 0 → 1 |
| Item fade-out (dismiss/delete) | `duration-quick` | `easing-default` | Opacity 1 → 0 |
| Suggestion slide-in (accept) | `duration-normal` | `easing-default` | Translate Y from 8px above + fade in at target position |
| Section collapse/expand | `duration-normal` | `easing-default` | Height transition with overflow clip; preserves scroll offset |
| View toggle cross-fade | `duration-quick` | `easing-default` | Simultaneous fade-out old / fade-in new |
| Bottom sheet entry | `duration-normal` | `easing-default` | Translate Y from bottom + backdrop fade |
| Bottom sheet dismiss | `duration-normal` | `easing-default` | Slide down + backdrop fade out |
| Progress bar update | `duration-normal` | `easing-default` | Width transition |
| Banner count change | `duration-quick` | `easing-default` | Number cross-fade |

**Accessibility:** When `prefers-reduced-motion` is active, all `duration-*` tokens collapse to `0ms`.

## Elevation

Elevation is communicated through **tonal contrast + borders** — white cards on warm cream create visual depth without shadows.

| Layer | z-index | Visual treatment |
|-------|---------|------------------|
| `base` | 0 | Background (`#F5F3EE`) — warm cream page canvas |
| `card` | auto | Surface (`#FFFFFF`), `border: 1px solid #E8E4DE`, `border-radius: 12px` |
| `card-tinted` | auto | Surface tinted (`#F0F9F4`), `border: 1px solid Border tinted`, `border-radius: 12px` |
| `backdrop` | 99 | `rgba(0, 0, 0, 0.3)` — behind sheet, blocks base interaction |
| `sheet` | 100 | Surface (`#FFFFFF`), `border-radius: 16px 16px 0 0` |

**Rules:**
- Cards are the primary grouping mechanism — each category, each trip row, and the suggestion banner are cards
- The white-on-cream contrast is the primary depth cue; no box-shadows
- Only one overlay open at a time (MVP has only the bottom sheet and the "Assign to" full-sheet picker)
- Backdrop is tappable (dismisses sheet)
- Base content scroll locked while sheet is open
- Sheet height: fixed ~65% of viewport. Internal content scrollable. Safe-area insets respected at bottom.

---

## Screen Flow

```
Trip List (entry) ──► Checklist (main)
       ◄──── (← back)
```

Two screens total. No deep navigation. Item editing via bottom sheet overlay.

---

## Screen 1: Trip List

Entry point. Simple vertical list of 2–3 hardcoded sample trips. Each trip is a `card` on the warm cream canvas.

```
┌─────────────────────────────────────┐  ← Background (#F5F3EE)
│                                     │
│  TripChecklist                      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │  ← card (Surface, Border, 12px radius)
│  │  Tokyo Summer Trip    12/20 │    │
│  │  Jul 15–20 · 2 travelers   │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  Bali Retreat               │    │
│  │  Dec 1–8 · 1 traveler      │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  NYC Weekend Getaway        │    │
│  │  Nov 7–9 · 2 travelers     │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

**Details:**
- Each trip is a `card` — Surface background, `Border` outline, `border-radius: 12px`
- Card internal padding: `space-md` (12px)
- Trip name (`heading`) + dates and traveler count below (`caption`)
- Progress fraction (e.g., "12/20") right-aligned on the name line — only shown if the trip has checked items. Untouched trips show no fraction.
- No chevron (›) — the whole card is tappable. No explicit navigation affordance needed.
- `space-md` (12px) gap between cards
- App title "TripChecklist" (`title`) sits at top-left on the cream canvas with generous space below. No header bar or background.
- Tap feedback: card background shifts to `Background` (#F5F3EE) — the cream bleeds through subtly

---

## Screen 2: Checklist

Single screen with these zones (top to bottom):

### Header

The header is a full-width `card` zone — white surface with `Border` bottom edge — that **sticks to the top** as checklist content scrolls beneath it (`position: sticky; top: 0; z-index: 10`).

```
┌─────────────────────────────────────┐
│  ┌─────────────────────────────┐    │  ← header card (full-width,
│  │                             │    │     border-bottom only)
│  │  ←  Tokyo Summer Trip       │    │
│  │      Jul 15–20 · 2 travelers│    │
│  │                             │    │
│  │      12 of 20               │    │
│  │      ━━━━━━━━━━━━━━░░░░░░░  │    │  ← 3px thick, rounded caps
│  │                             │    │
│  │           Category    Day   │    │  ← view toggle inside header
│  │           ────────          │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │  ← Background (#F5F3EE) below
│  (checklist content scrolls here)   │
│                                     │
└─────────────────────────────────────┘
```

- Back arrow (←) as a simple icon/text, no container
- Trip name (`title`) on the same line as back arrow
- Trip dates + traveler count (`caption`), indented under title
- "X of Y" text (`caption`) — no "packed" label, context is obvious
- Progress bar: **3px** thickness with `border-radius: 2px` (rounded caps), full-width. Warm `Border` track (`#E8E4DE`) behind `Accent text` fill. More tactile and satisfying than hairline.
- Header surface: `Surface` background with `Border` bottom edge only (no side/top radius — spans full width)

### View Toggle

Lives inside the header card, right-aligned below the progress bar.

```
                Category    Day
                ────────
```

- Two text labels (`caption`) side by side, right-aligned
- Active label: regular weight text + **3px** `Accent text` underline (matches progress bar thickness)
- Inactive label: `Text muted`, no underline
- No pill, segment container, or background box — just text and underline
- Tap target: full word + padding (`touch-target-min` height)
- View toggle cross-fade (`duration-quick`, `easing-default`)
- Scroll position persisted per view — switching from Category to Day and back preserves each view's scroll offset

### AI Suggestions Banner

Uses the `card-tinted` surface — green-tinted card that visually communicates "AI-generated content" without explanation.

**Collapsed (default):**
```
  ┌───────────────────────────────┐
  │  ✨ 3 suggestions          ▾  │  ← card-tinted (#F0F9F4, border #D4E8DC)
  └───────────────────────────────┘     border-radius: 12px
```

**Expanded (tap banner):**
```
  ┌───────────────────────────────┐
  │  ✨ 3 suggestions          ▴  │  ← card-tinted
  │                               │
  │  Rain jacket                  │
  │  Clothing · Rain on Day 3    │
  │                Accept  Dismiss│
  │                               │
  │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │  ← thin Border divider
  │                               │
  │  Sunscreen                    │
  │  Toiletries · UV 8+ all week │
  │                Accept  Dismiss│
  │                               │
  │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
  │                               │
  │  Power bank                   │
  │  Electronics · Long day trips │
  │                Accept  Dismiss│
  │                               │
  └───────────────────────────────┘
```

**Behavior:**
- Expanded on first visit to a trip (maximizes AI feature discovery); collapsed by default on subsequent visits.
- "✨ N suggestions" — short label. The ✨ sparkle is the sole visual marker for AI content. Wrap in `<span aria-label="AI suggested">✨</span>` for screen readers.
- ▾/▴ small triangle indicator for expand/collapse state
- Each suggestion: item name (`body`), category · reasoning inline (`caption`, separated by middle dot ·), "Accept" (`Accent text`) and "Dismiss" (`Text muted`) as `<button>` elements styled as text — no boxed buttons
- Thin `Border` dividers between suggestions inside the card for scannability
- Accept → item fades from banner (`duration-quick`), appears in correct category with slide-in (`duration-normal`). Banner count decreases.
- Dismiss → suggestion fades out (`duration-quick`). Count decreases.
- When 0 suggestions remain → banner disappears entirely
- No suggestions available → banner hidden (not rendered)
- Loading state: "✨ Getting suggestions..." (`caption` italic, no animation) — shown in `card-tinted`
- Error state: "✨ Suggestions unavailable · Retry" (Retry in `Accent text`, tappable) — shown in `card-tinted`
- Auto-triggered on first visit to a trip

### Category View (Default)

Each category is an individual `card` on the warm cream canvas.

```
  ┌───────────────────────────────┐
  │  Clothing               3/5  │  ← card header row
  │                               │
  │  ☐  Shorts (2)               │
  │  ☐  Light jacket             │
  │  ☑  T-shirts (3)        ░░░  │  ← checked: Accent soft bg (#E8F5EE)
  │  ☑  Underwear (5)       ░░░  │
  │  ☑  Swimsuit            ░░░  │
  │                               │
  │  Add item                     │  ← Text hint color
  └───────────────────────────────┘

  ┌───────────────────────────────┐
  │  Documents               2/2  │
  │                               │
  │  ☑  Passport             ░░░  │
  │  ☑  Travel insurance     ░░░  │
  │                               │
  │  Add item                     │
  └───────────────────────────────┘

  ┌───────────────────────────────┐
  │  Toiletries              0/3  │
  │                               │
  │  ☐  Sunscreen                 │
  │  ☐  Toothbrush               │
  │  ☐  Shampoo                  │
  │                               │
  │  Add item                     │
  └───────────────────────────────┘

  ...more categories...

  + New category                      ← on cream canvas, outside cards
```

**Details:**
- Each category is a `card` — Surface background, `Border` outline, `border-radius: 12px`
- `space-md` (12px) gap between category cards
- Header: category name (`heading`) + fraction count right-aligned (`caption`)
- Items: single-line rows — checkbox + item name (`body`) + quantity in parentheses when > 1
- Quantity hidden when 1 (show "Swimsuit" not "Swimsuit (1)")
- Items with a booking link: 📎 chip right-aligned on the item row (tappable, `Accent text`-outlined)
- Checked items: `Checked` checkbox fill, `body` + muted text (no strikethrough — stays readable), **`Accent soft` (#E8F5EE) row background** — subtle green wash makes completion feel rewarding
- Checked items sort to bottom of their category section (unchecked items rise to top)
- "Add item" as ghost placeholder text in `Text hint` color at bottom of each category card. Tap to activate as text field. Type name, press enter → item created with quantity 1.
- Tap item name → opens bottom sheet for editing (see Item Detail section)
- Tap checkbox → toggles check state (does not open bottom sheet)
- Empty category: "No items yet" `Text muted` + "Add item" ghost text visible inside the card
- "+ New category" link (`caption`, "+" in `Accent text`) sits **outside** any card, on the cream canvas, at the bottom of all category cards

### Custom Categories

- **"+ New category"** link (`caption`, "+" in `Accent text`) on the cream canvas below all category cards
- Tap → inline text field appears on the canvas. Type category name, press enter → new category card created
- 10 default categories always shown as cards (even when empty)
- Custom categories persist until explicitly deleted
- Long-press on a custom category card header → delete option (only for custom categories, not defaults)
- Deleting a custom category moves its items to "Miscellaneous"
- In item detail bottom sheet, category dropdown shows: 10 defaults + any custom categories + "New category..." option at bottom
- AI suggestions only use the 10 canonical categories (custom categories are user-only)

### Day/Activity View

Each day is a `card` on the warm cream canvas. Items appear under their assigned day or activity.

```
  ┌───────────────────────────────┐
  │  ▾ Day 1                2/4  │  ← day card
  │                               │
  │  ☐  Travel adapter       📎  │  ← assigned to Day 1 (no activity)
  │                               │
  │    Airport Transfer           │  ← activity sub-header
  │    ☑  Passport           ░░░  │  ← assigned to this activity
  │    ☐  Booking confirmation 📎 │
  │                               │
  │    Hotel Check-in             │
  │    ☑  Toiletries bag     ░░░  │
  │                               │
  └───────────────────────────────┘

  ┌───────────────────────────────┐
  │  ▾ Day 2                0/3  │
  │                               │
  │    Senso-ji Visit             │
  │    ☐  Comfortable shoes       │
  │    ☐  Camera                  │
  │    ☐  Water bottle            │
  │                               │
  └───────────────────────────────┘

  ┌───────────────────────────────┐
  │  ▾ General              6/8  │  ← unassigned items
  │                               │
  │    ☑  Underwear (5)      ░░░  │
  │    ☑  T-shirts (3)       ░░░  │
  │    ☐  Shorts (2)              │
  │    ...                        │
  │                               │
  └───────────────────────────────┘
```

**Details:**
- Each day is a `card` — same Surface/Border/radius as category cards
- Day headers: "Day N" (`heading`) + fraction count right-aligned (`caption`). Theme (e.g., "Day 1 · Arrival") shown only if trip data provides a theme for that day.
- Collapsible day cards with ▾/▸ toggle on header row
- Items assigned to a day (via "Assign to" picker in bottom sheet) appear directly under the Day header, before any activity sub-headers
- Items assigned to a specific activity appear under that activity's sub-header
- Activity names as sub-headers (`caption`, slightly indented)
- Items: single-line rows (same as category view). Checkbox + name + optional quantity + optional 📎 booking chip right-aligned.
- Booking chip (📎) appears on items with a `booking_link`, same behavior as in Category view
- Checked items: `Accent soft` row background + muted text (same as category view), sorted to bottom within each group
- "General" card at bottom for items with no day or activity assignment (null `assigned_day` and null `activity_ref`)
- No add-item field in Day view (add items in Category view, then assign via bottom sheet). Day view shows hint: "Add items in Category view" (`caption`, `Text muted`) inside an empty day card.
- Item assignment is user-controlled via the "Assign to" picker in the bottom sheet (see Item Detail section)
- Checking/unchecking updates the same item across both views (single source of truth)

---

## Item Detail — Bottom Sheet

Opens when user taps an item name (not checkbox, not booking chip). Fixed-height sheet (~65% viewport) slides up from bottom.

```
┌─────────────────────────────────────┐
│            (backdrop 0.3)           │
│                                     │
│  ┌─────────────────────────────┐    │  ← border-radius: 16px 16px 0 0
│  │                             │    │
│  │  T-shirts                   │    │
│  │                             │    │
│  │  Quantity        ─  3  +    │    │
│  │                             │    │
│  │  Assign to       Day 1   › │    │  ← taps to open full-sheet picker
│  │                             │    │
│  │  Category        Clothing ▾ │    │
│  │                             │    │
│  │  View booking →             │    │
│  │                             │    │
│  │  Delete item                │    │
│  │                             │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**"Assign to" picker** — opens as a full-sheet overlay replacing the item detail sheet:
```
┌─────────────────────────────────┐
│  ← Back         Assign to      │
│                                 │
│  DAY 1                          │  ← section header (micro)
│  ● Day 1 (general)             │  ← selected (Accent soft bg)
│     ○  Airport Transfer         │  ← activity under Day 1
│     ○  Hotel Check-in           │
│                                 │
│  DAY 2                          │
│  ○  Day 2 (general)            │
│     ○  Senso-ji Visit           │
│     ○  Tsukiji Market           │
│                                 │
│  DAY 3                          │
│  ○  Day 3 (general)            │
│     ○  Temple Tour              │
│                                 │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│  ○  Clear assignment            │  ← unassigns (→ General)
└─────────────────────────────────┘
```

**Details:**
- Sheet `border-radius: 16px 16px 0 0` — slightly more rounded than cards for a softer feel
- Fixed height (~65% of viewport). Internal content scrollable. Safe-area insets respected at bottom.
- Item name: editable text field (`focus`). Tap to edit.
- Quantity stepper: minus / value / plus. Minimum 1. Minus disabled at 1 (`state-disabled-opacity`).
- **Assign to** — full-sheet picker (navigates away from item detail sheet):
  - Shows current assignment label (e.g., "Day 1", "Airport Transfer") or "None" when unassigned
  - Tapping opens a full-sheet list grouped by day with nested activities (activities indented, `caption` style)
  - Selecting a **day**: item assigned to that whole day, not a specific activity
  - Selecting an **activity**: item assigned to that activity (implies its day, but binding is to the activity)
  - **"Clear assignment"** option at bottom — removes day/activity assignment (item becomes General)
  - No "General" as an explicit option — clearing assignment = General
  - Selected item highlighted with `Accent soft` background
  - Selecting any option auto-navigates back to item detail sheet
  - Item can be assigned to ONE day or ONE activity, not both (mutually exclusive)
  - Back button (←) returns to item detail sheet without changing assignment
- Category dropdown: 10 defaults + custom categories + "New category..." at bottom of dropdown
- "View booking →" link (`Accent text`): shown only when item has a `booking_link`. Tapping opens mock deep link (MVP: navigates to placeholder URL or shows toast).
- "Delete item" text link (`Danger`) at bottom of sheet
- `Elevation.backdrop` behind sheet. Tap backdrop to dismiss.
- Changes auto-save as user interacts — no save/cancel buttons
- Sheet entry: `duration-normal`, `easing-default`. Dismiss: tap backdrop or press Escape.

---

## Interactions

| Interaction | Behavior |
|---|---|
| Check item | Checkbox fills `Checked` (`duration-quick`). Text becomes muted. Row gets `Accent soft` background. Item sorts to bottom of section. Progress bar updates (`duration-normal`). |
| Uncheck item | Reverses above. `Accent soft` background removed. Item moves back to top group. |
| Tap item name | Opens bottom sheet for editing (name, quantity, assign to day/activity, category, booking link, delete). |
| Tap booking chip (📎) | Opens mock deep link. MVP: navigates to placeholder URL or shows toast "Booking links coming soon." |
| Accept suggestion | Suggestion fades from banner (`duration-quick`). Item appears in correct category card with slide-in (`duration-normal`). Banner count decreases. |
| Dismiss suggestion | Suggestion fades out (`duration-quick`). Banner count decreases. At 0 remaining, banner hides. |
| Add item (enter) | New item at bottom of category card with fade-in (`duration-quick`). Default: quantity 1, no assignment (General). |
| Add custom category | "+ New category" on cream canvas below cards. Inline text field → new category card appears. |
| Delete custom category | Long-press on custom category card header → delete. Items moved to Miscellaneous. |
| Assign to day/activity | In bottom sheet, tap "Assign to" to open full-sheet picker. Select day or activity. Item moves to corresponding day card in Day view. Clearing assignment returns item to General. |
| Collapse/expand day card | ▾/▸ toggle on day card header (Day view only). Items slide up/down (`duration-normal`). Card collapses to single-line. Fraction count visible when collapsed. |
| Switch view toggle | Cross-fade between Category and Day views (`duration-quick`). |
| Delete item | Tap "Delete item" in bottom sheet → item removed, sheet closes. |
| Navigate back | ← arrow or swipe-back gesture. Checklist state persists (saved to Supabase). |

---

## Accessibility

### Semantic HTML & ARIA

| Element | Implementation | Notes |
|---------|---------------|-------|
| Day card collapse toggles (▾/▸) | `<button aria-expanded="true/false">` | Day view only; announces open/closed state to screen readers |
| Progress bar | `<div role="progressbar" aria-valuenow={checked} aria-valuemax={total}>` | Screen readers announce "X of Y complete" |
| Accept / Dismiss / Retry | `<button>` elements (not links) | Announced as actionable controls; invisible padding to meet `touch-target-min` |
| Delete item | "Delete item" text action in bottom sheet | Primary delete path; no swipe gesture in MVP |
| Checklist items | `<input type="checkbox">` with associated `<label>` | Standard form semantics |
| View toggle | `role="tablist"` with `role="tab"` children, `aria-selected` | Announces active view to screen readers |
| Bottom sheet | `role="dialog" aria-modal="true" aria-label="Edit item"` | Focus trapped while open; backdrop click or Escape dismisses |
| "Assign to" picker | `role="dialog" aria-modal="true" aria-label="Assign to day"` with `role="radiogroup"` inside | Full-sheet picker; activities grouped under day headings; `aria-checked` on current selection |

### Touch Targets

All interactive text (Accept, Dismiss, Retry, Add item, + New category, view toggle labels, stepper buttons, "Assign to" picker items) must meet `touch-target-min` (44px) via padding even when visual size is smaller. Use invisible padding to expand hit areas without affecting layout.

---

## Responsive Behavior

| Viewport | Treatment |
|---|---|
| **375–430px** | Design target. Full-width content, `space-lg` horizontal padding. |
| **431px+** | Same mobile layout, centered with `max-width: 430px`. Warm cream (`#F5F3EE`) background behind. No adaptation. |

Mobile-only for MVP. No tablet or desktop breakpoints.

---

## Empty & Loading States

| State | Treatment |
|---|---|
| First visit to trip | All default category cards shown empty with "Add item" ghost text (`Text hint`). AI suggestions auto-triggered. |
| AI loading | `card-tinted` banner: "✨ Getting suggestions..." (`caption` italic, no animation). |
| AI failure | `card-tinted` banner: "✨ Suggestions unavailable · Retry" (Retry in `Accent text`, tappable). |
| AI returns 0 suggestions | Banner hidden entirely. |
| No items in category | "No items yet" `Text muted` + "Add item" ghost text (`Text hint`) visible inside category card. |
| No suggestions | Banner not rendered. |
| Empty day (Day view) | Day card visible with "0/0" count. "Add items in Category view" hint (`Text muted`) inside card. |
