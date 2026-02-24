'use client';

import { useContext } from 'react';
import { RepositoryContext } from '@/providers/repository-provider';
import type { ChecklistRepository } from '@/repositories/checklist-repository';

export function useChecklist(): ChecklistRepository {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error('useChecklist must be used within a RepositoryProvider');
  }
  return context.checklistRepo;
}
