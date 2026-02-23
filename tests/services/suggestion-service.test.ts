import { describe, it, expect } from 'vitest';
import type { SuggestionService } from '@/services/suggestion-service';
import type { Suggestion } from '@/types/suggestion';

describe('SuggestionService', () => {
  const mockService: SuggestionService = {
    getSuggestions: async (_params) => [] as Suggestion[],
    getCachedSuggestions: (_tripId: string) => null,
    invalidateCache: (_tripId: string) => {},
  };

  it('declares getSuggestions(params) returning Promise<Suggestion[]>', () => {
    expect(mockService.getSuggestions).toBeDefined();
  });

  it('declares getCachedSuggestions(tripId) returning Suggestion[] | null', () => {
    expect(mockService.getCachedSuggestions).toBeDefined();
  });

  it('declares invalidateCache(tripId) returning void', () => {
    expect(mockService.invalidateCache).toBeDefined();
  });
});
