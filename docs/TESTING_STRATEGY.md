# Testing Strategy

## Overview

This project uses a **multi-tier testing strategy** that balances speed, reliability, and confidence:

1. **Unit Tests** - Fast, isolated tests with mocked dependencies
2. **E2E (End-to-End) Tests** - Comprehensive tests with real Supabase instance

## Test Architecture

### Directory Structure Pattern

Unit tests and mocks **mirror the source file structure**:
- Source: `src/path/to/file.ts`
- Test: `tests/path/to/file.test.ts`
- Mock: `tests/path/to/__mocks__/file.ts`

This makes it easy to find tests and mocks for any source file.

```
tests/
├── api/              # API layer unit tests (mirror src/api/)
├── hooks/            # React hooks unit tests (mirror src/hooks/)
├── components/       # Component unit tests (mirror src/components/)
├── lib/              # Library mocks (mirror src/lib/)
│   └── __mocks__/
│       └── supabase.ts
├── e2e/              # E2E tests with real Supabase (~10+ minutes)
├── fixtures/         # Reusable test data factories
└── helpers/          # Test helper utilities
```

## Running Tests

```bash
# Run all tests (unit + E2E)
npm test

# Run only fast unit tests (recommended during TDD)
npm run test:unit

# Run only E2E tests (pre-deployment validation)
npm run test:e2e

# Run skill tests
npm run test:skill
```

## Unit Tests (Mocked)

### Purpose
- **Fast feedback** during TDD cycle (< 1 second)
- **Isolated testing** of business logic
- **No external dependencies** - works without Supabase credentials
- **High test coverage** with many edge cases

### When to Write Unit Tests
- Testing React hooks
- Testing utility functions
- Testing component rendering logic
- Testing error handling and edge cases
- Testing loading states and data transformations

### Example Unit Test

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useChecklistItems } from '../../src/hooks/useChecklistItems';
import { createMockChecklistItem } from '../fixtures/checklistData';
import { mockUsers } from '../fixtures/userData';

// Mock the Supabase client
vi.mock('../../src/lib/supabase');

test('fetches checklist items for anonymous user', async () => {
  const mockItem = createMockChecklistItem({
    item_name: 'Hiking boots',
    category: 'Footwear',
    priority: 'essential',
  });
  const mockSupabase = (await import('../../src/lib/supabase')).supabase;

  // Setup mock responses — anonymous auth returns a user with a UUID
  mockSupabase.auth.getUser.mockResolvedValueOnce({
    data: { user: mockUsers.anonymous },
    error: null,
  });

  // ... setup query builder mocks ...

  const { result } = renderHook(
    () => useChecklistItems('jeju-adventure-001'),
    { wrapper: createWrapper() }
  );

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  expect(result.current.items).toEqual([mockItem]);
});
```

## E2E Tests (Real Supabase)

### Purpose
- **Validate real integration** with Supabase
- **Verify RLS policies** and database triggers
- **Test actual authentication** flows
- **Confirm schema correctness**

### When to Write E2E Tests
- Testing RLS (Row Level Security) policies
- Testing database triggers and functions
- Testing actual API endpoints
- Testing full user authentication flows
- Pre-deployment validation

### Characteristics
- ⚠️ **Slow** - Each test takes 2-10+ seconds
- ⚠️ **Requires credentials** - Needs `.env.local` with Supabase URL and anon key
- ⚠️ **Network dependent** - Can fail due to connectivity issues
- ✅ **High confidence** - Tests the actual production behavior
- ✅ **Runs in CI** - Automatically validates every push using TEST database
- ✅ **Respects RLS** - Always uses proper authentication (no RLS bypass)
- ✅ **Simple auth** - Uses anonymous auth for test users (no pre-creation needed)

### E2E Test Authentication

E2E tests use **Supabase Anonymous Auth** — each test creates a fresh anonymous user via `signInAnonymously()`. This provides:

- ✅ Perfect test isolation (each test gets a unique UUID)
- ✅ No pre-created users or environment variables needed
- ✅ RLS policies tested with real auth
- ✅ Zero setup beyond Supabase URL + anon key

**Example usage:**
```typescript
import { createClient } from '@supabase/supabase-js';

let testClient: SupabaseClient;
let testUserId: string;

beforeAll(async () => {
  testClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Each test gets a fresh anonymous user
  const { data } = await testClient.auth.signInAnonymously();
  testUserId = data.user!.id;
});

afterAll(async () => {
  // Clean up test data
  await testClient.from('checklist_items').delete().eq('user_id', testUserId);
  await testClient.from('dismissed_suggestions').delete().eq('user_id', testUserId);
});
```

**Setup:**
1. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`
2. Ensure anonymous auth is enabled in Supabase Dashboard
3. For CI: Add both env vars as secrets

