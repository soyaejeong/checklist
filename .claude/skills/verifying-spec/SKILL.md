---
name: verifying-spec
description: This skill should be used when the user says "verify spec", "check spec compliance", "spec vs code", "techspec audit", "implementation check", or asks to compare TECHSPEC.md against the actual codebase. Spawns a parallel agent team to find mismatches.
version: 1.0.0
---

# Verifying Spec — TECHSPEC Compliance Check

Cross-reference `docs/mvp/TECHSPEC.md` against the actual codebase to find spec-vs-implementation mismatches using 3 parallel verification agents.

## When to Use

- User says "verify spec", "check spec compliance", or "techspec audit"
- After completing a vertical slice to ensure code matches spec
- Before deployment or PR review
- After updating TECHSPEC.md to check if existing code needs changes

## Preconditions

- `docs/mvp/TECHSPEC.md` must exist
- Implementation code must exist (at least `src/` or `app/` directory with source files)
- If no implementation code exists, exit early: "No implementation code found. Run this after completing at least one slice."

## Workflow

### Phase 1: SETUP

1. Read `docs/mvp/TECHSPEC.md` to confirm it exists
2. Check if implementation code exists:
   - Look for `src/` or `app/` directories with `.ts`/`.tsx` files
   - If empty, display message and stop
3. Note the current date/time for the report filename

### Phase 2: SPAWN

Launch all 3 verification agents **in a single parallel call** using the Task tool with `subagent_type: "Explore"`:

**Agent 1: data-model-verifier**
```
Prompt: "You are the data-model-verifier agent. Read docs/mvp/TECHSPEC.md sections 'Data Models', 'Data Layer', and 'Repository Interface'. Then search the codebase to verify each data model, interface, type, and repository implementation matches the spec. Follow the verification checklist in your agent definition at .claude/agents/data-model-verifier.md. Report findings using the structured output format specified there."
```

**Agent 2: api-contract-verifier**
```
Prompt: "You are the api-contract-verifier agent. Read docs/mvp/TECHSPEC.md sections 'API Contracts' and 'AI Pipeline Details'. Then search the codebase to verify the API endpoint, request/response schemas, LangChain pipeline, dedup strategy, weather integration, and cost controls match the spec. Follow the verification checklist in your agent definition at .claude/agents/api-contract-verifier.md. Report findings using the structured output format specified there."
```

**Agent 3: architecture-security-verifier**
```
Prompt: "You are the architecture-security-verifier agent. Read docs/mvp/TECHSPEC.md sections 'Architecture Overview', 'Tech Stack', 'Edge States & Error Handling', 'Security Considerations', and 'Hosting & Deployment'. Then check package.json, tsconfig.json, directory structure, component files, and configuration against the spec. Follow the verification checklist in your agent definition at .claude/agents/architecture-security-verifier.md. Report findings using the structured output format specified there."
```

### Phase 3: COLLECT

Wait for all 3 agents to return their findings. Each agent produces a structured report with MATCH/MISMATCH/MISSING/EXTRA counts and detailed findings tables.

### Phase 4: AGGREGATE

Merge all findings into a single compliance report:

1. Sum up totals across all 3 agents (total MATCH, MISMATCH, MISSING, EXTRA)
2. Calculate overall compliance percentage: `MATCH / (MATCH + MISMATCH + MISSING) * 100`
3. Classify severity of each MISMATCH:
   - **Critical** — Breaks correctness, data contracts, or security (e.g., wrong field types, missing validation)
   - **Warning** — Deviates from spec but may be intentional (e.g., extra utility field, different naming)
   - **Info** — Minor difference or EXTRA items (e.g., helper types not in spec)
4. Compile recommended actions, ordered by severity

### Phase 5: PRESENT

**Save the report** to `.claude/spec-compliance-{YYYY-MM-DD-HH-MM}.md` with this structure:

```markdown
# Spec Compliance Report

**Date:** {date}
**TECHSPEC:** docs/mvp/TECHSPEC.md
**Agents:** data-model-verifier, api-contract-verifier, architecture-security-verifier

## Summary

| Status   | Count |
|----------|-------|
| MATCH    | NN    |
| MISMATCH | NN    |
| MISSING  | NN    |
| EXTRA    | NN    |

**Overall Compliance:** NN% (matches / total spec items)

## Critical Mismatches

| # | Domain | Item | Spec Says | Code Does | Severity |
|---|--------|------|-----------|-----------|----------|
| 1 | ... | ... | ... | ... | Critical |

## Warnings

| # | Domain | Item | Detail | Severity |
|---|--------|------|--------|----------|
| ... |

## Missing Implementations

| # | Domain | Spec Item | TECHSPEC Section |
|---|--------|-----------|------------------|

## Detailed Findings

### Data Models & Repository
[Full findings from data-model-verifier]

### API Contracts & AI Pipeline
[Full findings from api-contract-verifier]

### Architecture, Security & Deployment
[Full findings from architecture-security-verifier]

## Recommended Actions
1. [Priority-ordered list]
```

**Display in chat**: Show the Summary table and any Critical Mismatches. Link to the full saved report for details.

## Integration Points

- Run after `/advancing-slices` as an optional post-completion check
- Run before creating a PR to catch spec drift
- Run after `/reviewing-techspec` updates the spec to identify code that needs updating
