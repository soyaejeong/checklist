---
name: reviewing-design
description: This skill should be used when the user says "reviewing design", "design review", "review this design", "UI review", "UX feedback", "design consensus", or asks for multi-model feedback on a UI design proposal. Sends proposals through 5-perspective consensus with 3 rounds of iterative refinement.
version: 1.0.0
---

# Design Review - Multi-Model Design Consensus

Send UI design proposals through multi-model consensus for structured design feedback with actionable recommendations.

## When to Use

Trigger this skill when:
- User says "design review", "review this design", or "design consensus"
- User wants feedback on a UI component, layout, or interaction pattern
- User shares a screenshot for design evaluation
- User describes a proposed UI change and wants expert opinions

## Workflow Overview

```
1. GATHER    → Collect proposal + design system context
2. DISCOVER  → Call mcp__zen__listmodels to find available models
3. ROUND 1   → Initial perspectives from all 5 panelists
4. ROUND 2   → Cross-critique and refinement
5. ROUND 3   → Final synthesis with convergence check
6. PRESENT   → Structured output with actionable recommendations
```

## Input Types

The skill accepts three types of input:

1. **Text description** — A written description of the UI design proposal
2. **Component name** — A specific component to evaluate (read its source first)
3. **Screenshot/image** — A file path to a screenshot for visual review

## Phase 1: Gather Context

### If component name provided:
- Read the component source file from `src/components/` or `src/pages/`
- Note the component's current implementation details

### If screenshot provided:
- Note the image path for passing to consensus tool

### If text description provided:
- Use the description directly as the proposal

### Always include design system context:
- Read the project's design tokens/theme configuration
- Include color palette, typography, spacing, and component library info

## Phase 2: Discover Available Models

Call `mcp__zen__listmodels` to see which models are available.

Select 5 models for the panel. Preferred assignments (adjust based on availability):
- UX Expert → gemini-2.5-pro (strong at structured analysis)
- Visual Designer → gpt-5 or gpt-5-pro (strong at creative/aesthetic evaluation)
- Accessibility Specialist → gemini-2.5-pro (thorough compliance checking)
- Mobile-First Advocate → gpt-5-mini or similar (fast, practical feedback)
- Product Manager → gpt-5 or gpt-5-pro (pragmatic implementation scoping)

If a preferred model is unavailable, substitute with any available model.

## Phase 3: Run 3-Round Consensus

### Round 1 — Initial Perspectives

Call `mcp__zen__consensus` with:

```json
{
  "step": "[PROPOSAL DESCRIPTION + DESIGN SYSTEM CONTEXT FROM PHASE 1]",
  "step_number": 1,
  "total_steps": 3,
  "next_step_required": true,
  "findings": "Initial evaluation of design proposal",
  "model": "[PRIMARY_MODEL]",
  "models": [
    {
      "model": "[MODEL_1]",
      "stance": "neutral",
      "stance_prompt": "You are a UX Expert. Evaluate usability, information architecture, user flow clarity, cognitive load, and interaction patterns. Focus on whether users can accomplish tasks efficiently and intuitively. Reference Nielsen's heuristics where relevant. Provide specific, actionable feedback."
    },
    {
      "model": "[MODEL_2]",
      "stance": "neutral",
      "stance_prompt": "You are a Visual Designer. Evaluate aesthetic quality, visual hierarchy, typography, spacing, color usage, and consistency with the design system. Focus on whether the design feels cohesive and professional. Suggest specific CSS/Tailwind improvements."
    },
    {
      "model": "[MODEL_3]",
      "stance": "against",
      "stance_prompt": "You are an Accessibility Specialist. Critically evaluate WCAG 2.1 AA compliance: color contrast ratios (4.5:1 for text, 3:1 for large text), touch target sizes (44x44px minimum), keyboard navigation, screen reader support (ARIA), focus indicators, and semantic HTML. Flag any violations with severity levels."
    },
    {
      "model": "[MODEL_4]",
      "stance": "against",
      "stance_prompt": "You are a Mobile-First Advocate. Critically evaluate how this design performs on small screens (375px width), touch interactions, thumb zone reachability, scroll behavior, and performance implications (DOM complexity, render cost). Flag anything that would degrade the mobile experience. Suggest responsive breakpoint strategies."
    },
    {
      "model": "[MODEL_5]",
      "stance": "neutral",
      "stance_prompt": "You are a Product Manager with engineering background. Evaluate whether the proposed design changes are realistically implementable within a reasonable timeframe using the existing tech stack. Flag over-engineering, unnecessary complexity, or scope creep. Prioritize suggestions by impact-to-effort ratio. Push back on changes that add marginal value but significant implementation cost."
    }
  ]
}
```

### Round 2 — Cross-Critique and Refinement

Call `mcp__zen__consensus` with the Round 1 results, asking panelists to:
- Respond to each other's feedback
- Identify conflicts between perspectives (e.g., visual richness vs mobile performance)
- Refine recommendations into concrete, prioritized actions
- Resolve disagreements with trade-off analysis

Use `step_number: 2`, `total_steps: 3`, `next_step_required: true`.

### Round 3 — Final Synthesis

Call `mcp__zen__consensus` with Round 2 results, asking for:
- Final consolidated recommendations
- Clear priority ordering (must-do / should-do / nice-to-have)
- Implementation sequence (what to build first)
- Any remaining unresolved concerns

Use `step_number: 3`, `total_steps: 3`, `next_step_required: false`.

### Extended Analysis (Optional)

If the user requests deeper analysis, continue with rounds 4-5 using the same pattern. Check for convergence: if Round N and Round N-1 produce substantially similar recommendations, stop early.

## Phase 4: Present Results

Format the final output as:

---

### Design Review Results

**Proposal:** [brief summary of what was reviewed]
**Rounds completed:** [N]
**Panel:** [list models used with their roles]

#### Strengths
- [Bullet points of what works well, noted across multiple perspectives]

#### Issues Found

| Issue | Severity | Perspective | Recommendation |
|-------|----------|-------------|----------------|
| [description] | Critical/Major/Minor | UX/Visual/A11y/Mobile/PM | [specific fix] |

#### Prioritized Recommendations

**Must-Do (Critical/Major):**
1. [Concrete change with code/CSS example where applicable]
2. ...

**Should-Do (Improves quality):**
1. ...

**Nice-to-Have (Polish):**
1. ...

#### Implementation Sequence
1. [What to build/change first and why]
2. [Next step]
3. ...

#### Unresolved Trade-offs
- [Any remaining tensions between perspectives, with the PM's assessment]

---

## Integration with Other Skills

- After design review, use `/triggering-tdd` to implement approved changes
- Use `/reviewing-techspec` if design changes require architecture updates
- Use `/advancing-slices` to create a new vertical slice for implementation
