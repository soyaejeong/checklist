import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { AppProviders } from '@/app/providers';
import { useAuth } from '@/hooks/use-auth';
import { useChecklist } from '@/hooks/use-checklist';
import { useSuggestions } from '@/hooks/use-suggestions';
import { useTrip } from '@/hooks/use-trip';

// Mock Supabase client — RepositoryProvider and AuthProvider create real clients
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
          single: () => Promise.resolve({ data: null, error: null }),
        }),
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    auth: {
      getUser: () => Promise.resolve({
        data: { user: { id: 'test-user-id', is_anonymous: true } },
        error: null,
      }),
      getSession: () => Promise.resolve({
        data: { session: { user: { id: 'test-user-id', is_anonymous: true } } },
        error: null,
      }),
      signInAnonymously: () => Promise.resolve({
        data: { user: { id: 'test-user-id', is_anonymous: true } },
        error: null,
      }),
      signOut: () => Promise.resolve({ error: null }),
      updateUser: () => Promise.resolve({ data: {}, error: null }),
      onAuthStateChange: (_cb: unknown) => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
  }),
}));

afterEach(() => cleanup());

describe('Full Provider Stack Integration (#17)', () => {
  it('renders with all real implementations wired', () => {
    // This verifies that AppProviders composes without circular dependency errors
    const { result } = renderHook(() => useAuth(), {
      wrapper: AppProviders,
    });

    // Auth hook returns expected shape
    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('signOut');
    expect(typeof result.current.signOut).toBe('function');
  });

  it('useChecklist returns repository methods from provider stack', () => {
    const { result } = renderHook(() => useChecklist(), {
      wrapper: AppProviders,
    });

    // useChecklist returns ChecklistRepository directly (not wrapped)
    expect(typeof result.current.getItems).toBe('function');
    expect(typeof result.current.addItem).toBe('function');
    expect(typeof result.current.updateItem).toBe('function');
    expect(typeof result.current.deleteItem).toBe('function');
    expect(typeof result.current.toggleCheck).toBe('function');
  });

  it('useSuggestions returns service methods from provider stack', () => {
    const { result } = renderHook(() => useSuggestions(), {
      wrapper: AppProviders,
    });

    expect(result.current).toHaveProperty('suggestionService');
    expect(typeof result.current.suggestionService.getSuggestions).toBe('function');
    expect(typeof result.current.suggestionService.getCachedSuggestions).toBe('function');
    expect(typeof result.current.suggestionService.invalidateCache).toBe('function');
  });

  it('useTrip returns expected shape from provider stack', () => {
    const { result } = renderHook(() => useTrip('jeju-adventure-001'), {
      wrapper: AppProviders,
    });

    expect(result.current).toHaveProperty('trip');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
  });

  it('no circular dependencies between modules', async () => {
    // Dynamically import all modules to catch circular dependency errors
    const modules = await Promise.all([
      import('@/services/implementations/supabase-auth-service'),
      import('@/repositories/implementations/supabase-checklist-repository'),
      import('@/repositories/implementations/hardcoded-trip-repository'),
      import('@/services/implementations/fastapi-suggestion-service'),
      import('@/providers/auth-provider'),
      import('@/providers/repository-provider'),
      import('@/providers/suggestion-provider'),
      import('@/hooks/use-auth'),
      import('@/hooks/use-checklist'),
      import('@/hooks/use-checklist-state'),
      import('@/hooks/use-trip'),
      import('@/hooks/use-suggestions'),
      import('@/hooks/use-suggestion-banner'),
    ]);

    // All modules should have loaded without circular dependency errors
    for (const mod of modules) {
      expect(mod).toBeDefined();
    }
  });
});
