import { describe, it, expect } from 'vitest';
import { HardcodedTripRepository } from '@/repositories/implementations/hardcoded-trip-repository';

describe('HardcodedTripRepository', () => {
  const repo = new HardcodedTripRepository();

  describe('getTripById()', () => {
    it('returns matching trip from sample data', async () => {
      const trip = await repo.getTripById('jeju-adventure-001');
      expect(trip).not.toBeNull();
      expect(trip!.trip_id).toBe('jeju-adventure-001');
      expect(trip!.destination.location).toBeDefined();
      expect(trip!.itinerary).toBeDefined();
      expect(trip!.travelers).toBeDefined();
    });

    it('returns null for unknown IDs', async () => {
      const trip = await repo.getTripById('nonexistent-trip');
      expect(trip).toBeNull();
    });
  });

  describe('listTrips()', () => {
    it('returns all sample trips with correct Trip structure', async () => {
      const trips = await repo.listTrips();
      expect(trips.length).toBeGreaterThan(0);
      for (const trip of trips) {
        expect(trip.trip_id).toBeDefined();
        expect(trip.travelers).toBeDefined();
        expect(trip.departure).toBeDefined();
        expect(trip.destination).toBeDefined();
        expect(trip.itinerary).toBeDefined();
      }
    });
  });
});
