import type { SupabaseClient } from '@supabase/supabase-js';
import type { ChecklistRepository } from '@/repositories/checklist-repository';
import type { ChecklistItem, DismissedSuggestion, UserCategory } from '@/types/checklist';

export class SupabaseChecklistRepository implements ChecklistRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getItems(tripId: string): Promise<ChecklistItem[]> {
    const { data, error } = await this.client
      .from('checklist_items')
      .select()
      .eq('trip_id', tripId);

    if (error) throw new Error(error.message);
    return data as ChecklistItem[];
  }

  async addItem(
    item: Omit<ChecklistItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  ): Promise<ChecklistItem> {
    const { data: { user }, error: authError } = await this.client.auth.getUser();
    if (authError || !user) throw new Error('Not authenticated');

    const { data, error } = await this.client
      .from('checklist_items')
      .insert({ ...item, user_id: user.id })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ChecklistItem;
  }

  async updateItem(id: string, updates: Partial<ChecklistItem>): Promise<ChecklistItem> {
    const { data, error } = await this.client
      .from('checklist_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ChecklistItem;
  }

  async deleteItem(id: string): Promise<void> {
    const { error } = await this.client
      .from('checklist_items')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async toggleCheck(id: string): Promise<ChecklistItem> {
    const { data: current, error: readError } = await this.client
      .from('checklist_items')
      .select()
      .eq('id', id)
      .single();

    if (readError || !current) throw new Error(readError?.message ?? 'Item not found');

    const { data: updated, error: updateError } = await this.client
      .from('checklist_items')
      .update({ checked: !(current as ChecklistItem).checked })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);
    return updated as ChecklistItem;
  }

  async getDismissed(tripId: string): Promise<DismissedSuggestion[]> {
    const { data, error } = await this.client
      .from('dismissed_suggestions')
      .select()
      .eq('trip_id', tripId);

    if (error) throw new Error(error.message);
    return data as DismissedSuggestion[];
  }

  async dismissSuggestion(tripId: string, itemName: string, category: string | null): Promise<void> {
    const { data: { user }, error: authError } = await this.client.auth.getUser();
    if (authError || !user) throw new Error('Not authenticated');

    const { error } = await this.client
      .from('dismissed_suggestions')
      .insert({ trip_id: tripId, item_name: itemName, category, user_id: user.id });

    if (error) throw new Error(error.message);
  }

  async getCustomCategories(tripId: string): Promise<UserCategory[]> {
    const { data, error } = await this.client
      .from('user_categories')
      .select()
      .eq('trip_id', tripId);

    if (error) throw new Error(error.message);
    return data as UserCategory[];
  }

  async addCustomCategory(tripId: string, categoryName: string): Promise<UserCategory> {
    const { data: { user }, error: authError } = await this.client.auth.getUser();
    if (authError || !user) throw new Error('Not authenticated');

    const { data, error } = await this.client
      .from('user_categories')
      .insert({ trip_id: tripId, category_name: categoryName, user_id: user.id })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as UserCategory;
  }

  async deleteCategory(tripId: string, categoryName: string): Promise<void> {
    const { error: updateError } = await this.client
      .from('checklist_items')
      .update({ category: 'Miscellaneous' })
      .eq('trip_id', tripId)
      .eq('category', categoryName);

    if (updateError) throw new Error(updateError.message);

    const { error: deleteError } = await this.client
      .from('user_categories')
      .delete()
      .eq('trip_id', tripId)
      .eq('category_name', categoryName);

    if (deleteError) throw new Error(deleteError.message);
  }
}
