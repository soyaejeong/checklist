const fs = require('fs');
const path = require('path');

/**
 * Loads the techspec file from the given path
 * @param {string} techspecPath - Absolute path to TECHSPEC.md
 * @returns {string} The content of the techspec file
 */
function loadTechspec(techspecPath) {
  if (!fs.existsSync(techspecPath)) {
    throw new Error(`Techspec file not found at: ${techspecPath}`);
  }
  return fs.readFileSync(techspecPath, 'utf8');
}

/**
 * Chunks content if it exceeds 50K characters
 * @param {string} content - The content to chunk
 * @returns {string} Chunked content (first 30K chars if over 50K)
 */
function chunkIfNeeded(content) {
  if (content.length > 50000) {
    return content.substring(0, 30000);
  }
  return content;
}

/**
 * Builds the consensus configuration for zen MCP
 * @param {string} techspecContent - The techspec content
 * @param {number} roundNumber - Current round number (1-based)
 * @param {string} previousSummary - Summary from previous round (optional)
 * @returns {object} Configuration for zen consensus tool
 */
function buildConsensusConfig(techspecContent, roundNumber, previousSummary = null) {
  const isFirstRound = roundNumber === 1;

  let prompt = '';
  if (isFirstRound) {
    prompt = `You are a panel of expert engineers critically evaluating a technical specification.
Your shared goal is to improve the quality of this techspec through rigorous critique.

Here is the techspec to evaluate:
---
${techspecContent}
---

Each panel member will provide critical analysis from their perspective to identify issues and suggest concrete improvements.`;
  } else {
    prompt = `This is Round ${roundNumber} of the techspec evaluation.

Previous round summary:
---
${previousSummary}
---

Techspec content:
---
${techspecContent}
---

Focus on unresolved issues and new insights. Be concrete and actionable.`;
  }

  return {
    step: prompt,
    step_number: roundNumber,
    total_steps: 5,
    next_step_required: roundNumber < 5,
    findings: 'Evaluating techspec quality and identifying improvements',
    model: 'gemini-2.5-pro',
    models: [
      {
        model: 'gemini-2.5-pro',
        stance: 'against',
        stance_prompt: 'Your role is to critically evaluate this techspec\'s architectural decisions. Identify structural weaknesses, scalability bottlenecks, over-engineering, under-specification, and architectural anti-patterns. Be rigorous and suggest concrete improvements.'
      },
      {
        model: 'gpt-5-pro',
        stance: 'against',
        stance_prompt: 'Your role is to scrutinize this techspec for security vulnerabilities, maintainability problems, operational complexity, and incomplete specifications. Find gaps, ambiguities, and risks that could cause project failure. Demand clarity and completeness.'
      }
    ]
  };
}

/**
 * Calculates similarity between two strings using a simple metric
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score between 0 and 1
 */
function calculateSimilarity(str1, str2) {
  // Normalize and tokenize
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);

  // Count word frequencies
  const freq1 = {};
  const freq2 = {};

  words1.forEach(word => freq1[word] = (freq1[word] || 0) + 1);
  words2.forEach(word => freq2[word] = (freq2[word] || 0) + 1);

  // Calculate overlap (considering frequency)
  const allWords = new Set([...words1, ...words2]);
  let overlap = 0;
  let total = 0;

  allWords.forEach(word => {
    const count1 = freq1[word] || 0;
    const count2 = freq2[word] || 0;
    overlap += Math.min(count1, count2);
    total += Math.max(count1, count2);
  });

  return total > 0 ? overlap / total : 0;
}

/**
 * Checks if consensus has converged between rounds
 * @param {string} currentFindings - Findings from current round
 * @param {string|null} previousFindings - Findings from previous round
 * @returns {boolean} True if converged (>70% similar)
 */
function hasConverged(currentFindings, previousFindings) {
  if (!previousFindings) {
    return false;
  }

  const similarity = calculateSimilarity(currentFindings, previousFindings);
  return similarity > 0.70;
}

/**
 * Generates a markdown report of the evaluation
 * @param {Array} rounds - Array of round results
 * @param {boolean} converged - Whether consensus was reached
 * @returns {string} Formatted markdown report
 */
function generateReport(rounds, converged) {
  const timestamp = new Date().toISOString();
  const date = timestamp.split('T')[0];
  const time = timestamp.split('T')[1].substring(0, 5); // HH:MM

  let report = `# TechSpec Evaluation Report\n\n`;
  report += `**Date:** ${date} ${time}\n`;
  report += `**Status:** ${converged ? 'Converged' : 'Max rounds reached'}\n`;
  report += `**Total Rounds:** ${rounds.length}\n\n`;

  rounds.forEach((round, index) => {
    report += `## Round ${index + 1}\n\n`;
    report += `${round.findings}\n\n`;
  });

  if (converged) {
    report += `## Conclusion\n\nConsensus reached. The evaluation converged on key recommendations.\n\n`;
  } else {
    report += `## Conclusion\n\nMaximum rounds (5) reached. See final round for latest recommendations.\n\n`;
  }

  return report;
}

