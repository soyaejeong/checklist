'use client';

import { useState, useEffect, useContext } from 'react';
import { RepositoryContext } from '@/providers/repository-provider';
import type { Trip } from '@/types/trip';

interface UseTripResult {
  trip: Trip | null;
  loading: boolean;
  error: string | null;
}

export function useTrip(tripId: string): UseTripResult {
  const repoContext = useContext(RepositoryContext);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repoContext) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    repoContext.tripRepo
      .getTripById(tripId)
      .then((result) => {
        if (!cancelled) {
          setTrip(result);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setTrip(null);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tripId, repoContext]);

  return { trip, loading, error };
}
