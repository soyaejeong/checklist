# Reviewing TechSpec Skill

A Claude Code skill that evaluates and improves technical specifications through multi-model consensus discussion using the zen MCP server.

## Overview

This skill orchestrates iterative discussions between multiple AI models (gemini-2.5-pro and gpt-5-pro) acting as critical reviewers to identify issues and suggest improvements in technical specifications.

## Features

- **Multi-Model Consensus**: Uses zen MCP's consensus tool with two models as critics
- **Auto-Convergence Detection**: Automatically detects when recommendations stabilize
- **Iterative Refinement**: Runs up to 5 rounds, focusing on unresolved issues in later rounds
- **Comprehensive Reports**: Generates timestamped markdown reports with all rounds
- **Chat Summaries**: Provides concise summaries in the Claude Code interface

## Usage

### Via Natural Language Trigger

Simply say one of the trigger phrases:
- "improve techspec"
- "evaluate techspec"
- "review techspec"
- "techspec quality"
- "group iteration on techspec"

Claude Code will automatically invoke this skill.

### Via Slash Command

```
/reviewing-techspec
```

### Direct Execution (for testing)

```bash
cd .claude/skills/reviewing-techspec
node index.js
```

## How It Works

1. **Load**: Reads `docs/TECHSPEC.md` from the project root
2. **Chunk**: If content exceeds 50K characters, uses first 30K
3. **Round 1**: Both critics independently evaluate the techspec
4. **Rounds 2-5**: Critics respond to findings from previous rounds
5. **Convergence Check**: Compares findings between rounds using similarity metrics
6. **Report Generation**: Saves detailed report to `.claude/techspec-evaluations.md`
7. **Summary**: Displays concise summary in chat

## Consensus Panel

### Critic #1: gemini-2.5-pro
- **Role**: Critical Architect
- **Focus**: Architecture flaws, scalability concerns, design inconsistencies
- **Stance**: Against (critical evaluation mode)

### Critic #2: gpt-5-pro
- **Role**: Critical Reviewer
- **Focus**: Security vulnerabilities, maintainability issues, operational risks
- **Stance**: Against (critical evaluation mode)

## Output

### Report File
Location: `.claude/techspec-evaluations.md`

Format:
```markdown
## Evaluation - 2026-02-20

**Timestamp:** 2026-02-20T12:34:56.789Z
**Status:** Converged / Max rounds reached
**Total Rounds:** 3

### Round 1
[Detailed findings from first round]

### Round 2
[Refined findings focusing on critical issues]

### Conclusion
[Summary of convergence status and key recommendations]
```

### Chat Summary
Displays in Claude Code chat:
- Convergence status
- Number of rounds completed
- Key findings from final round (first 500 chars)
- Link to full report

## Configuration

### Convergence Threshold
Currently set to 70% similarity between rounds. Adjustable in `hasConverged()` function.

### Max Rounds
Default: 5 rounds
Can be overridden in options: `runEvaluation(path, { maxRounds: 3 })`

### Content Chunking
- Threshold: 50,000 characters
- Chunk size: 30,000 characters (first part)

## Testing

### Run Tests
```bash
npm run test:skill
```

## Development

### File Structure
```
reviewing-techspec/
├── skill.json          # Metadata and triggers
├── index.js            # Main implementation (~300 lines)
├── index.test.js       # Jest test suite
└── README.md           # This file
```

### Key Functions
- `loadTechspec()`: Loads TECHSPEC.md
- `chunkIfNeeded()`: Handles large files
- `buildConsensusConfig()`: Configures zen MCP consensus call
- `calculateSimilarity()`: Word-frequency based similarity
- `hasConverged()`: Checks if discussion has converged
- `runEvaluation()`: Main orchestration loop
- `generateReport()`: Creates markdown report
- `callZenConsensus()`: Interfaces with zen MCP

## Requirements

- Node.js 18+
- zen MCP server configured in Claude Code
- `docs/TECHSPEC.md` in project root
