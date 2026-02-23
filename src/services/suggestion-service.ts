import type { Trip, UserProfile } from '@/types/trip';
import type { DismissedSuggestion } from '@/types/checklist';
import type { Suggestion } from '@/types/suggestion';

export interface SuggestionService {
  getSuggestions(params: {
    trip: Trip;
    userProfile: UserProfile;
    existingItems: string[];
    dismissedItems: DismissedSuggestion[];
  }): Promise<Suggestion[]>;
  getCachedSuggestions(tripId: string): Suggestion[] | null;
  invalidateCache(tripId: string): void;
}
