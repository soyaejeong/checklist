---
name: advancing-slices
description: This skill should be used when the user says "complete slice", "next slice", "archive plan", "finish plan", "slice lifecycle", or when MASTER_PLAN.md is 100% complete. Manages the vertical slice lifecycle including archival and next slice generation.
version: 1.0.0
---

# Advancing Slices - Vertical Slice Management

Manage the complete lifecycle of vertical slices: validation, archival, and generation of the next slice.

## When to Use

Trigger this skill when:
- User says "complete slice" or "next slice"
- User asks to archive the current plan
- All checkboxes in MASTER_PLAN.md are marked `[x]`
- User wants to start the next vertical slice

## Workflow Overview

```
1. VALIDATE   → Verify completion (checkboxes, tests, clean git)
2. ARCHIVE    → Add metadata, move to completed/
3. GENERATE   → Delegate to /generating-plans
4. UPDATE     → Update COMPLETED_SLICES.md, TECHSPEC.md
5. COMMIT     → Finalize with proper commit
```

## Phase 1: Validate Completion

### Check MASTER_PLAN.md

Read `docs/MASTER_PLAN.md` and verify:
- All checkboxes are marked: `[x]` (no `[ ]` remaining)
- If any unchecked items exist, list them and stop

### Run Full Test Suite

```bash
npm run test:unit
npm run lint
```

Both must pass with zero warnings.

### Check Git Status

```bash
git status
```

Working directory should be clean (no uncommitted changes).

If validation fails, report issues and stop.

## Phase 2: Archive Current Slice

### Identify Current Plan

```bash
readlink docs/MASTER_PLAN.md
```

Returns something like: `plans/05-user-auth.md`

### Add Completion Metadata

Edit the plan file to add at the top:
```markdown
---
status: completed
completed_date: YYYY-MM-DD
duration: X days
notes: Brief summary of what was accomplished
---
```

### Move to Completed Directory

```bash
git mv docs/plans/NN-slice-name.md docs/plans/completed/
```

### Commit Archive

```bash
git add .
git commit -m "[S] Archive completed slice NN: slice-name"
```

## Phase 3: Generate Next Plan

Use the Skill tool to invoke `/generating-plans` for slice selection, plan creation, and activation.

The generating-plans skill handles:
1. Selecting the next slice (reviews TECHSPEC, applies criteria)
2. Creating the plan file from the canonical template
3. Validating plan quality (session-sized tasks, no anti-patterns)
4. Activating the MASTER_PLAN.md symlink

Wait for generating-plans to complete all phases before proceeding to Phase 4.

## Phase 4: Update Documentation

### Update COMPLETED_SLICES.md

Add the completed slice to `docs/COMPLETED_SLICES.md`.

### Update TECHSPEC.md

Update TECHSPEC.md completion tracking if applicable.

### Verify Consistency

- MASTER_PLAN.md symlink points to new plan
- COMPLETED_SLICES.md includes the archived slice
- New plan file exists in `docs/plans/`

## Phase 5: Final Commit

```bash
git add .
git commit -m "[B] Start slice NN: slice-name"
```

## Validation Checklist

Before starting new slice:
- [ ] Previous slice archived in `docs/plans/completed/`
- [ ] New plan exists at `docs/plans/NN-slice-name.md`
- [ ] Symlink updated: `docs/MASTER_PLAN.md` → new plan
- [ ] `docs/COMPLETED_SLICES.md` updated
- [ ] All commits made with proper prefixes
- [ ] Tests passing, git clean

## Quick Reference

| Phase | Command/Action | Verification |
|-------|----------------|--------------|
| Validate | `npm run test:unit && npm run lint` | Exit 0, no warnings |
| Archive | `git mv docs/plans/XX.md docs/plans/completed/` | File moved |
| Generate | Invoke `/generating-plans` | New plan created + symlink updated |
| Commit | `[S]` for archive, `[B]` for new slice | Proper prefix |
