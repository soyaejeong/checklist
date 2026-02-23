export interface ChecklistItem {
  id: string;
  user_id: string;
  trip_id: string;
  item_name: string;
  category: string;
  quantity: number;
  priority: 'essential' | 'recommended' | 'optional';
  assigned_day: number | null;
  activity_ref: string | null;
  reasoning: string | null;
  checked: boolean;
  booking_link: string | null;
  source: 'user' | 'ai';
  created_at: string;
  updated_at: string;
}

export interface DismissedSuggestion {
  id: string;
  user_id: string;
  trip_id: string;
  item_name: string;
  category: string | null;
  activity_ref: string | null;
  dismissed_at: string;
}

export interface UserCategory {
  id: string;
  user_id: string;
  trip_id: string;
  category_name: string;
  display_order: number;
  created_at: string;
}
