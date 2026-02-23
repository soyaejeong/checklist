import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/use-local-storage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns initial value when key is missing from localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('missing-key', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  it('reads existing value from localStorage', () => {
    localStorage.setItem('existing-key', JSON.stringify('stored-value'));
    const { result } = renderHook(() => useLocalStorage('existing-key', 'fallback'));
    expect(result.current[0]).toBe('stored-value');
  });

  it('writes updates with JSON serialization', () => {
    const { result } = renderHook(() => useLocalStorage('write-key', 'initial'));
    act(() => {
      result.current[1]('updated');
    });
    expect(result.current[0]).toBe('updated');
    expect(localStorage.getItem('write-key')).toBe(JSON.stringify('updated'));
  });

  it('supports function updater form', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0));
    act(() => {
      result.current[1]((prev) => prev + 1);
    });
    expect(result.current[0]).toBe(1);
    expect(localStorage.getItem('counter')).toBe(JSON.stringify(1));
  });

  it('handles complex objects', () => {
    const initial = { name: 'test', items: [1, 2, 3] };
    const { result } = renderHook(() => useLocalStorage('obj-key', initial));
    expect(result.current[0]).toEqual(initial);

    const updated = { name: 'updated', items: [4, 5] };
    act(() => {
      result.current[1](updated);
    });
    expect(result.current[0]).toEqual(updated);
    expect(JSON.parse(localStorage.getItem('obj-key')!)).toEqual(updated);
  });
});
