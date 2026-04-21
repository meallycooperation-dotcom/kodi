import { useCallback, useEffect, useRef, useState } from 'react';
import type { House } from '../types/house';
import { fetchAllHouses, getCachedAllHouses } from '../services/houseService';
import { loadReadThrough } from '../lib/readThrough';
import { useRealtimeRefresh } from './useRealtimeRefresh';

const useAllHouses = (userId?: string) => {
  const [houses, setHouses] = useState<House[]>([]);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadHouses = useCallback(() => {
    if (!userId) {
      setHouses([]);
      return Promise.resolve();
    }

    return loadReadThrough<House[]>({
      loadCached: () => getCachedAllHouses(userId),
      loadFresh: () => fetchAllHouses(userId),
      onCached: setHouses,
      onFresh: setHouses,
      onError: (error) => {
        console.error('useAllHouses error', error);
      },
      isActive: () => isMounted.current
    });
  }, [userId]);

  useEffect(() => {
    void loadHouses();
  }, [loadHouses]);

  useRealtimeRefresh({
    enabled: Boolean(userId),
    channelName: `all-houses:${userId ?? 'guest'}`,
    tables: [
      {
        table: 'units',
        filter: userId ? `creator_id=eq.${userId}` : undefined
      },
      { table: 'houses' }
    ],
    onChange: loadHouses
  });

  const refresh = async () => {
    if (!userId) {
      setHouses([]);
      return;
    }

    try {
      const fetched = await fetchAllHouses(userId);
      setHouses(fetched);
    } catch (error) {
      console.error('useAllHouses refresh error', error);
      setHouses([]);
    }
  };

  return { houses, refresh };
};

export default useAllHouses;
