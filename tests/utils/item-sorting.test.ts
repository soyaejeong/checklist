import { describe, it, expect } from 'vitest';
import { sortCheckedToBottom, sortByCategory } from '@/utils/item-sorting';

describe('sortCheckedToBottom', () => {
  it('moves checked items to the bottom', () => {
    const items = [
      { id: 1, checked: true },
      { id: 2, checked: false },
      { id: 3, checked: false },
      { id: 4, checked: true },
    ];
    const sorted = sortCheckedToBottom(items);
    expect(sorted.map((i) => i.id)).toEqual([2, 3, 1, 4]);
  });

  it('preserves insertion order for unchecked items', () => {
    const items = [
      { id: 'a', checked: false },
      { id: 'b', checked: false },
      { id: 'c', checked: false },
    ];
    const sorted = sortCheckedToBottom(items);
    expect(sorted.map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('preserves relative order for checked items', () => {
    const items = [
      { id: 1, checked: true },
      { id: 2, checked: true },
      { id: 3, checked: true },
    ];
    const sorted = sortCheckedToBottom(items);
    expect(sorted.map((i) => i.id)).toEqual([1, 2, 3]);
  });

  it('handles empty array', () => {
    expect(sortCheckedToBottom([])).toEqual([]);
  });

  it('does not mutate the original array', () => {
    const items = [
      { id: 1, checked: true },
      { id: 2, checked: false },
    ];
    const original = [...items];
    sortCheckedToBottom(items);
    expect(items).toEqual(original);
  });
});

describe('sortByCategory', () => {
  const categoryOrder = [
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
  ];

  it('sorts items by category taxonomy index', () => {
    const items = [
      { id: 1, category: 'Footwear' },
      { id: 2, category: 'Clothing' },
      { id: 3, category: 'Documents' },
    ];
    const sorted = sortByCategory(items, categoryOrder);
    expect(sorted.map((i) => i.category)).toEqual([
      'Clothing',
      'Documents',
      'Footwear',
    ]);
  });

  it('puts unknown categories at the end', () => {
    const items = [
      { id: 1, category: 'Custom Category' },
      { id: 2, category: 'Clothing' },
    ];
    const sorted = sortByCategory(items, categoryOrder);
    expect(sorted.map((i) => i.category)).toEqual([
      'Clothing',
      'Custom Category',
    ]);
  });

  it('handles empty array', () => {
    expect(sortByCategory([], categoryOrder)).toEqual([]);
  });

  it('does not mutate the original array', () => {
    const items = [
      { id: 1, category: 'Footwear' },
      { id: 2, category: 'Clothing' },
    ];
    const original = [...items];
    sortByCategory(items, categoryOrder);
    expect(items).toEqual(original);
  });

  it('preserves order for items in the same category', () => {
    const items = [
      { id: 1, category: 'Clothing' },
      { id: 2, category: 'Clothing' },
      { id: 3, category: 'Documents' },
    ];
    const sorted = sortByCategory(items, categoryOrder);
    expect(sorted.map((i) => i.id)).toEqual([1, 2, 3]);
  });
});
