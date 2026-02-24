import type { TripRepository } from '@/repositories/trip-repository';
import type { Trip } from '@/types/trip';
import { sampleTrips } from '@/data/trips';

export class HardcodedTripRepository implements TripRepository {
  async getTripById(tripId: string): Promise<Trip | null> {
    return sampleTrips.find((t) => t.trip_id === tripId) ?? null;
  }

  async listTrips(): Promise<Trip[]> {
    return sampleTrips;
  }
}
