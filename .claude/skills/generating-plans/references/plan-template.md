# Slice NN: [Slice Name]

**Version:** 1.0
**Created:** [YYYY-MM-DD]
**Target Completion:** [YYYY-MM-DD]
**Status:** In Progress

---

## Scope

**User Journey:** [Which user journey from TECHSPEC/PRD does this implement?]

**Layers Involved:**
- Database: [Tables, functions, RLS policies]
- Backend/API: [Endpoints, business logic]
- Hooks/Logic: [React hooks, utilities]
- UI/Components: [Pages, forms, components]

**Duration Estimate:** [1-3 days]

**Dependencies:** [What must be complete first]

**TECHSPEC Coverage:**
- Section X.Y: [Relevant section]

---

## Exit Criteria

- [ ] All tests in this plan passing
- [ ] Feature works end-to-end (manual verification)
- [ ] No TypeScript/linter errors
- [ ] Code committed (structural and behavioral changes separated)
- [ ] Ready to archive and move to next slice

---

## Steel Thread

**Goal:** Build the thinnest possible end-to-end version first to prove integration.

- [ ] Test: [e.g., "Database accepts and returns basic record"]
- [ ] Test: [e.g., "API endpoint responds with 200"]
- [ ] Test: [e.g., "UI component renders without errors"]

**Commit checkpoint:** Steel thread complete - end-to-end proof working

---

## Test Checklist

*Each test = one session: Red → Green → Refactor → Mark done*

### [Section Name]

#### Behavioral Tests
- [ ] Test: [Specific test - session-sized]
- [ ] Test: [Specific test - session-sized]

#### Structural Changes (if needed)
- [ ] Refactor: [e.g., "Extract helper function"]

---

### Integration/E2E Tests

- [ ] Test: [Full user flow - session-sized if possible, or broken into steps]

---

## Refactoring Opportunities

*Discovered during development. Address before moving to next slice.*

- [ ] Refactor: [description]

---

## Next Slice

**Planned:** [Name of next vertical slice]
**Dependencies:** [What must be complete first]
**Estimated Duration:** [1-3 days]

---

## Notes & Discoveries

*Capture learnings, deviations from TECHSPEC, technical debt*

- [Date]: [Note about decision made]
- [Date]: [Technical debt item - reference issue/TODO]
