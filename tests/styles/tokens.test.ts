import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const tokensPath = path.resolve(__dirname, '../../src/styles/tokens.css');
const globalsPath = path.resolve(__dirname, '../../src/styles/globals.css');

function readCSS(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

describe('tokens.css', () => {
  const css = readCSS(tokensPath);

  describe('Color tokens', () => {
    const colorTokens = [
      '--color-background',
      '--color-surface',
      '--color-surface-tinted',
      '--color-text',
      '--color-text-muted',
      '--color-text-hint',
      '--color-border',
      '--color-border-tinted',
      '--color-accent',
      '--color-accent-text',
      '--color-accent-soft',
      '--color-unchecked',
      '--color-danger',
    ];

    it.each(colorTokens)('exports %s', (token) => {
      expect(css).toContain(token);
    });
  });

  describe('Typography tokens', () => {
    const typographyTokens = [
      '--font-title-size',
      '--font-title-weight',
      '--font-focus-size',
      '--font-focus-weight',
      '--font-heading-size',
      '--font-heading-weight',
      '--font-body-size',
      '--font-body-weight',
      '--font-caption-size',
      '--font-caption-weight',
      '--font-micro-size',
      '--font-micro-weight',
    ];

    it.each(typographyTokens)('exports %s', (token) => {
      expect(css).toContain(token);
    });
  });

  describe('Spacing tokens', () => {
    const spacingTokens = [
      '--space-xs',
      '--space-sm',
      '--space-md',
      '--space-lg',
      '--space-xl',
      '--space-2xl',
      '--bar',
      '--touch-target-min',
    ];

    it.each(spacingTokens)('exports %s', (token) => {
      expect(css).toContain(token);
    });
  });

  describe('Interaction state tokens', () => {
    const stateTokens = [
      '--state-pressed',
      '--state-pressed-accent',
      '--state-pressed-danger',
      '--state-disabled-opacity',
    ];

    it.each(stateTokens)('exports %s', (token) => {
      expect(css).toContain(token);
    });
  });

  describe('Focus tokens', () => {
    const focusTokens = ['--focus-ring', '--focus-offset'];

    it.each(focusTokens)('exports %s', (token) => {
      expect(css).toContain(token);
    });
  });

  describe('Motion tokens', () => {
    const motionTokens = [
      '--duration-quick',
      '--duration-normal',
      '--easing-default',
      '--easing-spring',
    ];

    it.each(motionTokens)('exports %s', (token) => {
      expect(css).toContain(token);
    });
  });

  describe('Elevation tokens', () => {
    const elevationTokens = ['--radius-card', '--radius-sheet'];

    it.each(elevationTokens)('exports %s', (token) => {
      expect(css).toContain(token);
    });
  });
});

describe('globals.css', () => {
  const css = readCSS(globalsPath);

  it('imports tokens.css', () => {
    expect(css).toContain('tokens.css');
  });

  it('applies box-sizing reset', () => {
    expect(css).toContain('box-sizing');
  });

  it('sets system font stack', () => {
    expect(css).toContain('-apple-system');
  });

  it('handles prefers-reduced-motion', () => {
    expect(css).toContain('prefers-reduced-motion');
  });
});
