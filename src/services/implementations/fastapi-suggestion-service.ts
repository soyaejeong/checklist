import type { SuggestionService } from '@/services/suggestion-service';
import type { Suggestion } from '@/types/suggestion';

export class FastAPISuggestionService implements SuggestionService {
  async getSuggestions(): Promise<Suggestion[]> {
    return [];
  }

  getCachedSuggestions(_tripId: string): Suggestion[] | null {
    return null;
  }

  invalidateCache(_tripId: string): void {
    // no-op stub — real implementation in Slice 7
  }
}
