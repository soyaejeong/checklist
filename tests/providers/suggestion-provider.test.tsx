import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useContext } from 'react';
import {
  SuggestionContext,
  SuggestionProvider,
} from '@/providers/suggestion-provider';

afterEach(() => cleanup());

describe('SuggestionProvider', () => {
  it('provides a SuggestionContextValue with suggestionService', () => {
    const { result } = renderHook(() => useContext(SuggestionContext), {
      wrapper: SuggestionProvider,
    });

    expect(result.current).not.toBeNull();
    expect(result.current!.suggestionService).toBeDefined();
    expect(typeof result.current!.suggestionService.getSuggestions).toBe('function');
    expect(typeof result.current!.suggestionService.getCachedSuggestions).toBe('function');
    expect(typeof result.current!.suggestionService.invalidateCache).toBe('function');
  });

  it('creates a FastAPISuggestionService instance', async () => {
    const { result } = renderHook(() => useContext(SuggestionContext), {
      wrapper: SuggestionProvider,
    });

    // Stub should return empty array
    const suggestions = await result.current!.suggestionService.getSuggestions({
      trip: {} as never,
      userProfile: {} as never,
      existingItems: [],
      dismissedItems: [],
    });
    expect(suggestions).toEqual([]);
  });
});
