import { useCallback, useEffect, useRef, useState } from 'react';
import type { House } from '../types/house';
import { fetchHouses, getCachedHouses } from '../services/houseService';
import { loadReadThrough } from '../lib/readThrough';
import { useRealtimeRefresh } from './useRealtimeRefresh';

const useHouses = (unitId?: string) => {
  const [houses, setHouses] = useState<House[]>([]);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadHouses = useCallback(() => {
    if (!unitId) {
      setHouses([]);
      return Promise.resolve();
    }

    return loadReadThrough<House[]>({
      loadCached: () => getCachedHouses(unitId),
      loadFresh: () => fetchHouses(unitId),
      onCached: setHouses,
      onFresh: setHouses,
      onError: (error) => {
        console.error('useHouses error', error);
      },
      isActive: () => isMounted.current
    });
  }, [unitId]);

  useEffect(() => {
    void loadHouses();
  }, [loadHouses]);

  useRealtimeRefresh({
    enabled: Boolean(unitId),
    channelName: `houses:${unitId ?? 'guest'}`,
    tables: [
      {
        table: 'houses',
        filter: unitId ? `unit_id=eq.${unitId}` : undefined
      }
    ],
    onChange: loadHouses
  });

  const refresh = async () => {
    if (!unitId) {
      setHouses([]);
      return;
    }

    try {
      const fetched = await fetchHouses(unitId);
      setHouses(fetched);
    } catch (error) {
      console.error('useHouses refresh error', error);
      setHouses([]);
    }
  };

  return { houses, refresh };
};

export default useHouses;
