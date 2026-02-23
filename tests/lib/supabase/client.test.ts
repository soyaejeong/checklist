import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @supabase/supabase-js before importing the module under test
const mockCreateClient = vi.fn().mockReturnValue({ auth: {}, from: vi.fn() });
vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

describe('Supabase client', () => {
  beforeEach(() => {
    vi.resetModules();
    mockCreateClient.mockClear();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  it('exports createClient function', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    expect(typeof createClient).toBe('function');
  });

  it('creates client with environment variables', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    createClient();
    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({
        realtime: expect.any(Object),
      }),
    );
  });

  it('returns singleton instance on repeated calls', async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const first = createClient();
    const second = createClient();
    expect(first).toBe(second);
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
  });

  it('throws when environment variables are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { createClient } = await import('@/lib/supabase/client');
    expect(() => createClient()).toThrow('Missing');
  });
});
