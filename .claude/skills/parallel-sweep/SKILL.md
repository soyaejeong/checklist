---
name: parallel-sweep
description: This skill should be used when the user says "tweep", "parallel sweep", "parallel tdd", or asks to run plan tasks in parallel with a team. Spawns 2 TDD worker agents to execute independent plan sections concurrently while the lead handles Steel Thread, commits, and integration.
version: 1.0.0
---

# Parallel Sweep — Team-Based TDD Execution

Parallelize slice execution by spawning TDD worker agents for independent plan sections. The lead (this session) handles the Steel Thread, serializes all git commits, and runs integration tests.

## When to Use

Trigger this skill when:
- User says "tweep" (primary trigger — short for "team sweep")
- User says "parallel sweep" or "parallel tdd"
- User wants to parallelize slice execution with agent teams

**NOT triggered by "sweep"** — that remains `/sweeping-tdd` for single-agent sequential execution.

## How It Differs from "sweep"

| | `sweep` (sweeping-tdd) | `tweep` (this skill) |
|---|---|---|
| Agents | 1 (lead only) | Lead + 2 workers |
| Section execution | Sequential | Independent sections in parallel |
| Commits | Lead commits directly | Lead commits on behalf of workers |
| Best for | Small plans, debugging | Plans with 3+ independent sections |

## Prerequisites

Before starting a tweep:
- `docs/MASTER_PLAN.md` must exist with unchecked tasks
- Plan sections must have `<!-- parallel: ... -->` metadata comments
- Plan sections must have `<!-- files: ... -->` metadata comments
- `npm run test:unit` must pass (clean starting state)
- `git status` must be clean (no uncommitted changes)

If metadata comments are missing, stop and suggest: "Plan lacks parallelism metadata. Regenerate with `/generating-plans` or add metadata manually."

## Workflow Overview

```
Phase 0: PARSE     →  Read plan, build dependency graph, print summary
Phase 1: STEEL     →  Lead executes Steel Thread sequentially
Phase 2: SPAWN     →  Create team, spawn workers, assign independent sections
Phase 3: SWEEP     →  Workers run TDD; lead serializes commits + manages plan
Phase 4: INTEGRATE →  Shutdown workers, run Integration/E2E tests
Phase 5: CLEANUP   →  TeamDelete, print completion banner
```

## Phase 0: Parse Plan & Build Dependency Graph

1. Read `docs/MASTER_PLAN.md` (symlink to current plan)
2. Parse each section's metadata comments:
   - `<!-- parallel: independent -->` — can run in parallel with other independent sections
   - `<!-- parallel: depends_on=[Section Name] -->` — blocked until named section completes
   - `<!-- parallel: sequential | executor: lead -->` — lead-only (Steel Thread, Integration)
   - `<!-- files: src/path1, tests/path2 -->` — file ownership scope
3. Build ordered execution plan:
   - **Phase 1 (sequential):** Steel Thread sections (`executor: lead`)
   - **Phase 2 (parallel):** Independent sections
   - **Phase 3 (dependent):** Sections with `depends_on` (run after dependencies clear)
   - **Phase 4 (sequential):** Integration sections (`depends_on: ALL`)
4. Validate:
   - Every section has `parallel` metadata
   - No file overlaps between independent sections
   - All `depends_on` references point to valid section names
5. Count unchecked tasks per section

Print summary:

```
--- TWEEP PLAN ---
Steel Thread: [N] tasks (lead)
Parallel sections:
  [INDEPENDENT] [Section Name] (#NN) - [N] tasks | files: [list]
  [INDEPENDENT] [Section Name] (#NN) - [N] tasks | files: [list]
  [DEPENDS ON: X] [Section Name] (#NN) - [N] tasks | files: [list]
Integration: [N] tasks (lead)
Workers: 2
Total tasks: [N]
------------------
```

If all checkboxes are already marked `[x]`:
- Suggest: "All tasks complete. Run `/advancing-slices` to archive and start next slice."

## Phase 1: Steel Thread (Lead Only)

Execute all Steel Thread tasks sequentially using the same TDD cycle as `/sweeping-tdd`:

For each unchecked Steel Thread task:
1. **RED** — Write failing test, run `npm run test:unit`, confirm meaningful failure
2. **GREEN** — Minimum implementation, run `npm run test:unit`, all pass
3. **REFACTOR** (optional) — commit `[S]` prefix if structural changes
4. **COMPLETE** — Mark checkbox `[x]` in MASTER_PLAN.md, run tests + lint, commit `[B]`

When all Steel Thread tasks are done:

```
=== STEEL THREAD COMPLETE ===
Foundation validated. Spawning workers for parallel sections.
=============================
```

## Phase 2: Spawn Team & Assign Sections

### Create Team

```
TeamCreate with team_name: "tdd-sweep-{slice-number}"
```

### Spawn Workers

Spawn exactly 2 workers using the Task tool:

```
For each worker (worker-1, worker-2):
  Task tool with:
    subagent_type: "general-purpose"
    team_name: "tdd-sweep-{slice-number}"
    name: "worker-{N}"
```

### Assign Initial Sections

