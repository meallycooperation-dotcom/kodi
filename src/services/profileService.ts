import { supabase } from '../lib/supabaseClient';
import type { UserSession } from '../types/user';

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

const mapProfile = (profile: ProfileRow): UserSession => ({
  id: profile.id,
  fullName: profile.full_name ?? 'Unknown',
  email: profile.email ?? 'Unknown'
});

export const fetchProfileById = async (id: string): Promise<UserSession | null> => {
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
