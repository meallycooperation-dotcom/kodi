import { useCallback, useEffect, useState } from 'react';
import type { RentSettingInput } from '../services/tenantService';
import { supabase } from '../lib/supabaseClient';
import { buildCacheKey, readCache, writeCache } from '../lib/appCache';
import { useRealtimeRefresh } from './useRealtimeRefresh';

type RentSettingRow = {
  id: string;
  user_id: string | null;
  rent_mode: string;
  default_rent: number;
  created_at: string;
};

const useRentSettings = (userId?: string) => {
  const [settings, setSettings] = useState<RentSettingRow[]>([]);
  const cacheKey = buildCacheKey('rent-settings', userId ?? 'all');

  const load = useCallback(async () => {
    if (!userId) return;

    try {
      const cached = await readCache<RentSettingRow[]>(cacheKey, []);
      setSettings(cached);
    } catch (error) {
      console.error('useRentSettings cache error', error);
    }

    const { data, error } = await supabase
      .from('rent_settings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('useRentSettings error', error);
      return;
    }
    if (data) {
      setSettings(data);
      await writeCache(cacheKey, data);
    }
  }, [cacheKey, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtimeRefresh({
    enabled: Boolean(userId),
    channelName: `rent-settings:${userId ?? 'guest'}`,
    tables: [
      {
        table: 'rent_settings',
        filter: userId ? `user_id=eq.${userId}` : undefined
      }
    ],
    onChange: load
  });

  return { settings };
};

export default useRentSettings;
