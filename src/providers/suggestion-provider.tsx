'use client';

import { createContext, type ReactNode } from 'react';
import type { SuggestionService } from '@/services/suggestion-service';

export interface SuggestionContextValue {
  suggestionService: SuggestionService;
}

export const SuggestionContext = createContext<SuggestionContextValue | null>(null);

interface SuggestionProviderProps {
  children: ReactNode;
}

export function SuggestionProvider({ children }: SuggestionProviderProps) {
  // Skeleton: full implementation in Slice 03 Trip + Suggestion section
  return (
    <SuggestionContext.Provider value={null}>
      {children}
    </SuggestionContext.Provider>
  );
}
