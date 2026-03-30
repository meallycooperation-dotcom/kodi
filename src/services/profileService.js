import { supabase } from '../lib/supabaseClient';
const mapProfile = (profile) => ({
    id: profile.id,
    fullName: profile.full_name ?? 'Unknown',
    email: profile.email ?? 'Unknown',
    createdAt: profile.created_at ?? new Date().toISOString()
});
export const fetchProfileById = async (id) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .eq('id', id)
        .single();
    if (error) {
        console.error('fetchProfileById', error);
        return null;
    }
    return data ? mapProfile(data) : null;
};
export const changePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
        console.error('changePassword', error);
        return { success: false, error: error.message };
    }
    return { success: true };
};
