import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useContext } from 'react';
import { createTestWrapper } from './test-wrapper';
import { AuthContext } from '@/providers/auth-provider';

describe('createTestWrapper', () => {
  it('returns a React component that wraps children in all providers', () => {
    const wrapper = createTestWrapper();
    const { result } = renderHook(() => useContext(AuthContext), { wrapper });
    expect(result.current).not.toBeNull();
  });

  it('renders a trivial hook without errors', () => {
    const wrapper = createTestWrapper();
    const { result } = renderHook(() => 'hello', { wrapper });
    expect(result.current).toBe('hello');
  });

  it('provides AuthContext with default mock values', () => {
    const wrapper = createTestWrapper();
    const { result } = renderHook(() => useContext(AuthContext), { wrapper });
    expect(result.current).toBeDefined();
    expect(result.current?.user).toBeDefined();
    expect(result.current?.loading).toBe(false);
    expect(result.current?.error).toBeNull();
  });
});
