import { describe, it, expect } from 'vitest';
import { sampleTrip, sampleUserProfile, sampleTrips } from '@/data/trips';

describe('sampleTrip', () => {
  it('has the correct trip_id', () => {
    expect(sampleTrip.trip_id).toBe('jeju-adventure-001');
  });

  it('has two travelers', () => {
    expect(sampleTrip.travelers).toHaveLength(2);
    expect(sampleTrip.travelers[0].name).toBe('Minjun');
    expect(sampleTrip.travelers[0].age).toBe(32);
    expect(sampleTrip.travelers[1].name).toBe('Soye');
    expect(sampleTrip.travelers[1].age).toBe(29);
  });

  it('has departure from Seoul', () => {
    expect(sampleTrip.departure.location).toBe('Seoul, KR');
    expect(sampleTrip.departure.date).toBe('2026-04-10');
  });

  it('has destination with coordinates', () => {
    expect(sampleTrip.destination.location).toBe('Jeju Island, KR');
    expect(sampleTrip.destination.country_code).toBe('KR');
    expect(sampleTrip.destination.coordinates.lat).toBe(33.4996);
    expect(sampleTrip.destination.coordinates.lon).toBe(126.5312);
  });

  it('has itinerary with activity_ids', () => {
    expect(sampleTrip.itinerary.length).toBeGreaterThan(0);
    const day1 = sampleTrip.itinerary[0];
    expect(day1.day).toBe(1);
    expect(day1.activities[0].activity_id).toBe('d1-flight');
    expect(day1.activities[1].activity_id).toBe('d1-seongsan');
  });

  it('has complete accommodation structure', () => {
    expect(sampleTrip.accommodation.type).toBe('hotel');
    expect(sampleTrip.accommodation.name).toBe('Jeju Shinhwa Resort');
    expect(sampleTrip.accommodation.booking_ref).toBe('HTL456');
  });

  it('has preferences', () => {
    expect(sampleTrip.preferences.travel_style).toBe('active');
    expect(sampleTrip.preferences.budget_level).toBe('mid-range');
  });
});

describe('sampleUserProfile', () => {
  it('has correct user data', () => {
    expect(sampleUserProfile.user_id).toBe('user-001');
    expect(sampleUserProfile.name).toBe('Minjun');
  });

  it('has health information', () => {
    expect(sampleUserProfile.health.allergies).toContain('pollen');
    expect(sampleUserProfile.health.medications).toContain('antihistamine');
    expect(sampleUserProfile.health.conditions).toContain('mild asthma');
  });

  it('has preferences with must-have items', () => {
    expect(sampleUserProfile.preferences.must_have_items).toContain('Kindle');
    expect(sampleUserProfile.preferences.weather_sensitivity).toBe('gets cold easily');
  });
});

describe('sampleTrips', () => {
  it('exports an array containing the sample trip', () => {
    expect(sampleTrips).toHaveLength(1);
    expect(sampleTrips[0].trip_id).toBe('jeju-adventure-001');
  });
});
