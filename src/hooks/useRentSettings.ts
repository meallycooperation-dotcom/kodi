import { useEffect, useState } from 'react';
import type { RentSettingInput } from '../services/tenantService';
import { supabase } from '../lib/supabaseClient';

type RentSettingRow = {
  id: string;
  user_id: string | null;
  rent_mode: string;
  default_rent: number;
  created_at: string;
};

const useRentSettings = (userId?: string) => {
  const [settings, setSettings] = useState<RentSettingRow[]>([]);

  useEffect(() => {
    if (!userId) return;

    let mounted = true;
    const load = async () => {
      const { data, error } = await supabase
        .from('rent_settings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('useRentSettings error', error);
        return;
      }
      if (mounted && data) {
        setSettings(data);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [userId]);

  return { settings };
};

export default useRentSettings;
