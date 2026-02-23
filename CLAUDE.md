# Checklist Development Guidelines

## Quick Reference

| Action | How |
|--------|-----|
| Start next task | Say "go" or use `/triggering-tdd` |
| Batch all tasks | Say "sweep" or use `/sweeping-tdd` |
| Team sweep (parallel) | Say "tweep" or use `/parallel-sweep` |
| Generate next plan | Use `/generating-plans` |
| Complete slice | Use `/advancing-slices` |
| Commit | Prefix with `[B]` or `[S]` + include `(#issue)` from MASTER_PLAN |
| Close section issue | `gh issue close <number>` when section complete |
| Verify spec compliance | Say "verify spec" or use `/verifying-spec` |
| View roadmap | See [ROADMAP.md](docs/ROADMAP.md) |
| Create backend worktree | `git worktree add ../checklist-backend -b feat/ai-pipeline` |
| Merge backend | `git merge feat/ai-pipeline` (before integration slice) |

## Documentation

- [TECHSPEC.md](docs/mvp/TECHSPEC.md) - Architecture, file trees, and module boundaries
- [ROADMAP.md](docs/ROADMAP.md) - MVP implementation roadmap (7 slices, 4 waves, worktree strategy)
- [MASTER_PLAN.md](docs/MASTER_PLAN.md) - Current tasks (symlink to active plan)
- [TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md) - Test patterns and organization
- [PLAN_GENERATION_GUIDE.md](.claude/skills/generating-plans/references/PLAN_GENERATION_GUIDE.md) - Plan quality standards (task sizing, anti-patterns, worktree parallelism)

## Worktree Workflow

Two worktrees for parallel MVP execution (see [ROADMAP.md](docs/ROADMAP.md)):
- **main** — Frontend (`src/`), Supabase schema, project config
- **feat/ai-pipeline** — Backend (`backend/`), Python/FastAPI

Each worktree runs as an independent Claude Code session with its own tweep. Single merge point before the integration slice (Slice 7). File ownership is strict: no file is ever edited by both worktrees.

## Core Principles

Follow Kent Beck's TDD and Tidy First approach:

1. **Red** - Write a failing test first
2. **Green** - Write minimum code to pass
3. **Refactor** - Clean up only when tests are green
4. **Commit** - Use `[B]` for behavioral, `[S]` for structural changes

## Commit Discipline

All commits require a prefix (enforced by `tdd-commit-guard` hook):

- **[B]** - Behavioral changes (features, bug fixes)
- **[S]** - Structural changes (refactoring, renaming)

Never mix structural and behavioral changes in the same commit.

## GitHub Issue Tracking

After every git commit for a MASTER_PLAN section task:
1. Include the GitHub issue number in the commit message: `[B] Add feature (#42)`
2. When ALL tasks in a section are complete, close the issue: `gh issue close <number>`
3. When starting work on a section, move the issue to "In Progress" on the project board

This is mandatory, not optional. Every section in MASTER_PLAN.md has an associated GitHub issue number in its header (e.g., `### Section Name (#42)`).

## Workflow Order

1. Find next task in MASTER_PLAN.md (or say "go")
2. Write failing test → implement → refactor
3. Mark checkbox in MASTER_PLAN.md
4. Run tests: `npm run test:unit`
5. Commit with `[B]` or `[S]` prefix

## Testing

| Command | Use Case |
|---------|----------|
| `npm run test:unit` | Fast TDD feedback (~1 second) |
| `npm run test:e2e` | Pre-deployment validation (~10 min) |

## Code Quality

- Eliminate duplication
- Express intent through naming
- Keep methods small and focused
- Use the simplest solution that works

## Automated Enforcement

The following hooks enforce these guidelines automatically:

- **tdd-commit-guard** - Validates `[B]`/`[S]` prefix on commits
- **auto-commit-guard** - Blocks stopping with uncommitted code changes

## Auto-Commit Rule

Never leave uncommitted code changes. After any implementation work:
1. Run `npm run test:unit`
2. Commit with `[B]` or `[S]` prefix
3. A Stop hook will catch and block you if you forget

## Skills Available

- **triggering-tdd** - Execute TDD cycle for next MASTER_PLAN task
- **sweeping-tdd** - Batch TDD: loop through all remaining MASTER_PLAN tasks
- **parallel-sweep** - Team-based parallel TDD: spawns 2 workers for independent sections
- **generating-plans** - Create new MASTER_PLAN from template for next slice
- **advancing-slices** - Archive completed slice, generate next one
- **filing-bugs** - Issue-first bug workflow
- **reviewing-techspec** - Multi-model consensus on TECHSPEC quality
- **reviewing-design** - Multi-model design consensus
- **verifying-spec** - Agent team that cross-references TECHSPEC against code
