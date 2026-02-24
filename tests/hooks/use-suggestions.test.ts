import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSuggestions } from '@/hooks/use-suggestions';
import { createTestWrapper } from '../helpers/test-wrapper';
import { FastAPISuggestionService } from '@/services/implementations/fastapi-suggestion-service';

describe('useSuggestions', () => {
  it('returns suggestionService from context', () => {
    const service = new FastAPISuggestionService();
    const wrapper = createTestWrapper({
      suggestionValue: { suggestionService: service },
    });

    const { result } = renderHook(() => useSuggestions(), { wrapper });

    expect(result.current.suggestionService).toBe(service);
  });

  it('throws when used outside SuggestionProvider', () => {
    expect(() => {
      renderHook(() => useSuggestions());
    }).toThrow('useSuggestions must be used within a SuggestionProvider');
  });
});
