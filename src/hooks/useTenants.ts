import { useEffect, useState } from 'react';
import type { Tenant } from '../types/tenant';
import { fetchTenants } from '../services/tenantService';

const useTenants = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadTenants = async () => {
      const data = await fetchTenants();
      if (mounted) setTenants(data);
    };

    loadTenants();

    return () => {
      mounted = false;
    };
  }, []);

  const refresh = async () => {
    const data = await fetchTenants();
    setTenants(data);
  };

  return {
    tenants,
    refresh
  };
};

export default useTenants;
