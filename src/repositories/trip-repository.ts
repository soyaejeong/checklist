import type { Trip } from '@/types/trip';

export interface TripRepository {
  getTripById(tripId: string): Promise<Trip | null>;
  listTrips(): Promise<Trip[]>;
}
