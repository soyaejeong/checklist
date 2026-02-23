import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fastapiClient } from '@/lib/http/fastapi-client';

describe('fastapiClient', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  it('builds URL from API base constant', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'test' }),
    });

    await fastapiClient('/api/suggestions');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/suggestions',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('sends JSON body for POST requests', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ suggestions: [] }),
    });

    await fastapiClient('/api/suggestions', {
      method: 'POST',
      body: { trip_id: 'test' },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/suggestions',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip_id: 'test' }),
      }),
    );
  });

  it('returns parsed JSON response', async () => {
    const responseData = { suggestions: [{ item_name: 'Test' }] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => responseData,
    });

    const result = await fastapiClient('/api/suggestions');
    expect(result).toEqual(responseData);
  });

  it('throws on non-OK response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fastapiClient('/api/suggestions')).rejects.toThrow(
      'FastAPI request failed: 500 Internal Server Error',
    );
  });
});
