import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useChecklistState } from '@/hooks/use-checklist-state';
import { createTestWrapper } from '../helpers/test-wrapper';
import { createMockChecklistItem } from '../helpers/mock-supabase';
import type { ChecklistRepository } from '@/repositories/checklist-repository';
import type { TripRepository } from '@/repositories/trip-repository';
import type { ChecklistItem } from '@/types/checklist';

function createMockChecklistRepo(overrides: Partial<ChecklistRepository> = {}): ChecklistRepository {
  return {
    getItems: vi.fn().mockResolvedValue([]),
    addItem: vi.fn().mockResolvedValue(createMockChecklistItem()),
    updateItem: vi.fn().mockResolvedValue(createMockChecklistItem()),
    deleteItem: vi.fn().mockResolvedValue(undefined),
    toggleCheck: vi.fn().mockResolvedValue(createMockChecklistItem()),
    getDismissed: vi.fn().mockResolvedValue([]),
    dismissSuggestion: vi.fn().mockResolvedValue(undefined),
    getCustomCategories: vi.fn().mockResolvedValue([]),
    addCustomCategory: vi.fn().mockResolvedValue({}),
    deleteCategory: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createMockTripRepo(): TripRepository {
  return {
    getTripById: vi.fn(),
    listTrips: vi.fn(),
  };
}

describe('useChecklistState', () => {
  describe('loading items', () => {
    it('loads items via repository and applies checked-to-bottom sort', async () => {
      const items = [
        createMockChecklistItem({ id: 'item-1', item_name: 'Checked Item', checked: true }),
        createMockChecklistItem({ id: 'item-2', item_name: 'Unchecked Item', checked: false }),
        createMockChecklistItem({ id: 'item-3', item_name: 'Another Unchecked', checked: false }),
      ];

      const checklistRepo = createMockChecklistRepo({
        getItems: vi.fn().mockResolvedValue(items),
      });
      const tripRepo = createMockTripRepo();
      const wrapper = createTestWrapper({
        repositoryValue: { checklistRepo, tripRepo },
      });

      const { result } = renderHook(() => useChecklistState('trip-001'), { wrapper });

      await waitFor(() => {
        expect(result.current.items.length).toBe(3);
      });

      // Checked items should be at the bottom
      expect(result.current.items[0].item_name).toBe('Unchecked Item');
      expect(result.current.items[1].item_name).toBe('Another Unchecked');
      expect(result.current.items[2].item_name).toBe('Checked Item');

      expect(checklistRepo.getItems).toHaveBeenCalledWith('trip-001');
    });
  });

  describe('toggleCheck', () => {
    it('performs optimistic update - immediately flips local state', async () => {
      const items = [
        createMockChecklistItem({ id: 'item-1', checked: false }),
      ];

      // Make toggleCheck return slowly to observe optimistic update
      let resolveToggle: (value: ChecklistItem) => void;
      const togglePromise = new Promise<ChecklistItem>((resolve) => {
        resolveToggle = resolve;
      });

      const checklistRepo = createMockChecklistRepo({
        getItems: vi.fn().mockResolvedValue(items),
        toggleCheck: vi.fn().mockReturnValue(togglePromise),
      });
      const tripRepo = createMockTripRepo();
      const wrapper = createTestWrapper({
        repositoryValue: { checklistRepo, tripRepo },
      });

      const { result } = renderHook(() => useChecklistState('trip-001'), { wrapper });

      await waitFor(() => {
        expect(result.current.items.length).toBe(1);
      });

      // Toggle - should immediately update local state
      act(() => {
        result.current.toggleCheck('item-1');
      });

      // Optimistic: local state should be flipped immediately
      expect(result.current.items[0].checked).toBe(true);

      // Resolve the backend call
      resolveToggle!(createMockChecklistItem({ id: 'item-1', checked: true }));
    });

    it('rolls back on repository failure', async () => {
      const items = [
        createMockChecklistItem({ id: 'item-1', checked: false }),
      ];

      const checklistRepo = createMockChecklistRepo({
        getItems: vi.fn().mockResolvedValue(items),
        toggleCheck: vi.fn().mockRejectedValue(new Error('Network error')),
      });
      const tripRepo = createMockTripRepo();
      const wrapper = createTestWrapper({
        repositoryValue: { checklistRepo, tripRepo },
      });

      const { result } = renderHook(() => useChecklistState('trip-001'), { wrapper });

      await waitFor(() => {
        expect(result.current.items.length).toBe(1);
      });

      // Toggle - optimistically flips
      act(() => {
        result.current.toggleCheck('item-1');
      });

      expect(result.current.items[0].checked).toBe(true);

      // Wait for rollback after rejection
      await waitFor(() => {
        expect(result.current.items[0].checked).toBe(false);
      });
    });
  });

  describe('addItem', () => {
    it('appends item optimistically', async () => {
      const existingItems = [
        createMockChecklistItem({ id: 'item-1', item_name: 'Existing' }),
      ];

      const newItem: Omit<ChecklistItem, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
        trip_id: 'trip-001',
        item_name: 'New Item',
        category: 'Gear',
        quantity: 1,
        priority: 'recommended',
        assigned_day: null,
        activity_ref: null,
        reasoning: null,
        checked: false,
        booking_link: null,
        source: 'user',
      };

      const addedItem = createMockChecklistItem({
        id: 'item-new',
        ...newItem,
      });

      let resolveAdd: (value: ChecklistItem) => void;
      const addPromise = new Promise<ChecklistItem>((resolve) => {
        resolveAdd = resolve;
      });

      const checklistRepo = createMockChecklistRepo({
        getItems: vi.fn().mockResolvedValue(existingItems),
        addItem: vi.fn().mockReturnValue(addPromise),
      });
      const tripRepo = createMockTripRepo();
      const wrapper = createTestWrapper({
        repositoryValue: { checklistRepo, tripRepo },
      });

      const { result } = renderHook(() => useChecklistState('trip-001'), { wrapper });

      await waitFor(() => {
        expect(result.current.items.length).toBe(1);
      });

      // Add item - should appear immediately in local state
      act(() => {
        result.current.addItem(newItem);
      });

      expect(result.current.items.length).toBe(2);
      expect(result.current.items.some((i: ChecklistItem) => i.item_name === 'New Item')).toBe(true);

      // Resolve the backend call
      resolveAdd!(addedItem);

      await waitFor(() => {
        // After resolution, the optimistic item should be replaced with the real one
        expect(result.current.items.some((i: ChecklistItem) => i.id === 'item-new')).toBe(true);
      });
    });
  });
});
