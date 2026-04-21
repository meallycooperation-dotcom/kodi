import { useCallback, useEffect, useState } from 'react';
import type { Tenant } from '../types/tenant';
import {
  fetchTenants,
  fetchApartmentTenants,
  getCachedApartmentTenants,
  getCachedTenants
} from '../services/tenantService';
import useAuth from './useAuth';
import { useRealtimeRefresh } from './useRealtimeRefresh';

const useTenants = () => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTenants = useCallback(async () => {
    if (!user?.id) {
      setTenants([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [cachedUnitTenants, cachedApartmentTenants] = await Promise.all([
        getCachedTenants(user.id),
        getCachedApartmentTenants(user.id)
      ]);
      setTenants([...cachedUnitTenants, ...cachedApartmentTenants]);
    } catch (error) {
      console.error('useTenants cache error', error);
    }

    try {
      const [unitTenants, apartmentTenants] = await Promise.all([
        fetchTenants(user.id),
        fetchApartmentTenants(user.id)
      ]);
      const data = [...unitTenants, ...apartmentTenants];
      setTenants(data);
    } catch (error) {
      console.error('useTenants error', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  useRealtimeRefresh({
    enabled: Boolean(user?.id),
    channelName: `tenants:${user?.id ?? 'guest'}`,
    tables: [
      {
        table: 'tenants',
        filter: user?.id ? `creator_id=eq.${user.id}` : undefined
      },
      {
        table: 'apartment_tenants',
        filter: user?.id ? `user_id=eq.${user.id}` : undefined
      },
      {
        table: 'houses'
      }
    ],
    onChange: loadTenants
  });

  const refresh = async () => {
    await loadTenants();
  };

  return {
    tenants,
    refresh,
    isLoading
  };
};

export default useTenants;
