import { useEffect, useState } from 'react';
import type { Tenant } from '../types/tenant';
import { fetchTenants } from '../services/tenantService';
import useAuth from './useAuth';

const useTenants = () => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadTenants = async () => {
      if (!user?.id) {
        if (mounted) {
          setTenants([]);
          setIsLoading(false);
        }
        return;
      }

      if (mounted) {
        setIsLoading(true);
      }
      const data = await fetchTenants(user.id);
      if (mounted) {
        setTenants(data);
        setIsLoading(false);
      }
    };

    loadTenants();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const refresh = async () => {
    if (!user?.id) {
      setTenants([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const data = await fetchTenants(user.id);
    setTenants(data);
    setIsLoading(false);
  };

  return {
    tenants,
    refresh,
    isLoading
  };
};

export default useTenants;
