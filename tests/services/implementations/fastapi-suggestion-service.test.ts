import { describe, it, expect } from 'vitest';
import { FastAPISuggestionService } from '@/services/implementations/fastapi-suggestion-service';
import { sampleTrip, sampleUserProfile } from '@/data/trips';

describe('FastAPISuggestionService (stub)', () => {
  const service = new FastAPISuggestionService();

  it('getSuggestions() returns empty array', async () => {
    const result = await service.getSuggestions({
      trip: sampleTrip,
      userProfile: sampleUserProfile,
      existingItems: [],
      dismissedItems: [],
    });
    expect(result).toEqual([]);
  });

  it('getCachedSuggestions() returns null', () => {
    const result = service.getCachedSuggestions('trip-1');
    expect(result).toBeNull();
  });

  it('invalidateCache() is a no-op', () => {
    expect(() => service.invalidateCache('trip-1')).not.toThrow();
  });
});
