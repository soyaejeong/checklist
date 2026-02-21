---
name: filing-bugs
description: This skill should be used when the user says "file bug", "report bug", "bug:", or describes a bug to fix. Creates a GitHub issue before planning the fix.
version: 1.0.0
---

# Filing Bugs - Issue-First Bug Workflow

Create a GitHub issue before fixing any bug. This ensures every fix is tracked and linked.

## When to Use

Trigger this skill when:
- User describes a bug they encountered
- User says "file bug" or "report bug"
- User reports broken behavior that needs fixing

## Workflow

```
1. PARSE     → Extract bug details from user's description
2. CLASSIFY  → Assign priority, size, and type labels
3. FILE      → Create GitHub issue via `gh`
4. FIX       → Plan and implement the fix (TDD if applicable)
5. CLOSE     → Reference issue in commit message
```

## Phase 1: Parse Bug Description

Extract from the user's message:
- **What's broken** — the observed behavior
- **What's expected** — the correct behavior
- **Where** — affected file(s) or route(s), if mentioned

## Phase 2: Classify

Use the project's label taxonomy:

| Category | Options |
|----------|---------|
| Priority | `priority:P0` (critical), `priority:P1` (high), `priority:P2` (medium) |
| Size | `size:S` (hours), `size:M` (1-2 days), `size:L` (3-5 days) |
| Type | `type:eng-fe`, `type:eng-db`, `type:eng-infra` |

Guidelines:
- **P0**: App is down, data loss, security vulnerability
- **P1**: Feature broken for all users, wrong redirects, auth failures
- **P2**: Edge case, cosmetic, non-blocking

## Phase 3: File GitHub Issue

```bash
gh issue create \
  --title "<concise bug title>" \
  --body "<markdown body with ## Bug, ## Root Cause, ## Fix sections>" \
  --label "bug,priority:P*,size:*,type:*"
```

Then add to the project board:

```bash
gh project item-add 1 --owner soyaejeong --url <issue-url>
```

## Phase 4: Fix

After the issue is created:

1. **Investigate** — Read relevant source files to confirm root cause
2. **Test** — Write or update a failing test if applicable
3. **Fix** — Make the minimum change to resolve the bug
4. **Verify** — Run `npm run test:unit`

## Phase 5: Close via Commit

Reference the issue number in the commit:

```bash
git commit -m "[B] Fix <description>. Fixes #<number>"
```

GitHub auto-closes the issue when this lands on main.

## Issue Body Template

```markdown
## Bug

<What the user reported — observed behavior>

## Root Cause

<Why it happens — code-level explanation>

## Fix

<What files need to change and how>
```
