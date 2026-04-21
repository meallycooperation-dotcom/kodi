import { useCallback, useEffect, useRef, useState } from 'react';
import type { Unit } from '../types/unit';
import { fetchUnits, getCachedUnits } from '../services/unitService';
import { loadReadThrough } from '../lib/readThrough';
import { useRealtimeRefresh } from './useRealtimeRefresh';

const useUnits = (status: Unit['status'] | 'all' = 'vacant', ownerId?: string) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadUnits = useCallback(() => {
    return loadReadThrough<Unit[]>({
      loadCached: () => getCachedUnits(undefined, status, ownerId),
      loadFresh: () => fetchUnits(undefined, status, ownerId),
      onCached: setUnits,
      onFresh: setUnits,
      onError: (error) => {
        console.error('useUnits error', error);
      },
      isActive: () => isMounted.current
    });
  }, [ownerId, status]);

  useEffect(() => {
    void loadUnits();
  }, [loadUnits]);

  useRealtimeRefresh({
    enabled: Boolean(ownerId),
    channelName: `units:${ownerId ?? 'guest'}:${status}`,
    tables: [
      {
        table: 'units',
        filter: ownerId ? `creator_id=eq.${ownerId}` : undefined
      },
      {
        table: 'houses',
        filter: ownerId ? `creator_id=eq.${ownerId}` : undefined
      }
    ],
    onChange: loadUnits
  });

  const refresh = async (overrideStatus?: Unit['status'] | 'all') => {
    try {
      const data = await fetchUnits(undefined, overrideStatus ?? status, ownerId);
      setUnits(data);
    } catch (error) {
      console.error('useUnits refresh error', error);
    }
  };

  return { units, refresh };
};

export default useUnits;
