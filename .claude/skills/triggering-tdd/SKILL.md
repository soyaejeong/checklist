---
name: triggering-tdd
description: This skill should be used when the user says "go", "next test", "tdd cycle", "red green refactor", "start tdd", or asks to implement the next task from MASTER_PLAN.md. Wraps superpowers:test-driven-development with project context.
version: 1.0.0
---

# Triggering TDD - TDD Workflow

Execute the Test-Driven Development cycle for the next task in MASTER_PLAN.md.

## When to Use

Trigger this skill when:
- User says "go" (the project's TDD trigger word)
- User asks to implement the next task
- User wants to continue the TDD cycle
- User mentions "red green refactor"

## Workflow Overview

```
1. IDENTIFY  → Find next [ ] checkbox in MASTER_PLAN.md
2. RED       → Write failing test
3. GREEN     → Write minimum code to pass
4. REFACTOR  → Clean up (optional, commit [S] separately)
5. COMPLETE  → Mark checkbox, commit [B]
```

## Phase 1: Identify Task

Read `docs/MASTER_PLAN.md` (symlink to current plan).

Find the first unchecked item:
```markdown
- [ ] Task description here  ← This is the next task
- [x] Already completed
```

If all checkboxes are marked:
- Current slice is complete
- Suggest: "All tasks complete. Run `/advancing-slices` to archive and start next slice."

## Phase 2: Red (Write Failing Test)

### Locate Test File

Follow the test directory structure:
```
tests/
├── api/          # For src/api/ functions
├── hooks/        # For src/hooks/ custom hooks
├── components/   # For src/components/
├── lib/          # For src/lib/ utilities
└── fixtures/     # Reusable test data
```

### Write Minimal Failing Test

```typescript
// Example test structure
describe('FeatureName', () => {
  it('should [expected behavior from task]', () => {
    // Arrange
    // Act
    // Assert - this should fail
  });
});
```

### Run Tests

```bash
npm run test:unit
```

Confirm the test fails with a meaningful error (not a syntax error).

## Phase 3: Green (Implement)

Write the **minimum code** to make the test pass.

Rules:
- No extra features
- No premature optimization
- No refactoring yet
- Just make it work

Run tests again:
```bash
npm run test:unit
```

All tests must pass before proceeding.

## Phase 4: Refactor (Optional)

Only refactor if there's clear duplication or clarity issues.

If refactoring:
1. Run tests before changes
2. Make one structural change
3. Run tests after
4. Commit with `[S]` prefix BEFORE behavioral commit

```bash
git add .
git commit -m "[S] Extract helper function for X"
```

## Phase 5: Complete

### Mark Checkbox

Edit `docs/MASTER_PLAN.md`:
```markdown
- [x] Task description here  ← Change [ ] to [x]
```

### Final Test Run

```bash
npm run test:unit
npm run lint
```

Both must pass with no warnings.

### Commit

```bash
git add .
git commit -m "[B] Brief description of what was implemented (#NN)"
```

Include the GitHub issue number from the MASTER_PLAN section header (e.g., `### Section Name (#42)`).

### Update GitHub Issue

After committing, update the associated GitHub issue:
1. Find the section header containing this task in MASTER_PLAN.md — it has `(#NN)` suffix
2. If ALL checkboxes in this section are now marked `[x]`, close the issue:
   ```bash
   gh issue close NN
   ```

## Project-Specific Context

### Testing Framework

- **Vitest** for unit tests
- **React Testing Library** for component tests
- **MSW** for API mocking

### Test Commands

| Command | Use Case |
|---------|----------|
| `npm run test:unit` | Fast TDD feedback |
| `npm run test:unit -- --watch` | Watch mode |
| `npm run test:e2e` | Pre-deployment only |

### Common Test Patterns

For hooks:
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useMyHook } from '@/hooks/useMyHook';

describe('useMyHook', () => {
  it('should return expected value', async () => {
    const { result } = renderHook(() => useMyHook());
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });
});
```

For components:
```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

## Integration with superpowers:test-driven-development

This skill wraps and extends the base TDD skill with:
- MASTER_PLAN.md workflow
- Project-specific test patterns
- Vitest/React Testing Library conventions
- [B]/[S] commit prefix enforcement

For general TDD methodology, invoke `superpowers:test-driven-development`.

## Quick Reference

| Phase | Action | Verification |
|-------|--------|--------------|
| Red | Write failing test | Test fails meaningfully |
| Green | Minimum implementation | All tests pass |
| Refactor | Clean up (optional) | Tests still pass, commit [S] |
| Complete | Mark checkbox, commit | [B] prefix, tests green |
