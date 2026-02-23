import { describe, it, expect } from 'vitest';
import { formatDate, formatQuantity, formatPriority } from '@/utils/formatting';

describe('formatDate', () => {
  it('formats ISO date to human-readable', () => {
    expect(formatDate('2026-04-10')).toBe('Apr 10, 2026');
  });

  it('formats another date correctly', () => {
    expect(formatDate('2026-12-25')).toBe('Dec 25, 2026');
  });
});

describe('formatQuantity', () => {
  it('returns empty string for quantity 1', () => {
    expect(formatQuantity(1)).toBe('');
  });

  it('returns ×N for quantity greater than 1', () => {
    expect(formatQuantity(2)).toBe('×2');
    expect(formatQuantity(5)).toBe('×5');
  });
});

describe('formatPriority', () => {
  it('capitalizes essential', () => {
    expect(formatPriority('essential')).toBe('Essential');
  });

  it('capitalizes recommended', () => {
    expect(formatPriority('recommended')).toBe('Recommended');
  });

  it('capitalizes optional', () => {
    expect(formatPriority('optional')).toBe('Optional');
  });
});
