'use client';

import { useState, useCallback } from 'react';

interface UseSuggestionBannerResult {
  bannerSeen: boolean;
  bannerExpanded: boolean;
  markSeen: () => void;
  setExpanded: (expanded: boolean) => void;
}

function storageKey(tripId: string): string {
  return `suggestion-banner-seen:${tripId}`;
}

export function useSuggestionBanner(tripId: string): UseSuggestionBannerResult {
  const [bannerSeen, setBannerSeen] = useState<boolean>(() => {
    return localStorage.getItem(storageKey(tripId)) === 'true';
  });

  const [bannerExpanded, setBannerExpanded] = useState<boolean>(() => {
    // Auto-expand on first visit (per UISPEC), collapsed on subsequent visits
    const seen = localStorage.getItem(storageKey(tripId)) === 'true';
    return !seen;
  });

  const markSeen = useCallback(() => {
    localStorage.setItem(storageKey(tripId), 'true');
    setBannerSeen(true);
  }, [tripId]);

  const setExpanded = useCallback((expanded: boolean) => {
    setBannerExpanded(expanded);
  }, []);

  return { bannerSeen, bannerExpanded, markSeen, setExpanded };
}