## Mocking Infrastructure

### Mock Supabase Client

Location: `tests/lib/__mocks__/supabase.ts`

The mock client provides:
- **Auth methods**: `getUser()`, `signInAnonymously()`, `signOut()`
- **Query builder**: Chainable methods like `.from().select().eq().maybeSingle()`
- **Customizable responses**: Override defaults per test

To use the mock, simply mock the module in your test:

```typescript
// Mock the Supabase client at the top of your test file
vi.mock('../../src/lib/supabase');

// Access the mock in your test
const mockSupabase = (await import('../../src/lib/supabase')).supabase;

// Customize per test
mockSupabase.auth.getUser.mockResolvedValue({
  data: { user: mockUsers.authenticated },
  error: null,
});
```

### Test Fixtures

#### Checklist Data (`tests/fixtures/checklistData.ts`)

```typescript
import { createMockChecklistItem, mockChecklistItems } from '../fixtures/checklistData';

// Create custom checklist item
const item = createMockChecklistItem({
  item_name: 'Hiking boots',
  category: 'Footwear',
  priority: 'essential',
  day_relevance: [2],
  activity_ref: 'd2-hallasan',
});

// Use predefined scenarios
const essentialItem = mockChecklistItems.essential;
const aiSuggestion = mockChecklistItems.aiSuggestion;
const checkedItem = mockChecklistItems.checked;
```

#### User Data (`tests/fixtures/userData.ts`)

```typescript
import { createMockUser, mockUsers } from '../fixtures/userData';

// Use predefined users
const user = mockUsers.anonymous;        // anonymous auth user (default)
const different = mockUsers.different;   // different anonymous user (for isolation)

// Create custom user
const customUser = createMockUser({
  id: 'custom-anonymous-id',
  is_anonymous: true,
});
```

## Best Practices

### 1. Use Unit Tests for TDD

During development, run **unit tests continuously**:

```bash
npm run test:unit -- --watch
```

- Tests run in < 1 second
- Instant feedback on code changes
- No network delays or flakiness

### 2. Use E2E Tests for Validation

Run E2E tests **before major milestones**:

- Before creating a pull request
- Before deploying to production
- After schema migrations
- When testing security policies

### 3. Mock at the Right Level

**Do mock:**
- External APIs (Supabase client)
- Database connections
- Authentication services
- Network requests

**Don't mock:**
- Your own business logic
- Simple utility functions
- React hooks (test them, don't mock them)

### 4. Keep Mocks Simple

```typescript
// ✅ Good - Simple, focused mock
mockSupabase.auth.getUser.mockResolvedValue({
  data: { user: mockUsers.authenticated },
  error: null,
});

// ❌ Bad - Over-complicated mock
mockSupabase.auth.getUser.mockImplementation(async () => {
  if (someCondition) {
    // Complex logic
  } else {
    // More complex logic
  }
});
```

### 5. Use Test Fixtures

```typescript
// ✅ Good - Use fixtures
const item = createMockItem({ name: 'Test Item' });

// ❌ Bad - Inline data duplication
const item = {
  id: 'test-id',
  user_id: 'test-user',
  name: 'Test Item',
  status: 'active',
  created_at: '2025-01-15T00:00:00Z',
  updated_at: '2025-01-15T00:00:00Z',
};
```

## Performance Comparison

| Test Type | Execution Time | Use Case |
|-----------|----------------|----------|
| Unit Tests | ~1 second | TDD, rapid feedback |
| E2E Tests | ~10-15 minutes | Pre-deployment validation |

**Speed improvement:** Unit tests are **~1000x faster** than E2E tests!

## Future Improvements

### Potential Additions

1. **Integration Tests** - Test multiple components together with mocks
2. **Visual Regression Tests** - Screenshot comparisons
3. **Performance Tests** - Load and stress testing
4. **MSW (Mock Service Worker)** - HTTP request mocking for API tests

### Test Coverage Goals

- **Unit Tests:** 80%+ coverage of business logic
- **E2E Tests:** 100% coverage of critical user paths
- **Integration Tests:** Key workflows

## Troubleshooting

### "Cannot read properties of undefined"

The mock structure may be incomplete. Ensure all chained methods are mocked:

```typescript
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
const mockEq = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    maybeSingle: mockMaybeSingle,
  }),
});
```

### E2E Tests Failing Randomly

- **Check network connectivity** to Supabase
- **Verify credentials** in `.env.local`
- **Check rate limits** on Supabase project
- **Review cleanup logic** - Old test data may interfere

### TypeScript Errors with Mocks

Use Vitest's built-in mock types:

```typescript
import { vi, type Mock } from 'vitest';
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [React Query Testing](https://tanstack.com/query/latest/docs/framework/react/guides/testing)
