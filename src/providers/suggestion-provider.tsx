'use client';

import { createContext, useMemo, type ReactNode } from 'react';
import type { SuggestionService } from '@/services/suggestion-service';
import { FastAPISuggestionService } from '@/services/implementations/fastapi-suggestion-service';

export interface SuggestionContextValue {
  suggestionService: SuggestionService;
}

export const SuggestionContext = createContext<SuggestionContextValue | null>(null);

interface SuggestionProviderProps {
  children: ReactNode;
}

export function SuggestionProvider({ children }: SuggestionProviderProps) {
  const suggestionService = useMemo(() => new FastAPISuggestionService(), []);

  const value = useMemo<SuggestionContextValue>(
    () => ({ suggestionService }),
    [suggestionService]
  );

  return (
    <SuggestionContext.Provider value={value}>
      {children}
    </SuggestionContext.Provider>
  );
}