/**
 * Generates a concise summary for chat output
 * @param {Array} rounds - Array of round results
 * @param {boolean} converged - Whether consensus was reached
 * @param {string} reportFilename - Name of the generated report file
 * @returns {string} Concise summary
 */
function generateChatSummary(rounds, converged, reportFilename) {
  const lastRound = rounds[rounds.length - 1];
  const status = converged ? 'Consensus reached' : 'Max rounds reached';

  return `## TechSpec Evaluation Complete

**Status:** ${status} after ${rounds.length} round(s)
**Full report:** .claude/${reportFilename}

### Key Findings (Final Round):

${lastRound.findings.substring(0, 500)}...

Review the full report for detailed analysis across all rounds.`;
}

/**
 * Calls the zen MCP consensus tool
 * @param {object} config - Consensus configuration
 * @returns {Promise<object>} Result from consensus tool
 */
async function callZenConsensus(config) {
  // This function will be called by Claude Code's MCP infrastructure
  // When the skill is invoked, Claude Code will intercept this call
  // and route it to the zen MCP server

  // For testing purposes, we check if we're in test mode
  if (process.env.NODE_ENV === 'test') {
    return {
      findings: `Test findings for round ${config.step_number}`
    };
  }

  // In production, this would be handled by Claude Code's skill system
  // which automatically connects to available MCP servers
  throw new Error('Zen MCP consensus tool not available. This skill must be run through Claude Code.');
}

/**
 * Runs the complete evaluation process
 * @param {string} techspecPath - Path to TECHSPEC.md
 * @param {object} options - Options (maxRounds, consensusCall for testing)
 * @returns {Promise<Array>} Array of round results
 */
async function runEvaluation(techspecPath, options = {}) {
  const maxRounds = options.maxRounds || 5;
  const consensusCall = options.consensusCall; // For testing

  // Load and prepare techspec
  const rawContent = loadTechspec(techspecPath);
  const techspecContent = chunkIfNeeded(rawContent);

  const rounds = [];
  let previousFindings = null;
  let converged = false;

  console.log(`\nStarting TechSpec Evaluation (max ${maxRounds} rounds)\n`);

  for (let roundNum = 1; roundNum <= maxRounds; roundNum++) {
    console.log(`Round ${roundNum}...`);

    const config = buildConsensusConfig(
      techspecContent,
      roundNum,
      previousFindings
    );

    // Call consensus tool (or mock for testing)
    let result;
    if (consensusCall) {
      result = consensusCall(config);
    } else {
      result = await callZenConsensus(config);
    }

    rounds.push(result);

    // Check for convergence
    if (hasConverged(result.findings, previousFindings)) {
      console.log(`Convergence detected after round ${roundNum}\n`);
      converged = true;
      break;
    }

    previousFindings = result.findings;
  }

  if (!converged) {
    console.log(`Max rounds (${maxRounds}) reached\n`);
  }

  // Generate report
  const report = generateReport(rounds, converged);

  // Create timestamped filename: techspec-evaluation-YYYY-MM-DD-HH-MM.md
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const timestamp = `${year}-${month}-${day}-${hours}-${minutes}`;

  const projectRoot = path.resolve(__dirname, '../../..');
  const reportFilename = `techspec-evaluation-${timestamp}.md`;
  const reportPath = path.join(projectRoot, '.claude', reportFilename);

  // Ensure .claude directory exists
  const claudeDir = path.dirname(reportPath);
  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
  }

  // Write to timestamped report file
  fs.writeFileSync(reportPath, report, 'utf8');

  // Generate chat summary
  const summary = generateChatSummary(rounds, converged, reportFilename);
  console.log(summary);

  return rounds;
}

/**
 * Main entry point for the skill
 */
async function main() {
  try {
    const projectRoot = path.resolve(__dirname, '../../..');
    const techspecPath = path.join(projectRoot, 'docs/TECHSPEC.md');

    console.log('Starting TechSpec evaluation...\n');
    await runEvaluation(techspecPath);
  } catch (error) {
    console.error('Error running techspec evaluation:', error.message);
    throw error;
  }
}

// Export for testing
module.exports = {
  loadTechspec,
  chunkIfNeeded,
  buildConsensusConfig,
  hasConverged,
  runEvaluation,
  generateReport,
  generateChatSummary,
  calculateSimilarity,
  callZenConsensus
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
