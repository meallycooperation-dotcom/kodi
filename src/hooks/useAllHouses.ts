import { useEffect, useState } from 'react';
import type { House } from '../types/house';
import { fetchAllHouses } from '../services/houseService';

const useAllHouses = (userId?: string) => {
  const [houses, setHouses] = useState<House[]>([]);

  useEffect(() => {
    if (!userId) {
      setHouses([]);
      return;
    }

    let mounted = true;

    const loadHouses = async () => {
      try {
        const fetched = await fetchAllHouses(userId);
        if (mounted) {
          setHouses(fetched);
        }
      } catch (error) {
        console.error('useAllHouses error', error);
        if (mounted) setHouses([]);
      }
    };

    loadHouses();

    return () => {
      mounted = false;
    };
  }, [userId]);

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
