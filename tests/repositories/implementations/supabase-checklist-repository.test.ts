import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseChecklistRepository } from '@/repositories/implementations/supabase-checklist-repository';
import { createMockChecklistItem } from '../../helpers/mock-supabase';

function createSpySupabaseClient(responseData: unknown = [], responseError: unknown = null) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  const methods = [
    'select', 'eq', 'neq', 'order', 'limit', 'single',
    'insert', 'update', 'delete', 'filter', 'match', 'maybeSingle',
  ];

  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Terminal resolution: the chain itself acts as a thenable via data/error
  chain.data = responseData as unknown as ReturnType<typeof vi.fn>;
  chain.error = responseError as unknown as ReturnType<typeof vi.fn>;

  const from = vi.fn().mockReturnValue(chain);

  return { from, chain, auth: { getUser: vi.fn() } };
}

describe('SupabaseChecklistRepository', () => {
  describe('getItems', () => {
    it('queries checklist_items filtered by trip_id and returns typed ChecklistItem[]', async () => {
      const items = [
        createMockChecklistItem({ id: 'item-1', trip_id: 'trip-001' }),
        createMockChecklistItem({ id: 'item-2', trip_id: 'trip-001' }),
      ];
      const { from, chain } = createSpySupabaseClient(items);
      const repo = new SupabaseChecklistRepository({ from } as never);

      const result = await repo.getItems('trip-001');

      expect(from).toHaveBeenCalledWith('checklist_items');
      expect(chain.select).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith('trip_id', 'trip-001');
      expect(result).toEqual(items);
    });

    it('throws when Supabase returns an error', async () => {
      const { from } = createSpySupabaseClient(null, { message: 'DB error', code: '500' });
      const repo = new SupabaseChecklistRepository({ from } as never);

      await expect(repo.getItems('trip-001')).rejects.toThrow('DB error');
    });
  });

  describe('addItem', () => {
    it('inserts item with auto-injected user_id from auth session and returns inserted ChecklistItem', async () => {
      const inputItem = {
        trip_id: 'trip-001',
        item_name: 'Sunscreen',
        category: 'Toiletries',
        quantity: 1,
        priority: 'recommended' as const,
        assigned_day: null,
        activity_ref: null,
        reasoning: null,
        checked: false,
        booking_link: null,
        source: 'user' as const,
      };

      const insertedItem = createMockChecklistItem({
        ...inputItem,
        id: 'new-item-id',
        user_id: 'mock-user-id',
      });

      const { from, chain, auth } = createSpySupabaseClient(insertedItem);
      auth.getUser.mockResolvedValue({
        data: { user: { id: 'mock-user-id' } },
        error: null,
      });

      // Make single() return the item directly
      chain.single = vi.fn().mockReturnValue({ data: insertedItem, error: null });

      const repo = new SupabaseChecklistRepository({ from, auth } as never);
      const result = await repo.addItem(inputItem);

      expect(auth.getUser).toHaveBeenCalled();
      expect(from).toHaveBeenCalledWith('checklist_items');
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...inputItem,
          user_id: 'mock-user-id',
        }),
      );
      expect(result).toEqual(insertedItem);
    });

    it('throws when no authenticated user', async () => {
      const { from, auth } = createSpySupabaseClient();
      auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const repo = new SupabaseChecklistRepository({ from, auth } as never);

      await expect(
        repo.addItem({
          trip_id: 'trip-001',
          item_name: 'Test',
          category: 'Test',
          quantity: 1,
          priority: 'optional',
          assigned_day: null,
          activity_ref: null,
          reasoning: null,
          checked: false,
          booking_link: null,
          source: 'user',
        }),
      ).rejects.toThrow();
    });
  });

  describe('updateItem', () => {
    it('updates matching row and returns updated item', async () => {
      const updatedItem = createMockChecklistItem({
        id: 'item-1',
        item_name: 'Updated Boots',
      });

      const { from, chain } = createSpySupabaseClient();
      chain.single = vi.fn().mockReturnValue({ data: updatedItem, error: null });
      const repo = new SupabaseChecklistRepository({ from } as never);

      const result = await repo.updateItem('item-1', { item_name: 'Updated Boots' });

      expect(from).toHaveBeenCalledWith('checklist_items');
      expect(chain.update).toHaveBeenCalledWith({ item_name: 'Updated Boots' });
      expect(chain.eq).toHaveBeenCalledWith('id', 'item-1');
      expect(result).toEqual(updatedItem);
    });

    it('throws when Supabase returns an error', async () => {
      const { from, chain } = createSpySupabaseClient();
      chain.single = vi.fn().mockReturnValue({ data: null, error: { message: 'Update failed' } });
      const repo = new SupabaseChecklistRepository({ from } as never);

      await expect(repo.updateItem('item-1', { item_name: 'X' })).rejects.toThrow('Update failed');
    });
  });

  describe('deleteItem', () => {
    it('deletes row by id', async () => {
      const { from, chain } = createSpySupabaseClient();
      // delete chain resolves with no error
      chain.error = null as unknown as ReturnType<typeof vi.fn>;
      const repo = new SupabaseChecklistRepository({ from } as never);

      await repo.deleteItem('item-1');

      expect(from).toHaveBeenCalledWith('checklist_items');
      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith('id', 'item-1');
    });

    it('throws when Supabase returns an error', async () => {
      const { from } = createSpySupabaseClient(null, { message: 'Delete failed', code: '500' });
      const repo = new SupabaseChecklistRepository({ from } as never);

      await expect(repo.deleteItem('item-1')).rejects.toThrow('Delete failed');
    });
  });

  describe('toggleCheck', () => {
    it('reads current checked state, flips it, and returns result', async () => {
      const originalItem = createMockChecklistItem({ id: 'item-1', checked: false });
      const toggledItem = createMockChecklistItem({ id: 'item-1', checked: true });

      // Need two separate from() calls: first for select (read), second for update
      const readChain: Record<string, ReturnType<typeof vi.fn>> = {};
      const updateChain: Record<string, ReturnType<typeof vi.fn>> = {};

      for (const method of ['select', 'eq', 'single', 'update']) {
        readChain[method] = vi.fn().mockReturnValue(readChain);
        updateChain[method] = vi.fn().mockReturnValue(updateChain);
      }

      readChain.single = vi.fn().mockReturnValue({ data: originalItem, error: null });
      updateChain.single = vi.fn().mockReturnValue({ data: toggledItem, error: null });

      const from = vi.fn()
        .mockReturnValueOnce(readChain)
        .mockReturnValueOnce(updateChain);

      const repo = new SupabaseChecklistRepository({ from } as never);
      const result = await repo.toggleCheck('item-1');

      // First call: read current state
      expect(from).toHaveBeenNthCalledWith(1, 'checklist_items');
      expect(readChain.select).toHaveBeenCalled();
      expect(readChain.eq).toHaveBeenCalledWith('id', 'item-1');

      // Second call: update with flipped value
      expect(from).toHaveBeenNthCalledWith(2, 'checklist_items');
      expect(updateChain.update).toHaveBeenCalledWith({ checked: true });
      expect(updateChain.eq).toHaveBeenCalledWith('id', 'item-1');

      expect(result).toEqual(toggledItem);
    });

    it('flips checked=true to checked=false', async () => {
      const originalItem = createMockChecklistItem({ id: 'item-1', checked: true });
      const toggledItem = createMockChecklistItem({ id: 'item-1', checked: false });

      const readChain: Record<string, ReturnType<typeof vi.fn>> = {};
      const updateChain: Record<string, ReturnType<typeof vi.fn>> = {};

      for (const method of ['select', 'eq', 'single', 'update']) {
        readChain[method] = vi.fn().mockReturnValue(readChain);
        updateChain[method] = vi.fn().mockReturnValue(updateChain);
      }

      readChain.single = vi.fn().mockReturnValue({ data: originalItem, error: null });
      updateChain.single = vi.fn().mockReturnValue({ data: toggledItem, error: null });

      const from = vi.fn()
        .mockReturnValueOnce(readChain)
        .mockReturnValueOnce(updateChain);

      const repo = new SupabaseChecklistRepository({ from } as never);
      const result = await repo.toggleCheck('item-1');

      expect(updateChain.update).toHaveBeenCalledWith({ checked: false });
      expect(result).toEqual(toggledItem);
    });
  });

  describe('getDismissed', () => {
    it('returns DismissedSuggestion[] filtered by trip_id', async () => {
      const dismissed = [
        { id: 'd-1', user_id: 'u-1', trip_id: 'trip-001', item_name: 'Tent', category: 'Camping', activity_ref: null, dismissed_at: '2026-01-01T00:00:00Z' },
      ];
      const { from, chain } = createSpySupabaseClient(dismissed);
      const repo = new SupabaseChecklistRepository({ from } as never);

      const result = await repo.getDismissed('trip-001');

      expect(from).toHaveBeenCalledWith('dismissed_suggestions');
      expect(chain.select).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith('trip_id', 'trip-001');
      expect(result).toEqual(dismissed);
    });
  });

  describe('dismissSuggestion', () => {
    it('inserts with user_id from auth session', async () => {
      const { from, chain, auth } = createSpySupabaseClient();
      auth.getUser.mockResolvedValue({
        data: { user: { id: 'mock-user-id' } },
        error: null,
      });

      const repo = new SupabaseChecklistRepository({ from, auth } as never);
      await repo.dismissSuggestion('trip-001', 'Tent', 'Camping');

      expect(auth.getUser).toHaveBeenCalled();
      expect(from).toHaveBeenCalledWith('dismissed_suggestions');
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          trip_id: 'trip-001',
          item_name: 'Tent',
          category: 'Camping',
          user_id: 'mock-user-id',
        }),
      );
    });

    it('handles null category', async () => {
      const { from, chain, auth } = createSpySupabaseClient();
      auth.getUser.mockResolvedValue({
        data: { user: { id: 'mock-user-id' } },
        error: null,
      });

      const repo = new SupabaseChecklistRepository({ from, auth } as never);
      await repo.dismissSuggestion('trip-001', 'Tent', null);

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          category: null,
        }),
      );
    });
  });

  describe('getCustomCategories', () => {
    it('returns UserCategory[] filtered by trip_id', async () => {
      const categories = [
        { id: 'c-1', user_id: 'u-1', trip_id: 'trip-001', category_name: 'Electronics', display_order: 0, created_at: '2026-01-01T00:00:00Z' },
      ];
      const { from, chain } = createSpySupabaseClient(categories);
      const repo = new SupabaseChecklistRepository({ from } as never);

      const result = await repo.getCustomCategories('trip-001');

      expect(from).toHaveBeenCalledWith('user_categories');
      expect(chain.select).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith('trip_id', 'trip-001');
      expect(result).toEqual(categories);
    });
  });

  describe('addCustomCategory', () => {
    it('inserts category with user_id and returns UserCategory', async () => {
      const newCategory = {
        id: 'c-new',
        user_id: 'mock-user-id',
        trip_id: 'trip-001',
        category_name: 'Electronics',
        display_order: 0,
        created_at: '2026-01-01T00:00:00Z',
      };

      const { from, chain, auth } = createSpySupabaseClient();
      auth.getUser.mockResolvedValue({
        data: { user: { id: 'mock-user-id' } },
        error: null,
      });
      chain.single = vi.fn().mockReturnValue({ data: newCategory, error: null });

      const repo = new SupabaseChecklistRepository({ from, auth } as never);
      const result = await repo.addCustomCategory('trip-001', 'Electronics');

      expect(auth.getUser).toHaveBeenCalled();
      expect(from).toHaveBeenCalledWith('user_categories');
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          trip_id: 'trip-001',
          category_name: 'Electronics',
          user_id: 'mock-user-id',
        }),
      );
      expect(result).toEqual(newCategory);
    });
  });

  describe('deleteCategory', () => {
    it('batch-updates items to Miscellaneous then deletes category row', async () => {
      // Two from() calls: first updates items, second deletes category
      const updateChain: Record<string, ReturnType<typeof vi.fn>> = {};
      const deleteChain: Record<string, ReturnType<typeof vi.fn>> = {};

      for (const method of ['select', 'eq', 'update', 'delete', 'single']) {
        updateChain[method] = vi.fn().mockReturnValue(updateChain);
        deleteChain[method] = vi.fn().mockReturnValue(deleteChain);
      }

      updateChain.data = null as unknown as ReturnType<typeof vi.fn>;
      updateChain.error = null as unknown as ReturnType<typeof vi.fn>;
      deleteChain.data = null as unknown as ReturnType<typeof vi.fn>;
      deleteChain.error = null as unknown as ReturnType<typeof vi.fn>;

      const from = vi.fn()
        .mockReturnValueOnce(updateChain)
        .mockReturnValueOnce(deleteChain);

      const repo = new SupabaseChecklistRepository({ from } as never);
      await repo.deleteCategory('trip-001', 'Electronics');

      // First call: update all items in that category to "Miscellaneous"
      expect(from).toHaveBeenNthCalledWith(1, 'checklist_items');
      expect(updateChain.update).toHaveBeenCalledWith({ category: 'Miscellaneous' });
      expect(updateChain.eq).toHaveBeenCalledWith('trip_id', 'trip-001');
      expect(updateChain.eq).toHaveBeenCalledWith('category', 'Electronics');

      // Second call: delete the category row
      expect(from).toHaveBeenNthCalledWith(2, 'user_categories');
      expect(deleteChain.delete).toHaveBeenCalled();
      expect(deleteChain.eq).toHaveBeenCalledWith('trip_id', 'trip-001');
      expect(deleteChain.eq).toHaveBeenCalledWith('category_name', 'Electronics');
    });
  });
});
