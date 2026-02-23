import type { ChecklistItem } from '@/types/checklist';

interface MockSupabaseOptions {
  queryData?: unknown[] | null;
  queryError?: { message: string; code: string } | null;
  authUser?: { id: string; is_anonymous: boolean } | null;
}

function createChainableQuery(data: unknown, error: unknown) {
  const chain: Record<string, unknown> = {
    data,
    error,
  };

  const methods = [
    'select',
    'eq',
    'neq',
    'gt',
    'lt',
    'order',
    'limit',
    'single',
    'insert',
    'update',
    'delete',
    'upsert',
    'filter',
    'match',
    'in',
    'is',
    'range',
    'maybeSingle',
  ];

  for (const method of methods) {
    chain[method] = (..._args: unknown[]) => chain;
  }

  return chain;
}

export function createMockSupabaseClient(options: MockSupabaseOptions = {}) {
  const {
    queryData = [],
    queryError = null,
    authUser = { id: 'mock-user-id', is_anonymous: true },
  } = options;

  const resolvedData = queryError ? null : queryData;
  const resolvedError = queryError ?? null;

  return {
    from: (_table: string) => createChainableQuery(resolvedData, resolvedError),

    auth: {
      getUser: async () => ({
        data: {
          user: authUser
            ? { id: authUser.id, app_metadata: {}, user_metadata: {}, aud: 'authenticated', is_anonymous: authUser.is_anonymous }
            : null,
        },
        error: null,
      }),

      signInAnonymously: async () => ({
        data: {
          user: { id: authUser?.id ?? 'anon-id', app_metadata: {}, user_metadata: {}, aud: 'authenticated', is_anonymous: true },
          session: { access_token: 'mock-token', refresh_token: 'mock-refresh' },
        },
        error: null,
      }),

      signOut: async () => ({ error: null }),

      updateUser: async (_attrs: unknown) => ({
        data: { user: authUser ? { id: authUser.id } : null },
        error: null,
      }),

      onAuthStateChange: (cb: (event: string, session: unknown) => void) => ({
        data: {
          subscription: {
            id: 'mock-subscription-id',
            unsubscribe: () => {},
            callback: cb,
          },
        },
      }),

      getSession: async () => ({
        data: {
          session: authUser
            ? { user: { id: authUser.id, is_anonymous: authUser.is_anonymous }, access_token: 'mock-token' }
            : null,
        },
        error: null,
      }),
    },
  };
}

export function createMockChecklistItem(
  overrides: Partial<ChecklistItem> = {},
): ChecklistItem {
  return {
    id: 'item-001',
    user_id: 'mock-user-id',
    trip_id: 'trip-001',
    item_name: 'Hiking Boots',
    category: 'Footwear',
    quantity: 1,
    priority: 'recommended',
    assigned_day: null,
    activity_ref: null,
    reasoning: null,
    checked: false,
    booking_link: null,
    source: 'user',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

export function createMockUser(
  overrides: Partial<{ id: string; isAnonymous: boolean }> = {},
): { id: string; isAnonymous: boolean } {
  return {
    id: 'mock-user-id',
    isAnonymous: true,
    ...overrides,
  };
}
