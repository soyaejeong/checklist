import { describe, it, expect } from 'vitest';
import type { TripRepository } from '@/repositories/trip-repository';
import type { Trip } from '@/types/trip';

describe('TripRepository', () => {
  const mockRepo: TripRepository = {
    getTripById: async (_tripId: string): Promise<Trip | null> => null,
    listTrips: async (): Promise<Trip[]> => [],
  };

  it('declares getTripById(tripId) returning Promise<Trip | null>', () => {
    expect(mockRepo.getTripById).toBeDefined();
  });

  it('declares listTrips() returning Promise<Trip[]>', () => {
    expect(mockRepo.listTrips).toBeDefined();
  });
});
