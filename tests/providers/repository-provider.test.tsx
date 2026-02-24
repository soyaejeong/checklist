import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { RepositoryProvider, RepositoryContext } from '@/providers/repository-provider';
import { AuthContext, type AuthContextValue } from '@/providers/auth-provider';
import { useContext } from 'react';
import { createMockUser } from '../helpers/mock-supabase';

// Mock the Supabase client module
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  }),
}));

// Mock HardcodedTripRepository — may not exist yet
vi.mock('@/repositories/implementations/hardcoded-trip-repository', () => ({
  HardcodedTripRepository: class {
    async getTripById() { return null; }
    async listTrips() { return []; }
  },
}));

function createAuthWrapper(authOverrides: Partial<AuthContextValue> = {}) {
  const authValue: AuthContextValue = {
    user: createMockUser(),
    loading: false,
    error: null,
    signOut: async () => {},
    ...authOverrides,
  };

  return function AuthWrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthContext.Provider value={authValue}>
        {children}
      </AuthContext.Provider>
    );
  };
}

describe('RepositoryProvider', () => {
  it('creates SupabaseChecklistRepository and provides it via context', () => {
    let contextValue: unknown = undefined;

    function Consumer() {
      contextValue = useContext(RepositoryContext);
      return <div data-testid="consumer">consumed</div>;
    }

    const AuthWrapper = createAuthWrapper();

    render(
      <AuthWrapper>
        <RepositoryProvider>
          <Consumer />
        </RepositoryProvider>
      </AuthWrapper>,
    );

    expect(screen.getByTestId('consumer')).toBeInTheDocument();
    expect(contextValue).not.toBeNull();
    expect(contextValue).toHaveProperty('checklistRepo');
    expect(contextValue).toHaveProperty('tripRepo');
  });

  it('provides repository instances with expected methods', () => {
    let contextValue: unknown = undefined;

    function Consumer() {
      contextValue = useContext(RepositoryContext);
      return null;
    }

    const AuthWrapper = createAuthWrapper();

    render(
      <AuthWrapper>
        <RepositoryProvider>
          <Consumer />
        </RepositoryProvider>
      </AuthWrapper>,
    );

    const ctx = contextValue as { checklistRepo: Record<string, unknown>; tripRepo: Record<string, unknown> };
    expect(typeof ctx.checklistRepo.getItems).toBe('function');
    expect(typeof ctx.checklistRepo.addItem).toBe('function');
    expect(typeof ctx.checklistRepo.deleteItem).toBe('function');
    expect(typeof ctx.tripRepo.getTripById).toBe('function');
    expect(typeof ctx.tripRepo.listTrips).toBe('function');
  });
});
