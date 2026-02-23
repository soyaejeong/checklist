# Plan Generation Guide

> **Automated workflows:** Use `/generating-plans` to create a new plan.
> Use `/advancing-slices` for the full slice lifecycle (validate, archive, generate, commit).
> This document is a reference for plan quality standards.

---

## Vertical Slice Criteria

A valid vertical slice must meet ALL of these criteria:

- [ ] **Implements complete user journey** - References a specific user journey from TECHSPEC
- [ ] **Touches all layers** - Includes Database → API/Backend → Hooks/Logic → UI/Components
- [ ] **Completable in 1-3 days** - Realistic estimate for one developer following TDD
- [ ] **Delivers testable user value** - User can perform a complete action and see results
- [ ] **Session-sized tasks** - Each checkbox represents one focused session: Red → Green → Refactor → Mark done

---

## Task Sizing Guidelines

### Rule: One Red-Green-Refactor Cycle per Checkbox

Each checkbox should represent work completable in a single focused session (typically 1-4 hours), including:
- Writing the failing test (Red)
- Implementing minimum code to pass (Green)
- Refactoring if needed
- Marking the checkbox as done
- Committing with appropriate [B] or [S] prefix (see CLAUDE.md)

### Good Examples (Session-Sized)

**Database:**
- "Test: work_days table accepts valid data"
- "Test: RLS policy prevents user from reading other users' records"
- "Test: Unique constraint enforced on (user_id, date)"

**API:**
- "Test: GET /items returns 200 with user's items"
- "Test: POST /items creates new record and returns 201"
- "Test: PATCH /items/:id updates fields correctly"

**Hooks:**
- "Test: useItems returns current data"
- "Test: useItems creates item if none exists"
- "Test: useAutoSave debounces updates to 500ms"

**UI:**
- "Test: ItemForm renders form with input fields"
- "Test: Form validation shows error for empty required field"
- "Test: Submit button disabled when form invalid"

### Bad Examples (Too Large - Multi-Session)

- "Test: Complete authentication system with login, logout, and session management"
- "Test: All database tables and RLS policies working"
- "Test: Entire form with validation, auto-save, and error handling"
- "Test: Full workflow from start to finish"

### How to Split Large Tasks

**If a test feels too big, break it down by:**

1. **Separate happy path from edge cases**
   - Before: "Test: Form validation for all fields"
   - After: "Test: Form accepts valid data" + "Test: Form rejects empty email" + "Test: Form rejects invalid date"

2. **Separate layers**
   - Before: "Test: User can save item"
   - After: "Test: API accepts POST to /items" + "Test: Hook calls API on save" + "Test: UI button triggers save"

3. **Separate CRUD operations**
   - Before: "Test: Item CRUD complete"
   - After: "Test: Create item" + "Test: Read item" + "Test: Update item" + "Test: Delete item"

4. **Separate structural from behavioral**
   - Before: "Implement and refactor authentication"
   - After: "Test: Basic login works" (B) + "Refactor: Extract auth helper" (S)

---

## Anti-Patterns to Avoid

### Horizontal Slicing
**Bad:** "Build all database tables"
**Why:** No user value, can't test end-to-end
**Good:** "User can create and view their first item" (includes only needed DB tables)

### Slices Larger than 3 Days
**Bad:** "Complete analytics dashboard with all charts and filters"
**Why:** Too much scope, hard to estimate, delayed feedback
**Good:** "Display single metrics card" → "Add trend chart" → "Add date range filter" (3 separate slices)

### Multi-Session Tasks
**Bad:** Checkbox: "Implement complete form with validation, auto-save, error handling, and success toast"
**Why:** Can't complete in one session, loses TDD rhythm
**Good:** 4 separate checkboxes, one for each feature

### Pre-Planning >1 Slice Ahead
**Bad:** Planning all 50 features upfront in detail
**Why:** Wasteful - plans will change based on learning
**Good:** Active plan only, generate next when current completes

### Mixing Structural and Behavioral Changes
**Bad:** Single commit: "Add login feature and refactor auth helpers"
**Why:** Violates Tidy First principle, hard to review/revert
**Good:** Commit 1 (S): "Extract auth helpers" → Commit 2 (B): "Add login endpoint"

### Starting New Plan with Incomplete Work
**Bad:** 80% done with current slice, start planning next one
**Why:** Context switching, incomplete features, untested code
**Good:** Finish 100%, commit, archive, THEN plan next

### Worktree Splits Within Tightly Coupled Code
**Bad:** Separate worktrees for frontend hooks and frontend components
**Why:** They share types, hooks import providers, components import hooks — constant merge conflicts
**Good:** Keep tightly coupled modules in one worktree; use section-level tweep for intra-slice parallelism

