'use client';

import { createContext, type ReactNode } from 'react';
import type { AuthService } from '@/services/auth-service';

export interface AuthContextValue {
  user: { id: string; isAnonymous: boolean } | null;
  loading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  authService?: AuthService;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Skeleton: full implementation in Slice 03 Auth Layer section
  const value: AuthContextValue = {
    user: null,
    loading: true,
    error: null,
    signOut: async () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
