import type { Trip, UserProfile } from '@/types/trip';

export const sampleTrip: Trip = {
  trip_id: 'jeju-adventure-001',
  travelers: [
    { name: 'Minjun', age: 32 },
    { name: 'Soye', age: 29 },
  ],
  departure: { location: 'Seoul, KR', date: '2026-04-10' },
  destination: {
    location: 'Jeju Island, KR',
    country_code: 'KR',
    coordinates: { lat: 33.4996, lon: 126.5312 },
  },
  return_date: '2026-04-14',
  itinerary: [
    {
      day: 1,
      date: '2026-04-10',
      activities: [
        {
          activity_id: 'd1-flight',
          type: 'flight',
          detail: 'GMP→CJU 08:30',
          booking_ref: 'KE1234',
        },
        {
          activity_id: 'd1-seongsan',
          type: 'sightseeing',
          detail: 'Seongsan Ilchulbong',
          notes: '1hr hike',
        },
      ],
    },
    {
      day: 2,
      date: '2026-04-11',
      activities: [
        {
          activity_id: 'd2-hallasan',
          type: 'outdoor_activity',
          detail: 'Hallasan full-day hike',
          notes: 'Eorimok trail, 6-8hrs',
        },
      ],
    },
    {
      day: 3,
      date: '2026-04-12',
      activities: [
        {
          activity_id: 'd3-beach',
          type: 'leisure',
          detail: 'Hyeopjae Beach',
        },
      ],
    },
    {
      day: 4,
      date: '2026-04-13',
      activities: [
        {
          activity_id: 'd4-market',
          type: 'shopping',
          detail: 'Dongmun Traditional Market',
        },
      ],
    },
    {
      day: 5,
      date: '2026-04-14',
      activities: [
        {
          activity_id: 'd5-flight',
          type: 'flight',
          detail: 'CJU→GMP 18:00',
          booking_ref: 'KE5678',
        },
      ],
    },
  ],
  preferences: { travel_style: 'active', budget_level: 'mid-range' },
  accommodation: {
    type: 'hotel',
    name: 'Jeju Shinhwa Resort',
    booking_ref: 'HTL456',
  },
};

export const sampleUserProfile: UserProfile = {
  user_id: 'user-001',
  name: 'Minjun',
  health: {
    allergies: ['pollen'],
    medications: ['antihistamine'],
    conditions: ['mild asthma'],
  },
  travel_style: 'active',
  preferences: {
    must_have_items: ['Kindle', 'neck pillow', 'antihistamine'],
    weather_sensitivity: 'gets cold easily',
  },
};

export const sampleTrips: Trip[] = [sampleTrip];
