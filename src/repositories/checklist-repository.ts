import type { ChecklistItem, DismissedSuggestion, UserCategory } from '@/types/checklist';

export interface ChecklistRepository {
  getItems(tripId: string): Promise<ChecklistItem[]>;
  addItem(
    item: Omit<ChecklistItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  ): Promise<ChecklistItem>;
  updateItem(id: string, updates: Partial<ChecklistItem>): Promise<ChecklistItem>;
  deleteItem(id: string): Promise<void>;
  toggleCheck(id: string): Promise<ChecklistItem>;
  getDismissed(tripId: string): Promise<DismissedSuggestion[]>;
  dismissSuggestion(
    tripId: string,
    itemName: string,
    category: string | null,
  ): Promise<void>;
  getCustomCategories(tripId: string): Promise<UserCategory[]>;
  addCustomCategory(
    tripId: string,
    categoryName: string,
  ): Promise<UserCategory>;
  deleteCategory(tripId: string, categoryName: string): Promise<void>;
}
