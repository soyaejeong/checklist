import { describe, it, expect } from 'vitest';
import type { Suggestion } from '@/types/suggestion';

describe('Suggestion', () => {
  it('accepts a valid Suggestion object', () => {
    const suggestion: Suggestion = {
      item_name: 'Hiking boots',
      category: 'Footwear',
      quantity: 1,
      priority: 'essential',
      assigned_day: null,
      activity_ref: 'd2-hallasan',
      reasoning: '6-8hr Eorimok trail requires ankle support',
      booking_link: null,
    };
    expect(suggestion.item_name).toBe('Hiking boots');
    expect(suggestion.priority).toBe('essential');
    expect(suggestion.reasoning).toBe('6-8hr Eorimok trail requires ankle support');
  });

  it('accepts all priority values', () => {
    const priorities: Suggestion['priority'][] = ['essential', 'recommended', 'optional'];
    expect(priorities).toHaveLength(3);
  });

  it('accepts non-null optional fields', () => {
    const suggestion: Suggestion = {
      item_name: 'Sunscreen',
      category: 'Toiletries',
      quantity: 2,
      priority: 'recommended',
      assigned_day: 3,
      activity_ref: 'd3-beach',
      reasoning: 'Beach day requires sun protection',
      booking_link: 'https://example.com/sunscreen',
    };
    expect(suggestion.assigned_day).toBe(3);
    expect(suggestion.booking_link).toBe('https://example.com/sunscreen');
  });

  it('rejects objects with missing required fields', () => {
    // @ts-expect-error - missing required fields
    const invalid: Suggestion = { item_name: 'Test' };
    expect(invalid).toBeDefined();
  });
});
