import { describe, it, expect } from 'vitest';
import type { ChecklistRepository } from '@/repositories/checklist-repository';
import type { ChecklistItem, DismissedSuggestion, UserCategory } from '@/types/checklist';

describe('ChecklistRepository', () => {
  // Compile-time verification: a valid implementation satisfies the interface
  const mockRepo: ChecklistRepository = {
    getItems: async (_tripId: string): Promise<ChecklistItem[]> => [],
    addItem: async (
      _item: Omit<ChecklistItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    ): Promise<ChecklistItem> => ({} as ChecklistItem),
    updateItem: async (
      _id: string,
      _updates: Partial<ChecklistItem>,
    ): Promise<ChecklistItem> => ({} as ChecklistItem),
    deleteItem: async (_id: string): Promise<void> => {},
    toggleCheck: async (_id: string): Promise<ChecklistItem> =>
      ({} as ChecklistItem),
    getDismissed: async (_tripId: string): Promise<DismissedSuggestion[]> => [],
    dismissSuggestion: async (
      _tripId: string,
      _itemName: string,
      _category: string | null,
    ): Promise<void> => {},
    getCustomCategories: async (_tripId: string): Promise<UserCategory[]> => [],
    addCustomCategory: async (
      _tripId: string,
      _categoryName: string,
    ): Promise<UserCategory> => ({} as UserCategory),
    deleteCategory: async (
      _tripId: string,
      _categoryName: string,
    ): Promise<void> => {},
  };

  it('declares getItems(tripId) returning Promise<ChecklistItem[]>', () => {
    expect(mockRepo.getItems).toBeDefined();
  });

  it('declares addItem with Omit signature returning Promise<ChecklistItem>', () => {
    expect(mockRepo.addItem).toBeDefined();
  });

  it('declares updateItem(id, partial) returning Promise<ChecklistItem>', () => {
    expect(mockRepo.updateItem).toBeDefined();
  });

  it('declares deleteItem(id) returning Promise<void>', () => {
    expect(mockRepo.deleteItem).toBeDefined();
  });

  it('declares toggleCheck(id) returning Promise<ChecklistItem>', () => {
    expect(mockRepo.toggleCheck).toBeDefined();
  });

  it('declares getDismissed(tripId) returning Promise<DismissedSuggestion[]>', () => {
    expect(mockRepo.getDismissed).toBeDefined();
  });

  it('declares dismissSuggestion(tripId, itemName, category)', () => {
    expect(mockRepo.dismissSuggestion).toBeDefined();
  });

  it('declares getCustomCategories(tripId) returning Promise<UserCategory[]>', () => {
    expect(mockRepo.getCustomCategories).toBeDefined();
  });

  it('declares addCustomCategory(tripId, name) returning Promise<UserCategory>', () => {
    expect(mockRepo.addCustomCategory).toBeDefined();
  });

  it('declares deleteCategory(tripId, name) returning Promise<void>', () => {
    expect(mockRepo.deleteCategory).toBeDefined();
  });
});
