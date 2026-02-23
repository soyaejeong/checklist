import type { ReactNode } from 'react';
import { AuthContext, type AuthContextValue } from '@/providers/auth-provider';
import { RepositoryContext, type RepositoryContextValue } from '@/providers/repository-provider';
import { SuggestionContext, type SuggestionContextValue } from '@/providers/suggestion-provider';
import { createMockUser } from './mock-supabase';

interface TestWrapperOptions {
  authValue?: Partial<AuthContextValue>;
  repositoryValue?: RepositoryContextValue | null;
  suggestionValue?: SuggestionContextValue | null;
}

export function createTestWrapper(options: TestWrapperOptions = {}) {
  const defaultAuthValue: AuthContextValue = {
    user: createMockUser(),
    loading: false,
    error: null,
    signOut: async () => {},
    ...options.authValue,
  };

  const repositoryValue = options.repositoryValue ?? null;
  const suggestionValue = options.suggestionValue ?? null;

  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <AuthContext.Provider value={defaultAuthValue}>
        <RepositoryContext.Provider value={repositoryValue}>
          <SuggestionContext.Provider value={suggestionValue}>
            {children}
          </SuggestionContext.Provider>
        </RepositoryContext.Provider>
      </AuthContext.Provider>
    );
  };
}
