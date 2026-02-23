import { describe, it, expect } from 'vitest';
import type { ChecklistItem, DismissedSuggestion, UserCategory } from '@/types/checklist';

describe('ChecklistItem', () => {
  it('accepts a valid ChecklistItem object', () => {
    const item: ChecklistItem = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: 'user-001',
      trip_id: 'trip-001',
      item_name: 'Passport',
      category: 'Documents',
      quantity: 1,
      priority: 'essential',
      assigned_day: null,
      activity_ref: null,
      reasoning: null,
      checked: false,
      booking_link: null,
      source: 'user',
      created_at: '2026-04-01T00:00:00Z',
      updated_at: '2026-04-01T00:00:00Z',
    };
    expect(item).toBeDefined();
    expect(item.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(item.quantity).toBe(1);
    expect(item.priority).toBe('essential');
    expect(item.checked).toBe(false);
    expect(item.source).toBe('user');
  });

  it('accepts all priority values', () => {
    const priorities: ChecklistItem['priority'][] = ['essential', 'recommended', 'optional'];
    expect(priorities).toHaveLength(3);
  });

  it('accepts both source values', () => {
    const sources: ChecklistItem['source'][] = ['user', 'ai'];
    expect(sources).toHaveLength(2);
  });

  it('accepts non-null optional fields', () => {
    const item: ChecklistItem = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      user_id: 'user-001',
      trip_id: 'trip-001',
      item_name: 'Sunscreen',
      category: 'Toiletries',
      quantity: 2,
      priority: 'recommended',
      assigned_day: 3,
      activity_ref: 'd3-beach',
      reasoning: 'Beach day requires sun protection',
      checked: true,
      booking_link: 'https://example.com/sunscreen',
      source: 'ai',
      created_at: '2026-04-01T00:00:00Z',
      updated_at: '2026-04-02T00:00:00Z',
    };
    expect(item.assigned_day).toBe(3);
    expect(item.activity_ref).toBe('d3-beach');
    expect(item.reasoning).toBe('Beach day requires sun protection');
    expect(item.booking_link).toBe('https://example.com/sunscreen');
  });

  it('rejects objects with missing required fields', () => {
    // @ts-expect-error - missing required fields
    const invalid: ChecklistItem = {
      id: 'some-id',
      item_name: 'Passport',
    };
    expect(invalid).toBeDefined();
  });
});

describe('DismissedSuggestion', () => {
  it('accepts a valid DismissedSuggestion object', () => {
    const dismissed: DismissedSuggestion = {
      id: 'dismiss-001',
      user_id: 'user-001',
      trip_id: 'trip-001',
      item_name: 'Travel pillow',
      category: 'Accessories',
      activity_ref: null,
      dismissed_at: '2026-04-01T00:00:00Z',
    };
    expect(dismissed).toBeDefined();
    expect(dismissed.item_name).toBe('Travel pillow');
    expect(dismissed.category).toBe('Accessories');
  });

  it('accepts null category and activity_ref', () => {
    const dismissed: DismissedSuggestion = {
      id: 'dismiss-002',
      user_id: 'user-001',
      trip_id: 'trip-001',
      item_name: 'Umbrella',
      category: null,
      activity_ref: null,
      dismissed_at: '2026-04-01T00:00:00Z',
    };
    expect(dismissed.category).toBeNull();
    expect(dismissed.activity_ref).toBeNull();
  });

  it('rejects objects with missing required fields', () => {
    // @ts-expect-error - missing required fields
    const invalid: DismissedSuggestion = {
      id: 'dismiss-003',
    };
    expect(invalid).toBeDefined();
  });
});

describe('UserCategory', () => {
  it('accepts a valid UserCategory object', () => {
    const category: UserCategory = {
      id: 'cat-001',
      user_id: 'user-001',
      trip_id: 'trip-001',
      category_name: 'Snorkeling Gear',
      display_order: 0,
      created_at: '2026-04-01T00:00:00Z',
    };
    expect(category).toBeDefined();
    expect(category.category_name).toBe('Snorkeling Gear');
    expect(category.display_order).toBe(0);
  });

  it('rejects objects with missing required fields', () => {
    // @ts-expect-error - missing required fields
    const invalid: UserCategory = {
      id: 'cat-002',
      category_name: 'Custom',
    };
    expect(invalid).toBeDefined();
  });
});
