import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTrip } from '@/hooks/use-trip';
import { createTestWrapper } from '../helpers/test-wrapper';
import { sampleTrip } from '@/data/trips';
import type { TripRepository } from '@/repositories/trip-repository';

function createMockTripRepo(overrides: Partial<TripRepository> = {}): TripRepository {
  return {
    getTripById: vi.fn().mockResolvedValue(sampleTrip),
    listTrips: vi.fn().mockResolvedValue([sampleTrip]),
    ...overrides,
  };
}

describe('useTrip', () => {
  it('loads trip data via repository context', async () => {
    const tripRepo = createMockTripRepo();
    const wrapper = createTestWrapper({
      repositoryValue: {
        checklistRepo: {} as never,
        tripRepo,
      },
    });

    const { result } = renderHook(() => useTrip('jeju-adventure-001'), { wrapper });

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.trip).toEqual(sampleTrip);
    expect(result.current.error).toBeNull();
    expect(tripRepo.getTripById).toHaveBeenCalledWith('jeju-adventure-001');
  });

  it('returns null trip for unknown IDs', async () => {
    const tripRepo = createMockTripRepo({
      getTripById: vi.fn().mockResolvedValue(null),
    });
    const wrapper = createTestWrapper({
      repositoryValue: {
        checklistRepo: {} as never,
        tripRepo,
      },
    });

    const { result } = renderHook(() => useTrip('unknown-id'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.trip).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('exposes error when repository fails', async () => {
    const tripRepo = createMockTripRepo({
      getTripById: vi.fn().mockRejectedValue(new Error('fetch failed')),
    });
    const wrapper = createTestWrapper({
      repositoryValue: {
        checklistRepo: {} as never,
        tripRepo,
      },
    });

    const { result } = renderHook(() => useTrip('trip-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.trip).toBeNull();
    expect(result.current.error).toBe('fetch failed');
  });

  it('re-fetches when tripId changes', async () => {
    const tripRepo = createMockTripRepo();
    const wrapper = createTestWrapper({
      repositoryValue: {
        checklistRepo: {} as never,
        tripRepo,
      },
    });

    const { result, rerender } = renderHook(
      ({ tripId }) => useTrip(tripId),
      { wrapper, initialProps: { tripId: 'trip-1' } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    rerender({ tripId: 'trip-2' });

    await waitFor(() => {
      expect(tripRepo.getTripById).toHaveBeenCalledWith('trip-2');
    });
  });
});
