'use client';

import { createContext, useMemo, type ReactNode } from 'react';
import type { ChecklistRepository } from '@/repositories/checklist-repository';
import type { TripRepository } from '@/repositories/trip-repository';
import { SupabaseChecklistRepository } from '@/repositories/implementations/supabase-checklist-repository';
import { HardcodedTripRepository } from '@/repositories/implementations/hardcoded-trip-repository';
import { createClient } from '@/lib/supabase/client';

export interface RepositoryContextValue {
  checklistRepo: ChecklistRepository;
  tripRepo: TripRepository;
}

export const RepositoryContext = createContext<RepositoryContextValue | null>(null);

interface RepositoryProviderProps {
  children: ReactNode;
}

export function RepositoryProvider({ children }: RepositoryProviderProps) {
  const value = useMemo<RepositoryContextValue>(() => {
    const client = createClient();
    return {
      checklistRepo: new SupabaseChecklistRepository(client),
      tripRepo: new HardcodedTripRepository(),
    };
  }, []);

  return (
    <RepositoryContext.Provider value={value}>
      {children}
    </RepositoryContext.Provider>
  );
}
