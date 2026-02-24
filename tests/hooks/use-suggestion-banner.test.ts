import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSuggestionBanner } from '@/hooks/use-suggestion-banner';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('useSuggestionBanner', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('first visit: bannerSeen=false, bannerExpanded=true (auto-expand per UISPEC)', () => {
    const { result } = renderHook(() => useSuggestionBanner('trip-1'));

    expect(result.current.bannerSeen).toBe(false);
    expect(result.current.bannerExpanded).toBe(true);
  });

  it('after markSeen: bannerSeen=true', () => {
    const { result } = renderHook(() => useSuggestionBanner('trip-1'));

    act(() => {
      result.current.markSeen();
    });

    expect(result.current.bannerSeen).toBe(true);
  });

  it('subsequent visits default collapsed after markSeen', () => {
    // First visit — mark as seen
    const { result: first } = renderHook(() => useSuggestionBanner('trip-1'));
    act(() => {
      first.current.markSeen();
    });

    // Subsequent visit — new hook instance reads from localStorage
    const { result: second } = renderHook(() => useSuggestionBanner('trip-1'));

    expect(second.current.bannerSeen).toBe(true);
    expect(second.current.bannerExpanded).toBe(false);
  });

  it('setExpanded toggles expansion state', () => {
    const { result } = renderHook(() => useSuggestionBanner('trip-1'));

    // Initially expanded (first visit)
    expect(result.current.bannerExpanded).toBe(true);

    act(() => {
      result.current.setExpanded(false);
    });
    expect(result.current.bannerExpanded).toBe(false);

    act(() => {
      result.current.setExpanded(true);
    });
    expect(result.current.bannerExpanded).toBe(true);
  });

  it('manages state per tripId independently', () => {
    const { result: trip1 } = renderHook(() => useSuggestionBanner('trip-1'));
    act(() => {
      trip1.current.markSeen();
    });

    // Different trip should be fresh
    const { result: trip2 } = renderHook(() => useSuggestionBanner('trip-2'));
    expect(trip2.current.bannerSeen).toBe(false);
    expect(trip2.current.bannerExpanded).toBe(true);
  });
});
