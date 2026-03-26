import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
const useRentSettings = (userId) => {
    const [settings, setSettings] = useState([]);
    useEffect(() => {
        if (!userId)
            return;
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
