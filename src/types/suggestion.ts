export interface Suggestion {
  item_name: string;
  category: string;
  quantity: number;
  priority: 'essential' | 'recommended' | 'optional';
  assigned_day: number | null;
  activity_ref: string | null;
  reasoning: string;
  booking_link: string | null;
}
