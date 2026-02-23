'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/providers/auth-provider';
import { RepositoryProvider } from '@/providers/repository-provider';
import { SuggestionProvider } from '@/providers/suggestion-provider';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider>
      <RepositoryProvider>
        <SuggestionProvider>
          {children}
        </SuggestionProvider>
      </RepositoryProvider>
    </AuthProvider>
  );
}
