'use client';

import { useContext } from 'react';
import {
  SuggestionContext,
  type SuggestionContextValue,
} from '@/providers/suggestion-provider';

export function useSuggestions(): SuggestionContextValue {
  const context = useContext(SuggestionContext);
  if (!context) {
    throw new Error(
      'useSuggestions must be used within a SuggestionProvider'
    );
  }
  return context;
}
