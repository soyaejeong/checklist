import { describe, it, expect, vi } from 'vitest';
import {
  createMockSupabaseClient,
  createMockChecklistItem,
  createMockUser,
} from './mock-supabase';

describe('createMockSupabaseClient', () => {
  it('provides chainable query builder returning { data, error }', async () => {
    const client = createMockSupabaseClient();
    const result = client.from('checklist_items').select('*').eq('trip_id', 'trip-1').order('created_at');
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('error');
  });

  it('allows configuring query response data', () => {
    const items = [createMockChecklistItem()];
    const client = createMockSupabaseClient({
      queryData: items,
    });
    const result = client.from('checklist_items').select('*');
    expect(result.data).toEqual(items);
    expect(result.error).toBeNull();
  });

  it('allows configuring query error', () => {
    const client = createMockSupabaseClient({
      queryError: { message: 'Not found', code: '404' },
    });
    const result = client.from('checklist_items').select('*');
    expect(result.data).toBeNull();
    expect(result.error).toEqual({ message: 'Not found', code: '404' });
  });

  it('supports insert/update/delete chains returning { data, error }', () => {
    const item = createMockChecklistItem();
    const client = createMockSupabaseClient({ queryData: [item] });
    const insertResult = client.from('checklist_items').insert({ item_name: 'test' }).select().single();
    expect(insertResult).toHaveProperty('data');
    expect(insertResult).toHaveProperty('error');

    const updateResult = client.from('checklist_items').update({ checked: true }).eq('id', '123').select().single();
    expect(updateResult).toHaveProperty('data');

    const deleteResult = client.from('checklist_items').delete().eq('id', '123');
    expect(deleteResult).toHaveProperty('data');
    expect(deleteResult).toHaveProperty('error');
  });

  it('provides auth.getUser returning user data', async () => {
    const client = createMockSupabaseClient();
    const { data } = await client.auth.getUser();
    expect(data.user).toBeDefined();
    expect(data.user?.id).toBeDefined();
  });

  it('provides auth.signInAnonymously', async () => {
    const client = createMockSupabaseClient();
    const result = await client.auth.signInAnonymously();
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('provides auth.onAuthStateChange with unsubscribe', () => {
    const client = createMockSupabaseClient();
    const cb = vi.fn();
    const { data: { subscription } } = client.auth.onAuthStateChange(cb);
    expect(subscription).toBeDefined();
    expect(typeof subscription.unsubscribe).toBe('function');
  });

  it('allows configuring auth user to be null (no session)', async () => {
    const client = createMockSupabaseClient({ authUser: null });
    const { data } = await client.auth.getUser();
    expect(data.user).toBeNull();
  });
});

describe('createMockChecklistItem', () => {
  it('returns a valid ChecklistItem with defaults', () => {
    const item = createMockChecklistItem();
    expect(item.id).toBeDefined();
    expect(item.user_id).toBeDefined();
    expect(item.trip_id).toBeDefined();
    expect(item.item_name).toBeDefined();
    expect(item.category).toBeDefined();
    expect(item.quantity).toBeGreaterThanOrEqual(1);
    expect(['essential', 'recommended', 'optional']).toContain(item.priority);
    expect(typeof item.checked).toBe('boolean');
    expect(['user', 'ai']).toContain(item.source);
  });

  it('accepts overrides', () => {
    const item = createMockChecklistItem({
      item_name: 'Custom Item',
      checked: true,
      category: 'Health',
    });
    expect(item.item_name).toBe('Custom Item');
    expect(item.checked).toBe(true);
    expect(item.category).toBe('Health');
  });
});

describe('createMockUser', () => {
  it('returns a user with id and isAnonymous', () => {
    const user = createMockUser();
    expect(user.id).toBeDefined();
    expect(typeof user.isAnonymous).toBe('boolean');
  });

  it('accepts overrides', () => {
    const user = createMockUser({ id: 'custom-id', isAnonymous: false });
    expect(user.id).toBe('custom-id');
    expect(user.isAnonymous).toBe(false);
  });
});
