'use client';

import { createContext, type ReactNode } from 'react';
import type { ChecklistRepository } from '@/repositories/checklist-repository';
import type { TripRepository } from '@/repositories/trip-repository';

export interface RepositoryContextValue {
  checklistRepo: ChecklistRepository;
  tripRepo: TripRepository;
}

export const RepositoryContext = createContext<RepositoryContextValue | null>(null);

interface RepositoryProviderProps {
  children: ReactNode;
}

export function RepositoryProvider({ children }: RepositoryProviderProps) {
  // Skeleton: full implementation in Slice 03 Checklist Repository section
  // Provides null context until real implementations are wired
  return (
    <RepositoryContext.Provider value={null}>
      {children}
    </RepositoryContext.Provider>
  );
}
