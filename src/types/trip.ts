export interface Activity {
  activity_id: string;
  type: string;
  detail: string;
  notes?: string;
  booking_ref?: string;
}

export interface Trip {
  trip_id: string;
  travelers: { name: string; age: number }[];
  departure: { location: string; date: string };
  destination: {
    location: string;
    country_code: string;
    coordinates: { lat: number; lon: number };
  };
  return_date: string;
  itinerary: { day: number; date: string; activities: Activity[] }[];
  preferences: { travel_style: string; budget_level: string };
  accommodation: { type: string; name: string; booking_ref: string };
}

export interface UserProfile {
  user_id: string;
  name: string;
  health: {
    allergies: string[];
    medications: string[];
    conditions: string[];
  };
  travel_style: string;
  preferences: {
    must_have_items: string[];
    weather_sensitivity: string;
  };
}
