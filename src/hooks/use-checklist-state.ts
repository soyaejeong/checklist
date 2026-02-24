'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ChecklistItem } from '@/types/checklist';
import { useChecklist } from '@/hooks/use-checklist';
import { sortCheckedToBottom } from '@/utils/item-sorting';

interface UseChecklistStateReturn {
  items: ChecklistItem[];
  loading: boolean;
  toggleCheck: (id: string) => void;
  addItem: (item: Omit<ChecklistItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
}

export function useChecklistState(tripId: string): UseChecklistStateReturn {
  const repo = useChecklist();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    repo.getItems(tripId).then((data) => {
      if (!cancelled) {
        setItems(sortCheckedToBottom(data));
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [tripId, repo]);

  const toggleCheck = useCallback((id: string) => {
    // Optimistic update: flip local state immediately
    setItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      );
      return sortCheckedToBottom(updated);
    });

    // Call repository, rollback on failure
    repo.toggleCheck(id).catch(() => {
      setItems((prev) => {
        const rolledBack = prev.map((item) =>
          item.id === id ? { ...item, checked: !item.checked } : item,
        );
        return sortCheckedToBottom(rolledBack);
      });
    });
  }, [repo]);

  const addItem = useCallback((item: Omit<ChecklistItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    // Optimistic: create a temporary item
    const tempId = `temp-${Date.now()}`;
    const optimisticItem: ChecklistItem = {
      ...item,
      id: tempId,
      user_id: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setItems((prev) => sortCheckedToBottom([...prev, optimisticItem]));

    // Call repository, replace temp with real item on success
    repo.addItem(item).then((realItem) => {
      setItems((prev) => {
        const replaced = prev.map((i) => (i.id === tempId ? realItem : i));
        return sortCheckedToBottom(replaced);
      });
    }).catch(() => {
      // Remove optimistic item on failure
      setItems((prev) => sortCheckedToBottom(prev.filter((i) => i.id !== tempId)));
    });
  }, [repo]);

  return { items, loading, toggleCheck, addItem };
}
