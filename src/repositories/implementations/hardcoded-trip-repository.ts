import type { TripRepository } from '@/repositories/trip-repository';
import type { Trip } from '@/types/trip';

// Stub: full implementation by Trip Data section worker
export class HardcodedTripRepository implements TripRepository {
  async getTripById(_tripId: string): Promise<Trip | null> {
    throw new Error('Not implemented');
  }

  async listTrips(): Promise<Trip[]> {
    throw new Error('Not implemented');
  }
}
