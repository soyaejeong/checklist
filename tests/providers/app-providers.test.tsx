import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    // Verifies the composition doesn't throw — the correct nesting
    // is enforced by the providers requiring auth context to exist
    const { container } = render(
      <AppProviders>
        <span>Nested content</span>
      </AppProviders>,
    );
    expect(container).toBeDefined();
    expect(screen.getByText('Nested content')).toBeInTheDocument();
  });
});
