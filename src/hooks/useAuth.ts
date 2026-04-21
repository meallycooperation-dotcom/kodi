import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { fetchProfileById, getCachedProfileById } from '../services/profileService';
import type { UserSession } from '../types/user';

const useAuth = () => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!session?.user?.id) {
          if (mounted) setLoading(false);
          return;
        }

        const cachedProfile = await getCachedProfileById(session.user.id);
        if (mounted) {
          setUser(cachedProfile);
          setLoading(false);
        }

        fetchProfileById(session.user.id)
          .then((profile) => {
            if (mounted) {
              setUser(profile);
            }
          })
          .catch((error) => {
            console.error('useAuth.initialize refresh', error);
          });
      } catch (error) {
        console.error('useAuth.initialize', error);
        if (mounted) setLoading(false);
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user?.id) {
        setUser(null);
        return;
      }

      getCachedProfileById(session.user.id)
        .then((profile) => {
          if (profile) setUser(profile);
        })
        .catch((error) => {
          console.error('useAuth auth change cache', error);
        });

      fetchProfileById(session.user.id)
        .then((profile) => {
          if (profile) setUser(profile);
        })
        .catch((error) => {
          console.error('useAuth auth change', error);
        });
    });

    initialize();

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    if (!data.user?.id) {
      return null;
    }

    const profile = await fetchProfileById(data.user.id);
    setUser(profile);
    return profile;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return {
    user,
    loading,
    signIn,
    signOut
  };
};

export default useAuth;
