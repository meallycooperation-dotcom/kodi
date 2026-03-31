import { useEffect, useState } from 'react';
import type { Tenant } from '../types/tenant';
import { fetchTenants } from '../services/tenantService';
import useAuth from './useAuth';

const useTenants = () => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadTenants = async () => {
      if (!user?.id) {
        if (mounted) {
          setTenants([]);
        }
        return;
      }
      const data = await fetchTenants(user.id);
      if (mounted) {
        setTenants(data);
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
      return;
    }
    const data = await fetchTenants(user.id);
    setTenants(data);
  };

  return {
    tenants,
    refresh
  };
};

export default useTenants;
