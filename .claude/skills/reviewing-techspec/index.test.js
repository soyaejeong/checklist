const {
  loadTechspec,
  chunkIfNeeded,
  buildConsensusConfig,
  hasConverged,
  runEvaluation
} = require('./index');
const fs = require('fs');
const path = require('path');

describe('reviewing-techspec skill', () => {
  const projectRoot = path.resolve(__dirname, '../../..');
  const techspecPath = path.join(projectRoot, 'docs/TECHSPEC.md');

  describe('Test 1: Load TECHSPEC.md', () => {
    test('throws error if file does not exist', () => {
      expect(() => loadTechspec('/nonexistent/path.md')).toThrow();
    });

    test('chunks content if over 50K chars', () => {
      const longContent = 'x'.repeat(60000);
      const chunked = chunkIfNeeded(longContent);
      expect(chunked.length).toBeLessThanOrEqual(30000);
    });
  });

  describe('Test 2: Configure both models as critics', () => {
    test('builds consensus config with 2 critics', () => {
      const techspecContent = 'Sample techspec content';
      const config = buildConsensusConfig(techspecContent, 1);

      expect(config.models).toHaveLength(2);
      expect(config.models[0].model).toBe('gemini-2.5-pro');
      expect(config.models[1].model).toBe('gpt-5-pro');
      expect(config.step).toContain('techspec');
    });

    test('includes previous round context in later rounds', () => {
      const techspecContent = 'Sample techspec';
      const previousSummary = 'Previous findings: Issue X, Issue Y';
      const config = buildConsensusConfig(techspecContent, 2, previousSummary);

      expect(config.step).toContain(previousSummary);
    });
  });

  describe('Test 3: Detect convergence', () => {
    test('returns false for first round (no previous round)', () => {
      const round1 = 'Initial findings';
      expect(hasConverged(round1, null)).toBe(false);
    });

    test('similarity calculation returns a value between 0 and 1', () => {
      const { calculateSimilarity } = require('./index');
      const sim1 = calculateSimilarity('test', 'test');
      const sim2 = calculateSimilarity('completely different', 'words here');

      expect(sim1).toBeGreaterThanOrEqual(0);
      expect(sim1).toBeLessThanOrEqual(1);
      expect(sim2).toBeGreaterThanOrEqual(0);
      expect(sim2).toBeLessThanOrEqual(1);
    });
  });

  describe('Test 4: Enforce 5 round limit', () => {
    test('stops at max rounds', async () => {
      // Create a temporary techspec for testing
      const tmpDir = path.join(projectRoot, 'docs');
      const tmpFile = path.join(tmpDir, 'TECHSPEC_TEST.md');

      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      fs.writeFileSync(tmpFile, '# Test Techspec\nSample content for testing.');

      try {
        const mockConsensus = jest.fn(() => ({
          findings: `New findings at ${Date.now()}`
        }));

        const rounds = await runEvaluation(tmpFile, {
          maxRounds: 3,
          consensusCall: mockConsensus
        });

        expect(rounds.length).toBeLessThanOrEqual(3);
        expect(mockConsensus).toHaveBeenCalledTimes(Math.min(3, rounds.length));
      } finally {
        fs.unlinkSync(tmpFile);
      }
    });
  });
});
