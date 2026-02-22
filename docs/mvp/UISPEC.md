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

**Weight scale:**

```
Page title:      20px / 700 (semibold)
Section header:  16px / 600 (medium)
Item label:      16px / 400 (regular)
Item checked:    16px / 400 (regular) + muted color
Secondary text:  14px / 400 (regular) + muted color
Micro label:     12px / 500 (medium) + uppercase tracking
```

## Spacing

```
Section gap:     32px  (generous breathing between categories/days)
Item gap:        12px  (tight enough to scan, loose enough to tap)
Horizontal pad:  20px  (wider margins for a luxurious feel)
Touch target:    min 44px height per item row
```

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
- Each row: trip name (16px/600) + dates and traveler count below (14px muted)
- Progress fraction (e.g., "12/20") right-aligned on the name line — only shown if the trip has checked items. Untouched trips show no fraction.
- No chevron (›) — the whole row is tappable. No explicit navigation affordance needed.
- No divider lines between trips — 32px gap provides separation
- App title "TripChecklist" (20px/700) sits at top-left with generous space below. No header bar or background.
- Tap feedback: subtle background tint on press (rgba(0,0,0,0.03))

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
- Trip name (20px/700) on the same line as back arrow
- Trip dates + traveler count (14px muted), indented under title
- "X of Y" text (14px muted) — no "packed" label, context is obvious
- Progress bar: 2px thin hairline, full-width, accent (#35A76E) fill. Communicates progress without dominating.

### View Toggle

```
                Category    Day
                ────────
```

- Two text labels (14px) side by side, right-aligned below the progress bar
- Active label: regular weight text + 2px accent (#35A76E) underline (matches progress bar thickness)
- Inactive label: muted color (#8E8E93), no underline
- No pill, segment container, or background box — just text and underline
- Tap target: full word + padding (min 44px height)
- Cross-fade transition between views, instant

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
- Collapsed by default as a single-line strip with thin bottom border (#F0F0F0)
- "✨ N suggestions" — short label. The ✨ sparkle is the sole visual marker for AI content.
- ▾/▴ small triangle indicator for expand/collapse state
- Each suggestion: item name (16px/400), category · reasoning inline (14px muted, separated by middle dot ·), "Accept" (accent color text) and "Dismiss" (muted text) as text links — no boxed buttons
- 24px whitespace separates suggestions (no dashed dividers)
- Accept → item fades from banner, appears in correct category with brief slide-in. Banner count decreases.
- Dismiss → card fades out. Count decreases.
- When 0 suggestions remain → banner disappears entirely
- No suggestions available → banner hidden (not rendered)
- Loading state: "✨ Getting suggestions..." (14px muted italic, no animation)
- Error state: "✨ Suggestions unavailable · Retry" (Retry in accent color, tappable)
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
- Header: category name (16px/600) + fraction count right-aligned (14px muted). Tap header to collapse/expand.
- Fraction count visible whether collapsed or expanded
- Items: single-line rows — checkbox + item name + quantity in parentheses when > 1
- Quantity hidden when 1 (show "Swimsuit" not "Swimsuit (1)")
- Items with a booking link: 📎 chip right-aligned on the item row (tappable, accent-outlined)
- Checked items: accent (#35A76E) checkbox fill, muted text (no strikethrough — stays readable)
- Checked items sort to bottom of their category section (unchecked items rise to top)
- "Add item" as ghost placeholder text (14px muted) at bottom of each category — no box border. Tap to activate as text field. Type name, press enter → item created with quantity 1.
- Tap item name → opens bottom sheet for editing (see Item Detail section)
- Tap checkbox → toggles check state (does not open bottom sheet)
- Swipe left on item → reveals red delete zone. Release to confirm. Item slides off-screen.
- Empty category: "No items yet" muted text + "Add item" ghost text visible

### Custom Categories

- **"+ New category"** link (14px muted, "+" in accent color) at the bottom of all category sections
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
- Day headers: "Day N" (16px/600) + fraction count right-aligned. Theme (e.g., "Day 1 · Arrival") shown only if trip data provides a theme for that day.
- Collapsible day sections with ▾/▸ toggle (same pattern as category view)
- Items assigned to a day but not to a specific activity appear directly under the Day header, before any activity sub-headers
- Activity names as sub-headers (14px muted weight, slightly indented)
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
- Drag handle (32px wide, 4px tall, centered) at top for swipe-to-dismiss
- Item name: editable text field (18px/600). Tap to edit.
- Quantity stepper: minus / value / plus. Minimum 1.
- Day picker: multi-select toggle buttons for each day (D1, D2, ... based on trip length) + "General". Filled circle (●) = selected. Tap to toggle.
- Category dropdown: 10 defaults + custom categories + "New category..." at bottom of dropdown
- "View booking →" link (accent color): shown only when item has a `booking_link`. Tapping opens mock deep link (MVP: navigates to placeholder URL or shows toast).
- "Delete item" text link (danger red #FF3B30) at bottom of sheet
- Semi-transparent backdrop behind sheet. Tap backdrop to dismiss.
- Changes auto-save as user interacts — no save/cancel buttons
- Sheet dismisses on: drag down, tap backdrop, or swipe back gesture

---

## Interactions

| Interaction | Behavior |
|---|---|
| Check item | Checkbox fills accent (#35A76E). Text becomes muted. Item sorts to bottom of section. Progress bar updates. |
| Uncheck item | Reverses above. Item moves back to top group. |
| Tap item name | Opens bottom sheet for editing (name, quantity, days, category, booking link, delete). |
| Tap booking chip (📎) | Opens mock deep link. MVP: navigates to placeholder URL or shows toast "Booking links coming soon." |
| Accept suggestion | Card fades from banner. Item appears in correct category with brief slide-in animation. Banner count decreases. |
| Dismiss suggestion | Card fades out. Banner count decreases. At 0 remaining, banner hides. |
| Add item (enter) | New item at bottom of category with brief fade-in. Default: quantity 1, no day assignment. |
| Add custom category | "+ New category" at bottom. Inline text field → new section appears. |
| Delete custom category | Swipe left on custom category header → delete. Items moved to Miscellaneous. |
| Collapse/expand section | ▾/▸ toggle. Items slide up/down. Fraction count visible when collapsed. |
| Switch view toggle | Cross-fade between Category and Day views. Instant, no page load. |
| Delete item (swipe) | Swipe left → red delete zone. Release to confirm. Item slides off-screen. |
| Delete item (bottom sheet) | Tap "Delete item" in bottom sheet → item removed, sheet closes. |
| Navigate back | ← arrow or swipe-back gesture. Checklist state persists (saved to Supabase). |

---

## Responsive Behavior

| Viewport | Treatment |
|---|---|
| **375–430px** | Design target. Full-width content, 20px horizontal padding. |
| **431px+** | Same mobile layout, centered with `max-width: 430px`. Warm off-white (#FAFAF8) background behind. No adaptation. |

Mobile-only for MVP. No tablet or desktop breakpoints.

---

## Empty & Loading States

| State | Treatment |
|---|---|
| First visit to trip | All default categories shown empty with "Add item" ghost text. AI suggestions auto-triggered. |
| AI loading | Banner: "✨ Getting suggestions..." (14px muted italic, no animation). |
| AI failure | Banner: "✨ Suggestions unavailable · Retry" (Retry in accent color, tappable). |
| AI returns 0 suggestions | Banner hidden entirely. |
| No items in category | "No items yet" muted text + "Add item" ghost text visible. |
| No suggestions | Banner not rendered. |
| Empty day (Day view) | Day header visible with "0/0" count. No items listed. |
