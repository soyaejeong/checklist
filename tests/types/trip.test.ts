import { describe, it, expect } from 'vitest';
import type { Trip, UserProfile, Activity } from '@/types/trip';

describe('Trip', () => {
  it('accepts a valid Trip object', () => {
    const trip: Trip = {
      trip_id: 'jeju-adventure-001',
      travelers: [{ name: 'Minjun', age: 32 }],
      departure: { location: 'Seoul, KR', date: '2026-04-10' },
      destination: {
        location: 'Jeju Island, KR',
        country_code: 'KR',
        coordinates: { lat: 33.4996, lon: 126.5312 },
      },
      return_date: '2026-04-14',
      itinerary: [],
      preferences: { travel_style: 'active', budget_level: 'mid-range' },
      accommodation: { type: 'hotel', name: 'Resort', booking_ref: 'HTL456' },
    };
    expect(trip.trip_id).toBe('jeju-adventure-001');
    expect(trip.destination.coordinates.lat).toBe(33.4996);
  });

  it('accepts multiple travelers', () => {
    const trip: Trip = {
      trip_id: 'test',
      travelers: [
        { name: 'Minjun', age: 32 },
        { name: 'Soye', age: 29 },
      ],
      departure: { location: 'Seoul', date: '2026-04-10' },
      destination: {
        location: 'Jeju',
        country_code: 'KR',
        coordinates: { lat: 33.5, lon: 126.5 },
      },
      return_date: '2026-04-14',
      itinerary: [],
      preferences: { travel_style: 'active', budget_level: 'mid-range' },
      accommodation: { type: 'hotel', name: 'Hotel', booking_ref: 'REF' },
    };
    expect(trip.travelers).toHaveLength(2);
  });

  it('accepts itinerary with activities', () => {
    const trip: Trip = {
      trip_id: 'test',
      travelers: [{ name: 'Test', age: 30 }],
      departure: { location: 'Seoul', date: '2026-04-10' },
      destination: {
        location: 'Jeju',
        country_code: 'KR',
        coordinates: { lat: 33.5, lon: 126.5 },
      },
      return_date: '2026-04-14',
      itinerary: [
        {
          day: 1,
          date: '2026-04-10',
          activities: [
            { activity_id: 'd1-flight', type: 'flight', detail: 'GMP→CJU' },
          ],
        },
      ],
      preferences: { travel_style: 'active', budget_level: 'mid-range' },
      accommodation: { type: 'hotel', name: 'Hotel', booking_ref: 'REF' },
    };
    expect(trip.itinerary[0].activities[0].activity_id).toBe('d1-flight');
  });

  it('rejects objects with missing required fields', () => {
    // @ts-expect-error - missing required fields
    const invalid: Trip = { trip_id: 'test' };
    expect(invalid).toBeDefined();
  });
});

describe('UserProfile', () => {
  it('accepts a valid UserProfile object', () => {
    const profile: UserProfile = {
      user_id: 'user-001',
      name: 'Minjun',
      health: {
        allergies: ['pollen'],
        medications: ['antihistamine'],
        conditions: ['mild asthma'],
      },
      travel_style: 'active',
      preferences: {
        must_have_items: ['Kindle', 'neck pillow'],
        weather_sensitivity: 'gets cold easily',
      },
    };
    expect(profile.name).toBe('Minjun');
    expect(profile.health.allergies).toContain('pollen');
  });

  it('rejects objects with missing required fields', () => {
    // @ts-expect-error - missing required fields
    const invalid: UserProfile = { user_id: 'user-001' };
    expect(invalid).toBeDefined();
  });
});

describe('Activity', () => {
  it('accepts a minimal Activity', () => {
    const activity: Activity = {
      activity_id: 'd1-flight',
      type: 'flight',
      detail: 'GMP→CJU 08:30',
    };
    expect(activity.activity_id).toBe('d1-flight');
    expect(activity.notes).toBeUndefined();
  });

  it('accepts Activity with optional fields', () => {
    const activity: Activity = {
      activity_id: 'd1-flight',
      type: 'flight',
      detail: 'GMP→CJU 08:30',
      notes: 'Early morning',
      booking_ref: 'KE1234',
    };
    expect(activity.notes).toBe('Early morning');
    expect(activity.booking_ref).toBe('KE1234');
  });
});
