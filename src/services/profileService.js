import { supabase } from '../lib/supabaseClient';
const mapProfile = (profile) => ({
    id: profile.id,
    fullName: profile.full_name ?? 'Unknown',
    email: profile.email ?? 'Unknown'
});
export const fetchProfileById = async (id) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', id)
        .single();
    if (error) {
        console.error('fetchProfileById', error);
        return null;
    }
    return data ? mapProfile(data) : null;
};
