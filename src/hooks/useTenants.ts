import { useEffect, useState } from 'react';
import type { Tenant } from '../types/tenant';
import { fetchTenants, fetchApartmentTenants } from '../services/tenantService';
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
      const [unitTenants, apartmentTenants] = await Promise.all([
        fetchTenants(user.id),
        fetchApartmentTenants(user.id)
      ]);
      const data = [...unitTenants, ...apartmentTenants];
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
    const [unitTenants, apartmentTenants] = await Promise.all([
      fetchTenants(user.id),
      fetchApartmentTenants(user.id)
    ]);
    const data = [...unitTenants, ...apartmentTenants];
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
