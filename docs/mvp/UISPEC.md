# TripChecklist MVP — UI/UX Specification

**Design companion to [PRD.md](PRD.md) and [TECHSPEC.md](TECHSPEC.md)**

---

## Design Principles

| Principle | Description |
|-----------|-------------|
| **Feel** | Quiet confidence — the app recedes so the trip stands out. Reduces travel anxiety by showing clear progress. |
| **Visual** | Typography-driven. Hierarchy via weight, size, and spacing — not borders, shadows, or chrome. Brand green (#35A76E) used sparingly for progress and completion only. |
| **Target** | Mobile-only (375–430px). No tablet/desktop breakpoints for MVP. |
| **Philosophy** | Subtract until it breaks. Every border, divider, and visual element must justify its existence. Show information on demand. |

**Surviving chrome** — elements that break "subtract until it breaks" with explicit justification:

| Element | Why it survives |
|---------|----------------|
| Progress bar (`hairline`, accent fill) | Only at-a-glance completion indicator; typography cannot communicate a continuous percentage |
| View toggle underline (`hairline`, accent) | Two adjacent text labels need a state indicator beyond muted-vs-not color difference |
| Suggestion banner border (`Border` token) | Zone separation between header and checklist content; barely perceptible on `Background` |
| Sparkle emoji (✨) | AI content provenance — one Unicode character, not a badge or icon component |
| Booking chip (📎, accent-outlined) | Three tap targets on one row (checkbox, name, chip) need visual differentiation |
| Drag handle (`space-2xl` × `space-xs`) | iOS convention for swipe-to-dismiss affordance; minimum gesture hint |
| Backdrop overlay (`Elevation.backdrop`) | Functional — blocks base interaction while sheet is open, not decorative |

---

## Color Tokens

```
Background:  #FAFAF8  (warm off-white)
Surface:     #FFFFFF
Text:        #1C1C1E  (primary — iOS-style near-black)
Text muted:  #8E8E93  (secondary — lighter for reduced visual noise)
Border:      #F0F0F0  (barely visible — used only where truly needed)
Accent:      #35A76E  (brand green)
Checked:     #35A76E
Unchecked:   #D1D1D6  (soft outline)
Danger:      #FF3B30  (delete actions)
```

## Typography

System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`)

**Type scale:**

| Token | Size | Weight | Line-height | Additional | Used for |
|-------|------|--------|-------------|------------|----------|
| `title` | 20px | 700 | 1.3 | | App title, trip name in checklist header |
| `focus` | 18px | 600 | 1.3 | | Editable content under attention (bottom sheet item name) |
| `heading` | 16px | 600 | 1.4 | | Section/category/day headers, trip name in list |
| `body` | 16px | 400 | 1.4 | | Item labels, suggestion item names |
| `body` + muted | 16px | 400 | 1.4 | muted color | Checked item text |
| `caption` | 14px | 400 | 1.4 | muted color | Dates, counts, sub-headers, ghost text, reasoning, toggle labels |
| `micro` | 12px | 500 | 1.3 | uppercase, `letter-spacing: 0.05em` | Structural labels |

## Spacing

Base unit: **4px**. All layout spacing derives from this grid.

| Token | Value | Base | Used for |
|-------|-------|------|----------|
| `space-xs` | 4px | 1× | Drag handle height, tight internal gaps |
| `space-sm` | 8px | 2× | Inline element gaps (icon-to-text, button padding) |
| `space-md` | 12px | 3× | Item gap (between checklist rows) |
| `space-lg` | 20px | 5× | Horizontal page padding |
| `space-xl` | 24px | 6× | Suggestion card gap |
| `space-2xl` | 32px | 8× | Section gap, trip-to-trip separation |

**Component-specific values** (not composable spacing tokens):

| Token | Value | Purpose |
|-------|-------|---------|
| `hairline` | 2px | Progress bar thickness, view toggle underline |
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
| Trip list row | Full-row `state-pressed` tint | — |
| Checklist item row | Full-row `state-pressed` tint | — |
| Checkbox | Scale to 0.95 + `state-pressed` | `state-disabled-opacity` |
| Text action (Accept, Dismiss, Retry, Delete) | `state-pressed-accent` behind text | `state-disabled-opacity` + muted color |
| Category/day header (collapse toggle) | `state-pressed` tint on header row | — |
| Stepper +/− buttons | `state-pressed` tint on button area | `state-disabled-opacity` (e.g., − at quantity 1) |
| Day picker toggles | `state-pressed` tint on tap | — |

## Motion

**Principles:**

1. **Silence first** — no animation unless it communicates spatial relationship or state change
2. **Match the gesture** — swipe-triggered motions use spring physics; tap-triggered use ease-out
3. **Never block** — all animations are non-blocking; user can interact immediately

**Tokens:**

| Token | Value | Used for |
|-------|-------|----------|
| `duration-quick` | 150ms | State changes: fade, checkbox fill, press feedback |
| `duration-normal` | 250ms | Spatial changes: slide-in, collapse/expand, sheet entry |
| `easing-default` | `cubic-bezier(0.25, 0.1, 0.25, 1.0)` | Near-linear ease-out for tap-triggered motion |
| `easing-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Swipe-release snap (delete, sheet dismiss) |

**Animation catalog:**

| Animation | Duration | Easing | Behavior |
|-----------|----------|--------|----------|
| Checkbox fill | `duration-quick` | `easing-default` | Color transition: unchecked → accent |
| Item fade-in (add) | `duration-quick` | `easing-default` | Opacity 0 → 1 |
| Item fade-out (dismiss/delete) | `duration-quick` | `easing-default` | Opacity 1 → 0 |
| Suggestion slide-in (accept) | `duration-normal` | `easing-default` | Translate Y from 8px above + fade in at target position |
| Section collapse/expand | `duration-normal` | `easing-default` | Height transition with overflow clip |
| View toggle cross-fade | `duration-quick` | `easing-default` | Simultaneous fade-out old / fade-in new |
| Bottom sheet entry | `duration-normal` | `easing-default` | Translate Y from bottom + backdrop fade |
| Bottom sheet dismiss | `duration-normal` | `easing-spring` | Follows drag gesture, spring snap off-screen |
| Swipe-to-delete | `duration-normal` | `easing-spring` | Item follows finger, springs off-screen on release |
| Progress bar update | `duration-normal` | `easing-default` | Width transition |
| Banner count change | `duration-quick` | `easing-default` | Number cross-fade |

**Accessibility:** When `prefers-reduced-motion` is active, all `duration-*` tokens collapse to `0ms`.

## Elevation

No box-shadows — ever. Elevation is communicated through backdrop dimming and spatial animation.

| Layer | z-index | Visual treatment |
|-------|---------|------------------|
| `base` | 0 | Background (`#FAFAF8`) — all page content |
| `backdrop` | 99 | `rgba(0, 0, 0, 0.25)` — behind sheet, blocks base interaction |
| `sheet` | 100 | Surface (`#FFFFFF`), `border-radius: 12px 12px 0 0` |

**Rules:**
- Only one overlay open at a time (MVP has only the bottom sheet)
- Backdrop is tappable (dismisses sheet)
- Base content scroll locked while sheet is open
- Sheet height: 50% of viewport

---

## Screen Flow

```
Trip List (entry) ──► Checklist (main)
       ◄──── (← back)
```

Two screens total. No deep navigation. Item editing via bottom sheet overlay.

---

## Screen 1: Trip List

Entry point. Simple vertical list of 2–3 hardcoded sample trips. No dividers — whitespace separates entries.

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│  TripChecklist                      │
│                                     │
│                                     │
│                                     │
│  Tokyo Summer Trip           12/20  │
│  Jul 15–20 · 2 travelers           │
│                                     │
│                                     │
│  Bali Retreat                       │
│  Dec 1–8 · 1 traveler              │
│                                     │
│                                     │
│  NYC Weekend Getaway                │
│  Nov 7–9 · 2 travelers             │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Details:**
- Each row: trip name (`heading`) + dates and traveler count below (`caption`)
- Progress fraction (e.g., "12/20") right-aligned on the name line — only shown if the trip has checked items. Untouched trips show no fraction.
- No chevron (›) — the whole row is tappable. No explicit navigation affordance needed.
- No divider lines between trips — `space-2xl` gap provides separation
- App title "TripChecklist" (`title`) sits at top-left with generous space below. No header bar or background.
- Tap feedback: `state-pressed` tint on full row

---

## Screen 2: Checklist

Single screen with these zones (top to bottom):

### Header

```
┌─────────────────────────────────────┐
│                                     │
│  ←  Tokyo Summer Trip               │
│      Jul 15–20 · 2 travelers        │
│                                     │
│      12 of 20                        │
│      ━━━━━━━━━━━━━━━━━━░░░░░░░░     │
│                                     │
└─────────────────────────────────────┘
```

- Back arrow (←) as a simple icon/text, no container or background bar
- Trip name (`title`) on the same line as back arrow
- Trip dates + traveler count (`caption`), indented under title
- "X of Y" text (`caption`) — no "packed" label, context is obvious
- Progress bar: `hairline` thickness, full-width, `Accent` fill. Communicates progress without dominating.

### View Toggle

```
                Category    Day
                ────────
```

- Two text labels (`caption`) side by side, right-aligned below the progress bar
- Active label: regular weight text + `hairline` `Accent` underline (matches progress bar thickness)
- Inactive label: `Text muted`, no underline
- No pill, segment container, or background box — just text and underline
- Tap target: full word + padding (`touch-target-min` height)
- View toggle cross-fade (`duration-quick`, `easing-default`)

### AI Suggestions Banner

**Collapsed (default):**
```
┌─────────────────────────────────────┐
│  ✨ 3 suggestions                ▾  │
└─────────────────────────────────────┘
```

**Expanded (tap banner):**
```
┌─────────────────────────────────────┐
│  ✨ 3 suggestions                ▴  │
│                                     │
│  Rain jacket                        │
│  Clothing · Rain on Day 3           │
│                   Accept   Dismiss  │
│                                     │
│  Sunscreen                          │
│  Toiletries · UV 8+ all week        │
│                   Accept   Dismiss  │
│                                     │
│  Power bank                         │
│  Electronics · Long day trips       │
│                   Accept   Dismiss  │
│                                     │
└─────────────────────────────────────┘
```

**Behavior:**
- Collapsed by default as a single-line strip with thin bottom `Border`
- "✨ N suggestions" — short label. The ✨ sparkle is the sole visual marker for AI content.
- ▾/▴ small triangle indicator for expand/collapse state
- Each suggestion: item name (`body`), category · reasoning inline (`caption`, separated by middle dot ·), "Accept" (`Accent` text) and "Dismiss" (`Text muted` text) as text links — no boxed buttons
- `space-xl` whitespace separates suggestions (no dashed dividers)
- Accept → item fades from banner (`duration-quick`), appears in correct category with slide-in (`duration-normal`). Banner count decreases.
- Dismiss → card fades out (`duration-quick`). Count decreases.
- When 0 suggestions remain → banner disappears entirely
- No suggestions available → banner hidden (not rendered)
- Loading state: "✨ Getting suggestions..." (`caption` italic, no animation)
- Error state: "✨ Suggestions unavailable · Retry" (Retry in `Accent`, tappable)
- Auto-triggered on first visit to a trip

### Category View (Default)

```
┌─────────────────────────────────────┐
│                                     │
│  ▾ Clothing                   3/5   │
│                                     │
│  ☐  Shorts (2)                      │
│  ☐  Light jacket                    │
│  ☑  T-shirts (3)                    │
│  ☑  Underwear (5)                   │
│  ☑  Swimsuit                        │
│                                     │
│  Add item                           │
│                                     │
│                                     │
│  ▸ Documents                  2/2   │
│                                     │
│                                     │
│  ▾ Toiletries                 0/3   │
│                                     │
│  ☐  Sunscreen                       │
│  ☐  Toothbrush                      │
│  ☐  Shampoo                         │
│                                     │
│  Add item                           │
│                                     │
│                                     │
│  ...more categories...              │
│                                     │
│  + New category                     │
│                                     │
└─────────────────────────────────────┘
```

**Details:**
- Categories as collapsible sections with ▾/▸ toggle indicator
- Header: category name (`heading`) + fraction count right-aligned (`caption`). Tap header to collapse/expand.
- Fraction count visible whether collapsed or expanded
- Items: single-line rows — checkbox + item name (`body`) + quantity in parentheses when > 1
- Quantity hidden when 1 (show "Swimsuit" not "Swimsuit (1)")
- Items with a booking link: 📎 chip right-aligned on the item row (tappable, `Accent`-outlined)
- Checked items: `Checked` checkbox fill, `body` + muted text (no strikethrough — stays readable)
- Checked items sort to bottom of their category section (unchecked items rise to top)
- "Add item" as ghost placeholder text (`caption`) at bottom of each category — no box border. Tap to activate as text field. Type name, press enter → item created with quantity 1.
- Tap item name → opens bottom sheet for editing (see Item Detail section)
- Tap checkbox → toggles check state (does not open bottom sheet)
- Swipe left on item → reveals `Danger` delete zone. Release to confirm. Item slides off-screen (`duration-normal`, `easing-spring`).
- Empty category: "No items yet" `Text muted` + "Add item" ghost text visible

### Custom Categories

- **"+ New category"** link (`caption`, "+" in `Accent`) at the bottom of all category sections
- Tap → inline text field appears. Type category name, press enter → new section created
- 10 default categories always shown (even when empty)
- Custom categories persist until explicitly deleted
- Swipe left on a custom category header → delete option (only for custom categories, not defaults)
- Deleting a custom category moves its items to "Miscellaneous"
- In item detail bottom sheet, category dropdown shows: 10 defaults + any custom categories + "New category..." option at bottom
- AI suggestions only use the 10 canonical categories (custom categories are user-only)

### Day/Activity View

```
┌─────────────────────────────────────┐
│                                     │
│  ▾ Day 1                     2/4   │
│                                     │
│  ☐  Travel adapter            📎   │
│                                     │
│    Airport Transfer                 │
│    ☑  Passport                      │
│    ☐  Booking confirmation    📎   │
│                                     │
│    Hotel Check-in                   │
│    ☑  Toiletries bag                │
│                                     │
│                                     │
│  ▾ Day 2                     0/3   │
│                                     │
│    Senso-ji Visit                   │
│    ☐  Comfortable shoes             │
│    ☐  Camera                        │
│    ☐  Water bottle                  │
│                                     │
│                                     │
│  ▾ General                   6/8   │
│                                     │
│    ☑  Underwear (5)                 │
│    ☑  T-shirts (3)                  │
│    ☐  Shorts (2)                    │
│    ...                              │
│                                     │
└─────────────────────────────────────┘
```

**Details:**
- Day headers: "Day N" (`heading`) + fraction count right-aligned (`caption`). Theme (e.g., "Day 1 · Arrival") shown only if trip data provides a theme for that day.
- Collapsible day sections with ▾/▸ toggle (same pattern as category view)
- Items assigned to a day but not to a specific activity appear directly under the Day header, before any activity sub-headers
- Activity names as sub-headers (`caption`, slightly indented)
- Items: single-line rows (same as category view). Checkbox + name + optional quantity + optional 📎 booking chip right-aligned.
- Booking chip (📎) appears on items with a `booking_link`, same behavior as in Category view
- Checked items sort to bottom within each activity group
- "General" section at bottom for items not mapped to specific days
- No add-item field in Day view (add items in Category view, then assign day via bottom sheet)
- Checking/unchecking updates the same item across both views (single source of truth)

---

## Item Detail — Bottom Sheet

Opens when user taps an item name (not checkbox, not booking chip). Half-height sheet slides up from bottom.

```
┌─────────────────────────────────────┐
│                                     │
│           ─── (drag handle)         │
│                                     │
│  T-shirts                           │
│                                     │
│  Quantity          ─  3  +          │
│                                     │
│  Days                               │
│  D1  D2  D3  D4  D5   General      │
│   ●       ●                         │
│                                     │
│  Category          Clothing      ▾  │
│                                     │
│  View booking →                     │
│                                     │
│                                     │
│  Delete item                        │
│                                     │
└─────────────────────────────────────┘
```

**Details:**
- Drag handle (`space-2xl` wide, `space-xs` tall, centered) at top for swipe-to-dismiss
- Item name: editable text field (`focus`). Tap to edit.
- Quantity stepper: minus / value / plus. Minimum 1. Minus disabled at 1 (`state-disabled-opacity`).
- Day picker: multi-select toggle buttons for each day (D1, D2, ... based on trip length) + "General". Filled circle (●) = selected. Tap to toggle.
- Category dropdown: 10 defaults + custom categories + "New category..." at bottom of dropdown
- "View booking →" link (`Accent`): shown only when item has a `booking_link`. Tapping opens mock deep link (MVP: navigates to placeholder URL or shows toast).
- "Delete item" text link (`Danger`) at bottom of sheet
- `Elevation.backdrop` behind sheet. Tap backdrop to dismiss.
- Changes auto-save as user interacts — no save/cancel buttons
- Sheet entry: `duration-normal`, `easing-default`. Dismiss: drag gesture + `easing-spring`.

---

## Interactions

| Interaction | Behavior |
|---|---|
| Check item | Checkbox fills `Checked` (`duration-quick`). Text becomes muted. Item sorts to bottom of section. Progress bar updates (`duration-normal`). |
| Uncheck item | Reverses above. Item moves back to top group. |
| Tap item name | Opens bottom sheet for editing (name, quantity, days, category, booking link, delete). |
| Tap booking chip (📎) | Opens mock deep link. MVP: navigates to placeholder URL or shows toast "Booking links coming soon." |
| Accept suggestion | Card fades from banner (`duration-quick`). Item appears in correct category with slide-in (`duration-normal`). Banner count decreases. |
| Dismiss suggestion | Card fades out (`duration-quick`). Banner count decreases. At 0 remaining, banner hides. |
| Add item (enter) | New item at bottom of category with fade-in (`duration-quick`). Default: quantity 1, no day assignment. |
| Add custom category | "+ New category" at bottom. Inline text field → new section appears. |
| Delete custom category | Swipe left on custom category header → delete. Items moved to Miscellaneous. |
| Collapse/expand section | ▾/▸ toggle. Items slide up/down (`duration-normal`). Fraction count visible when collapsed. |
| Switch view toggle | Cross-fade between Category and Day views (`duration-quick`). |
| Delete item (swipe) | Swipe left → `Danger` delete zone. Release to confirm. Item slides off-screen (`duration-normal`, `easing-spring`). |
| Delete item (bottom sheet) | Tap "Delete item" in bottom sheet → item removed, sheet closes. |
| Navigate back | ← arrow or swipe-back gesture. Checklist state persists (saved to Supabase). |

---

## Responsive Behavior

| Viewport | Treatment |
|---|---|
| **375–430px** | Design target. Full-width content, `space-lg` horizontal padding. |
| **431px+** | Same mobile layout, centered with `max-width: 430px`. Warm off-white (#FAFAF8) background behind. No adaptation. |

Mobile-only for MVP. No tablet or desktop breakpoints.

---

## Empty & Loading States

| State | Treatment |
|---|---|
| First visit to trip | All default categories shown empty with "Add item" ghost text. AI suggestions auto-triggered. |
| AI loading | Banner: "✨ Getting suggestions..." (`caption` italic, no animation). |
| AI failure | Banner: "✨ Suggestions unavailable · Retry" (Retry in `Accent`, tappable). |
| AI returns 0 suggestions | Banner hidden entirely. |
| No items in category | "No items yet" `Text muted` + "Add item" ghost text visible. |
| No suggestions | Banner not rendered. |
| Empty day (Day view) | Day header visible with "0/0" count. No items listed. |
