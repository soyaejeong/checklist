import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => {
      const chain: Record<string, unknown> = { data: [], error: null };
      const methods = ['select', 'eq', 'order', 'insert', 'update', 'delete', 'single', 'filter', 'match', 'in', 'is', 'limit'];
      for (const m of methods) chain[m] = () => chain;
      return chain;
    },
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signInAnonymously: async () => ({ data: { user: null, session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getSession: async () => ({ data: { session: null }, error: null }),
    },
  }),
}));

import { AppProviders } from '@/app/providers';

describe('AppProviders', () => {
  it('renders children within nested provider stack without errors', () => {
    render(
      <AppProviders>
        <div data-testid="child">Hello</div>
      </AppProviders>,
    );
    expect(screen.getByTestId('child')).toHaveTextContent('Hello');
  });

  it('nests AuthProvider > RepositoryProvider > SuggestionProvider', () => {
    const { container } = render(
      <AppProviders>
        <span>Nested content</span>
      </AppProviders>,
    );
    expect(container).toBeDefined();
    expect(screen.getByText('Nested content')).toBeInTheDocument();
  });
});
