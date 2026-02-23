export const CATEGORIES = [
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
] as const;

export type Category = (typeof CATEGORIES)[number];

export const localStorageKeys = {
  checklist: (tripId: string) => `checklist_${tripId}`,
  dismissed: (tripId: string) => `dismissed_${tripId}`,
  viewPreference: (tripId: string) => `view_${tripId}`,
} as const;

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
