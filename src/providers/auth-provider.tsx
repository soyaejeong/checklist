'use client';

import { createContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { SupabaseAuthService } from '@/services/implementations/supabase-auth-service';
import { createClient } from '@/lib/supabase/client';

export interface AuthContextValue {
  user: { id: string; isAnonymous: boolean } | null;
  loading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<{ id: string; isAnonymous: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const authService = useMemo(() => new SupabaseAuthService(createClient()), []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const currentUser = await authService.getCurrentUser();
        if (cancelled) return;

        if (currentUser) {
          setUser(currentUser);
          setLoading(false);
        } else {
          await authService.signInAnonymously();
          if (cancelled) return;
          const newUser = await authService.getCurrentUser();
          if (cancelled) return;
          setUser(newUser);
          setLoading(false);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    }

    init();

    const unsubscribe = authService.onAuthStateChange((updatedUser) => {
      if (!cancelled) {
        setUser(updatedUser);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [authService]);

  const handleSignOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
  }, [authService]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, error, signOut: handleSignOut }),
    [user, loading, error, handleSignOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
