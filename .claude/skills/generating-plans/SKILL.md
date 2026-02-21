---
name: generating-plans
description: This skill should be used when the user says "generate plan", "new plan", "create plan", "plan next slice", or when ready to create a new MASTER_PLAN.md for the next vertical slice. Handles slice selection, plan generation from template, and plan validation.
version: 1.0.0
---

# Generating Plans - Vertical Slice Plan Creation

Create consistent, session-sized MASTER_PLAN.md files for TDD development. Handles selecting the next slice, generating the plan from template, validating quality, and activating it.

## When to Use

Trigger this skill when:
- User says "generate plan", "new plan", or "create plan"
- User says "plan next slice"
- Ready to create a new MASTER_PLAN.md after archival
- Called from `/advancing-slices` Phase 3

## Preconditions

Before generating, verify ALL conditions are met:
- Current plan shows 100% completion (all checkboxes marked)
- All tests passing (no failures, no skipped tests)
- No compiler or linter warnings
- All code committed with proper S/B separation
- Feature validated end-to-end

**Never start a new plan with incomplete work from the previous one.**

## Workflow Overview

```
1. SELECT    → Choose next slice from TECHSPEC/roadmaps
2. GENERATE  → Create plan file from template
3. ISSUES    → Create GitHub issues for plan sections, assign to milestone
4. VALIDATE  → Check plan quality against standards
5. ACTIVATE  → Update MASTER_PLAN.md symlink
```

## Phase 1: Select Next Slice

### Review Available Work

Read these documents to understand what's done and what's next:
- `docs/TECHSPEC.md` for architecture and roadmap
- `docs/COMPLETED_SLICES.md` to understand what's already been built

### Apply Decision Process

Follow this 4-step process:

**Step 1: Review TECHSPEC Phase Order**
- Start with Phase 0 (Foundation)
- Progress through phases sequentially
- Follow dependencies between phases

**Step 2: Apply Selection Criteria**
- **Build on completed work** - Minimize new dependencies
- **Follow user journey sequence** - Natural workflow progression
- **Choose smallest valuable increment** - When in doubt, split into smaller slices

**Step 3: Verify Slice is Independent**
- Can it be tested end-to-end without unbuilt features?
- If no: Build dependency first OR stub it out and note as technical debt

**Step 4: Estimate Duration**
- If estimate >3 days: Split into multiple slices
- If estimate <1 day: Consider combining with related slice (but keep user value complete)

### Verify Vertical Slice Criteria

The selected slice must meet ALL 5 criteria:
1. **Implements complete user journey** - References a specific user journey from TECHSPEC
2. **Touches all layers** - Includes Database → API/Backend → Hooks/Logic → UI/Components
3. **Completable in 1-3 days** - Realistic estimate for one developer following TDD
4. **Delivers testable user value** - User can perform a complete action and see results
5. **Session-sized tasks** - Each checkbox represents one focused session: Red → Green → Refactor → Mark done

### Confirm with User

Present the recommended next slice and ask for confirmation before proceeding.

## Phase 2: Generate Plan from Template

### Determine Plan Number

```bash
ls docs/plans/completed/ | wc -l
```

Next plan number = count + 1 (e.g., if 5 completed, next is 6).

### Naming Rules

- Format: `NN-slice-name.md` (e.g., `06-user-auth.md`)
- `NN` = Two-digit sequential number (01, 02, 03, ...)
- `slice-name` = Lowercase, hyphen-separated description
- Never reuse numbers (even if a slice is deleted/abandoned)
- Number represents completion order, not importance

### Create Plan File

Read the canonical template from `references/plan-template.md`.

Create `docs/plans/NN-slice-name.md` and fill all sections:
- **Scope:** Reference the specific TECHSPEC sections and user journey
- **Exit Criteria:** Specific, measurable acceptance conditions
- **Steel Thread:** Thinnest possible end-to-end proof of integration
- **Test Checklist:** Break into session-sized tasks, organized by logical sections
- **Refactoring Opportunities:** Leave empty (discovered during development)
- **Notes & Discoveries:** Leave empty (captured during development)

Each test checkbox = one Red → Green → Refactor → Commit cycle.

### Directory Structure

```
docs/
├── MASTER_PLAN.md                    # Symlink to current plan
├── plans/
│   ├── NN-slice-name.md              # Current active plan
│   └── completed/
│       ├── 01-first-slice.md
│       ├── 02-second-slice.md
│       └── ...
```

## Phase 3: Create GitHub Issues

After generating the plan file, create GitHub issues for each logical section of the test checklist. Each issue is assigned to the slice's milestone.

### Issue Granularity

One issue per **section** of the Test Checklist (not per individual checkbox). A section groups related tasks, e.g., "Database Schema Tests" or "Auth Component". This typically yields 3-6 issues per plan.

### Create Issues

For each section in the Test Checklist:

```bash
gh issue create \
  --title "<Section Name>" \
  --body "<markdown body with section's tasks as checklist>" \
  --label "feat"
```

Then add to the project board:

```bash
gh project item-add 1 --owner soyaejeong --url <issue-url>
```

### Update Plan File

After creating issues, annotate each section header in the MASTER_PLAN with the issue reference:

```markdown
### Section Name (#<issue-number>)
- [ ] Test: Component renders correctly
- [ ] Test: ...
```

This links plan sections to trackable GitHub issues.

## Phase 4: Validate Plan Quality

### Validation Checklist

- [ ] All sections filled in (no `[brackets]` remaining)
- [ ] Each task is session-sized (see `references/PLAN_GENERATION_GUIDE.md` Task Sizing Guidelines)
- [ ] No anti-patterns present (see `references/PLAN_GENERATION_GUIDE.md` Anti-Patterns section)
- [ ] Clear B/S separation in test checkboxes (behavioral tests vs structural refactors)
- [ ] Exit criteria are specific and measurable
- [ ] Duration estimate is 1-3 days
- [ ] Steel thread identifies the minimal integration proof

### Present to User

Show the generated plan to the user for review and adjustment before activation.

## Phase 5: Activate Plan

### Update Symlink

```bash
rm docs/MASTER_PLAN.md
ln -s plans/NN-slice-name.md docs/MASTER_PLAN.md
```

### Verify Activation

```bash
readlink docs/MASTER_PLAN.md
```

Should return: `plans/NN-slice-name.md`

## Quick Reference

| Phase | Action | Verification |
|-------|--------|--------------|
| Select | Review TECHSPEC + completed slices | User confirms slice choice |
| Generate | Create `docs/plans/NN-slice-name.md` | All template sections filled |
| Issues | Create GitHub issues per section | Issues linked in plan headers |
| Validate | Check against quality standards | No brackets, session-sized tasks |
| Activate | Update `docs/MASTER_PLAN.md` symlink | `readlink` confirms |

## Additional Resources

See `references/PLAN_GENERATION_GUIDE.md` for task sizing examples and anti-patterns to avoid.
