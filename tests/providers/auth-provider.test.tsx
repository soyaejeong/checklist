import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { useContext } from 'react';
import { AuthContext } from '@/providers/auth-provider';

// Mock the SupabaseAuthService at the module level
const mockGetCurrentUser = vi.fn();
const mockSignInAnonymously = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('@/services/implementations/supabase-auth-service', () => ({
  SupabaseAuthService: vi.fn().mockImplementation(() => ({
    getCurrentUser: mockGetCurrentUser,
    signInAnonymously: mockSignInAnonymously,
    signOut: mockSignOut,
    onAuthStateChange: mockOnAuthStateChange,
    upgradeToEmail: vi.fn(),
  })),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({}),
}));

// Must import AFTER mocks are set up
import { AuthProvider } from '@/providers/auth-provider';

function AuthConsumer() {
  const ctx = useContext(AuthContext);
  if (!ctx) return <div>no context</div>;
  return (
    <div>
      <span data-testid="loading">{String(ctx.loading)}</span>
      <span data-testid="user">{ctx.user ? ctx.user.id : 'null'}</span>
      <span data-testid="error">{ctx.error ? ctx.error.message : 'null'}</span>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue(() => {});
  });

  afterEach(() => {
    cleanup();
  });

  it('exposes { user, loading, error } through context and starts loading', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'user-1', isAnonymous: true });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    // Initially loading
    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    // After init completes
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('user')).toHaveTextContent('user-1');
  });

  it('checks for existing session on mount and uses it', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'existing-user', isAnonymous: true });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('existing-user');
    });
    expect(mockSignInAnonymously).not.toHaveBeenCalled();
  });

  it('auto-signs in anonymously if no session', async () => {
    mockGetCurrentUser
      .mockResolvedValueOnce(null) // First call: no session
      .mockResolvedValueOnce({ id: 'new-anon-user', isAnonymous: true }); // After sign-in
    mockSignInAnonymously.mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(mockSignInAnonymously).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('new-anon-user');
    });
  });

  it('surfaces error state when auth fails', async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    mockSignInAnonymously.mockRejectedValue(new Error('Auth unavailable'));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Auth unavailable');
    });
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });
});
