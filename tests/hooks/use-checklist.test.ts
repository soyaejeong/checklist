import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChecklist } from '@/hooks/use-checklist';
import { createTestWrapper } from '../helpers/test-wrapper';
import type { ChecklistRepository } from '@/repositories/checklist-repository';
import type { TripRepository } from '@/repositories/trip-repository';

function createMockChecklistRepo(): ChecklistRepository {
  return {
    getItems: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    toggleCheck: vi.fn(),
    getDismissed: vi.fn(),
    dismissSuggestion: vi.fn(),
    getCustomCategories: vi.fn(),
    addCustomCategory: vi.fn(),
    deleteCategory: vi.fn(),
  };
}

function createMockTripRepo(): TripRepository {
  return {
    getTripById: vi.fn(),
    listTrips: vi.fn(),
  };
}

describe('useChecklist', () => {
  it('returns checklist repository methods when used inside provider', () => {
    const checklistRepo = createMockChecklistRepo();
    const tripRepo = createMockTripRepo();
    const wrapper = createTestWrapper({
      repositoryValue: { checklistRepo, tripRepo },
    });

    const { result } = renderHook(() => useChecklist(), { wrapper });

    expect(result.current.getItems).toBe(checklistRepo.getItems);
    expect(result.current.addItem).toBe(checklistRepo.addItem);
    expect(result.current.updateItem).toBe(checklistRepo.updateItem);
    expect(result.current.deleteItem).toBe(checklistRepo.deleteItem);
    expect(result.current.toggleCheck).toBe(checklistRepo.toggleCheck);
    expect(result.current.getDismissed).toBe(checklistRepo.getDismissed);
    expect(result.current.dismissSuggestion).toBe(checklistRepo.dismissSuggestion);
    expect(result.current.getCustomCategories).toBe(checklistRepo.getCustomCategories);
    expect(result.current.addCustomCategory).toBe(checklistRepo.addCustomCategory);
    expect(result.current.deleteCategory).toBe(checklistRepo.deleteCategory);
  });

  it('throws when used outside RepositoryProvider', () => {
    // renderHook without wrapper = no RepositoryContext
    expect(() => {
      renderHook(() => useChecklist());
    }).toThrow();
  });
});
