import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth } from '@/hooks/use-auth';
import { createTestWrapper } from '../helpers/test-wrapper';

describe('useAuth', () => {
  it('returns { user, loading, error, signOut } from AuthContext', () => {
    const wrapper = createTestWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeDefined();
    expect(typeof result.current.loading).toBe('boolean');
    expect(result.current.error).toBeNull();
    expect(typeof result.current.signOut).toBe('function');
  });

  it('throws meaningful error when used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow(/AuthProvider/);
  });
});