Select up to 2 independent sections (those with `parallel: independent` and all unchecked tasks). For each worker, send a section assignment message:

```
SECTION ASSIGNMENT
Section: [Section Name] (#[issue-number])
Tasks:
  1. [checkbox text]
  2. [checkbox text]
  ...
File scope (you may ONLY create/modify these):
  - [src/path/file.ts]
  - [tests/path/file.test.ts]
Test directory: [tests/subdirectory/]

Follow the TDD cycle in your agent definition (.claude/agents/tdd-worker.md).
Report each task completion via SendMessage. Wait for my commit confirmation before proceeding.
```

If there are more sections than workers (e.g., 4 sections, 2 workers), assign the first 2 independent sections now. The remaining sections will be assigned as workers finish.

## Phase 3: Sweep (Workers + Lead Coordination)

The lead enters a coordination loop, processing messages from workers:

### On TASK_COMPLETE Message

1. Run `npm run test:unit` to validate worker's code
2. If tests pass:
   a. Run `git add [files listed by worker]`
   b. If worker included a refactor: `git commit -m "[S] refactor description (#NN)"`
   c. Run `git add [behavioral files]`
   d. `git commit -m "[B] description (#NN)"`
   e. Mark the task checkbox `[x]` in `docs/MASTER_PLAN.md`
   f. Commit the plan update: `git add docs/MASTER_PLAN.md && git commit -m "[S] Mark task complete in plan"`
   g. Send confirmation to worker: "Commit confirmed. Proceed to next task."
3. If tests fail:
   a. Send error details to worker: "Tests failed after your changes. [output]. Please fix."
   b. Do NOT commit
   c. Do NOT mark checkbox

### On SECTION_COMPLETE Message

1. Extract issue number from the section header in MASTER_PLAN.md
2. Verify all checkboxes in that section are marked `[x]`
3. Close the GitHub issue: `gh issue close [number]`
4. Print section-complete banner:

```
=== SECTION COMPLETE ===
Section: [Section Name] (#NN)
Tasks completed: [count]
Issue #NN closed.
========================
```

5. Check for unassigned sections:
   - If an independent section has unchecked tasks → assign to this worker
   - If a `depends_on` section is now unblocked (its dependency just completed) → assign to this worker
   - If no sections remain → send shutdown_request to this worker

### On ERROR Message

1. Halt the entire tweep (same as sweeping-tdd error halting)
2. Send shutdown_request to all workers
3. Print halt banner:

```
--- TWEEP HALTED ---
Failed at: [task description]
Section: [section name] (#NN)
Worker: [worker-N]
Phase: [RED|GREEN|REFACTOR]
Error: [brief description]
Progress: [X]/[N] tasks completed
--------------------
Fix the issue, then say "tweep" to resume.
```

### Dependency Resolution

When a section completes that other sections depend on:
1. Check all `depends_on` sections
2. If a section's dependency is now complete AND it has unchecked tasks:
   - Assign it to the next idle worker
3. If both workers are busy, queue the section (it will be assigned when a worker finishes)

## Phase 4: Integration (Lead Only)

After all section workers have completed or shut down:

1. Send shutdown_request to any remaining workers
2. Wait for shutdown confirmations
3. Run `npm run test:unit` to confirm full suite passes
4. Execute Integration/E2E test tasks sequentially (same TDD cycle as Steel Thread)
5. Mark Integration checkboxes, commit with `[B]` prefix

## Phase 5: Cleanup

1. TeamDelete to remove team files
2. Print completion banner:

```
=== TWEEP COMPLETE ===
All [N] tasks completed across [M] sections.
All section issues closed.
Workers used: 2
Run /advancing-slices to archive this slice and generate the next one.
=======================
```

## Resumability

Like `/sweeping-tdd`, tweep is inherently resumable. It always starts from the first unchecked `- [ ]` task and reads metadata to determine which sections are complete. If a session ends mid-tweep:
- Workers are gone (they don't persist across sessions)
- Say "tweep" again to re-parse, re-spawn, and resume from where you left off
- Already-completed sections and tasks are skipped automatically

## Error Halting Rules

The tweep **must stop all workers and halt** when:
- `npm run test:unit` fails when validating a worker's TASK_COMPLETE
- `npm run lint` fails during Integration phase
- A git commit fails (hook rejects it)
- A worker reports an ERROR it cannot resolve

On halt, always:
1. Shutdown all workers
2. TeamDelete
3. Print TWEEP HALTED banner with progress and instructions to resume

## Quick Reference

| Phase | Actor | Action | Verification |
|-------|-------|--------|--------------|
| 0: Parse | Lead | Read plan, parse metadata | Summary printed, no file overlaps |
| 1: Steel | Lead | Sequential TDD for Steel Thread | All Steel Thread tasks green |
| 2: Spawn | Lead | TeamCreate + assign sections | 2 workers active with assignments |
| 3: Sweep | Workers + Lead | Parallel TDD + commit serialization | Checkboxes marked, issues closed |
| 4: Integrate | Lead | Shutdown workers + sequential E2E | Integration tests green |
| 5: Cleanup | Lead | TeamDelete | Clean state, banner printed |