### Multiple Merge Points with Shared Files
**Bad:** Merge backend branch 3 times during frontend development, each touching shared config
**Why:** Each merge risks conflicts; coordination overhead defeats parallelism gains
**Good:** Single merge point, conflict-free by construction (separate directory trees)

---

## Parallelism Guidelines

These guidelines support the `/parallel-sweep` (tweep) workflow, which spawns TDD worker agents to execute independent sections concurrently.

### Section Independence

When designing sections for a slice, maximize independence between sections:
- Organize sections by architectural layer when possible (Data, State, UI, API)
- Each section should touch a distinct set of source files
- Cross-cutting sections (error handling, shared utilities) should complete early or be part of the Steel Thread

### Dependency Declaration

Every section in the Test Checklist must include a `<!-- parallel: ... -->` metadata comment:

- `independent` — No dependencies on other sections; can run in parallel
- `depends_on=[Section Name]` — Cannot start until the named section is complete
- `sequential` — Must run in plan order (used for Steel Thread and Integration)

```markdown
### Repository Tests (#42)
<!-- parallel: independent | files: src/lib/repository.ts, tests/lib/repository.test.ts -->

### Store Tests (#43)
<!-- parallel: depends_on=Repository Tests | files: src/store/store.ts, tests/store/store.test.ts -->
```

### File Ownership

Every section must include a `<!-- files: ... -->` metadata comment listing the source and test files that section will create or modify.

**Rule: Two independent sections must NEVER list the same file.** If two sections must write to the same file, one must depend on the other.

### Anti-Pattern: Overlapping File Scopes

**Bad:** Section A writes to `src/lib/types.ts` AND Section B writes to `src/lib/types.ts` (both marked independent)
**Why:** Parallel workers would create merge conflicts
**Good:** Steel Thread creates `src/lib/types.ts`, Section A and B only import from it

### Ideal Section Count for Parallelism

Aim for **3-5 sections** with **2-4 tasks each**. This maps well to the 2-worker team:
- Fewer than 3 sections: minimal parallelism benefit, use `sweep` instead
- More than 5 sections: coordination overhead grows, consider consolidating

---

## Worktree Parallelism

These guidelines support cross-slice parallelism using git worktrees, where multiple slices execute simultaneously in separate working directories. See [ROADMAP.md](../../../docs/ROADMAP.md) for the current wave/slice assignments.

### Two Levels of Parallelism

| Level | Scope | Mechanism | When |
|-------|-------|-----------|------|
| **Worktree-level** | Cross-slice | `git worktree add` | Different runtimes, zero shared source files |
| **Section-level** | Within-slice | `/parallel-sweep` (tweep) | Independent sections within a single slice |

Worktree parallelism is a **roadmap concern** (defined in `docs/ROADMAP.md`), not a slice-plan concern. Individual slice plans continue to use section-level parallelism metadata for tweep.

### When to Use Worktrees

Use separate worktrees when ALL of these conditions are met:
- **Different runtimes** — e.g., TypeScript (Node) vs Python (FastAPI)
- **Zero shared source files** — no file is edited by both worktrees
- **Well-defined API contract** — integration seam is documented (e.g., in TECHSPEC), not shared code
- **Independent dependency management** — separate `package.json` vs `requirements.txt`

### When NOT to Use Worktrees

Do NOT use separate worktrees for code that:
- **Shares types/interfaces** — modules importing from common `types/` files
- **Shares hooks or providers** — tightly coupled through React context
- **Lives in the same runtime** — use section-level tweep instead
- **Has frequent integration points** — would require multiple merge points

### File Ownership Matrix

When using worktrees, every source file must be assigned to exactly one worktree. Document this in `docs/ROADMAP.md`:

- Each worktree owns specific directory trees (e.g., `src/` vs `backend/`)
- Shared documentation (TECHSPEC, UISPEC) is **read-only** for all worktrees
- The API contract lives in documentation, not in shared source code

### Merge Strategy

- **Single merge point** — merge the secondary worktree branch before the integration slice
- **Conflict-free by construction** — if file ownership is correct, the merge has zero conflicts
- Remove the worktree after merging: `git worktree remove <path>`

---

## Key Principles

- **Session-sized tasks** - Each checkbox = one focused session
- **Vertical slicing** - Complete user journey, all layers
- **Progressive planning** - Just-in-time, not upfront
- **Tidy First** - Separate structural (S) from behavioral (B)
- **TDD rhythm** - Red → Green → Refactor → Commit
- **Worktree isolation** - Cross-slice parallelism for independent subsystems (see ROADMAP.md)

---

**Last Updated:** 2026-02-22
**Version:** 3.0
