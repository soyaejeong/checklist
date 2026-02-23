import { describe, it, expect } from 'vitest';
import { CATEGORIES, localStorageKeys, API_BASE_URL } from '@/lib/constants';

describe('CATEGORIES', () => {
  it('exports exactly 10 categories', () => {
    expect(CATEGORIES).toHaveLength(10);
  });

  it('contains all taxonomy entries in correct order', () => {
    expect(CATEGORIES).toEqual([
      'Clothing',
      'Documents',
      'Toiletries',
      'Electronics',
      'Health',
      'Footwear',
      'Accessories',
      'Gear',
      'Food & Snacks',
      'Miscellaneous',
    ]);
  });
});

describe('localStorageKeys', () => {
  it('generates checklist key from tripId', () => {
    expect(localStorageKeys.checklist('trip-001')).toBe('checklist_trip-001');
  });

  it('generates dismissed key from tripId', () => {
    expect(localStorageKeys.dismissed('trip-001')).toBe('dismissed_trip-001');
  });

  it('generates view preference key from tripId', () => {
    expect(localStorageKeys.viewPreference('trip-001')).toBe('view_trip-001');
  });
});

describe('API_BASE_URL', () => {
  it('has a fallback value', () => {
    expect(API_BASE_URL).toBe('http://localhost:8000');
  });
});
