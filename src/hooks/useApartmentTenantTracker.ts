import { useEffect, useMemo, useState } from 'react';
import useAuth from './useAuth';
import { supabase } from '../lib/supabaseClient';

type ApartmentTenantRecord = {
  id: string;
  apartmentId: string | null;
  houseId: string | null;
  fullName: string | null;
};

const useApartmentTenantTracker = () => {
  const { user } = useAuth();
  const [apartments, setApartments] = useState<{ id: string; name?: string | null }[]>([]);
  const [tenantRecords, setTenantRecords] = useState<ApartmentTenantRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      if (!user?.id) {
        if (mounted) {
          setApartments([]);
          setTenantRecords([]);
          setLoading(false);
        }
        return;
      }

      try {
        const { data: apartmentData, error: apartmentError } = await supabase
          .from('apartments')
          .select('id, name')
          .eq('creator_id', user.id);

        if (apartmentError) {
          throw apartmentError;
        }

        if (!mounted) {
          return;
        }

        const apartmentList = apartmentData ?? [];
        setApartments(apartmentList);

        const apartmentIds = apartmentList.map((apt) => apt.id);
        if (apartmentIds.length === 0) {
          setTenantRecords([]);
          return;
        }

        const { data: blocksData, error: blockError } = await supabase
          .from('blocks')
          .select('id, apartment_id')
          .in('apartment_id', apartmentIds);
        if (blockError) {
          throw blockError;
        }

        const blockRows = blocksData ?? [];
        const blockApartmentMap = new Map(blockRows.map((block) => [block.id, block.apartment_id]));
        const blockIds = blockRows.map((block) => block.id);

        const houseQuery = supabase.from('houses').select('id, block_id');
        if (blockIds.length > 0) {
          houseQuery.in('block_id', blockIds);
        }
        const { data: houseData, error: houseError } = await houseQuery;
        if (houseError) {
          throw houseError;
        }
        const houseRows = houseData ?? [];
        const houseApartmentMap = new Map(
          houseRows.map((house) => [house.id, blockApartmentMap.get(house.block_id) ?? null])
        );
        const houseIds = houseRows.map((house) => house.id);

        const tenantQuery = supabase
          .from('apartment_tenants')
          .select('id, house_id, full_name')
          .eq('status', 'active');
        if (houseIds.length > 0) {
          tenantQuery.in('house_id', houseIds);
        } else {
          tenantQuery.limit(0);
        }
        const { data: tenantData, error: tenantError } = await tenantQuery;
        if (tenantError) {
          throw tenantError;
        }

        const tenants = (tenantData ?? []).map((tenant) => ({
          id: tenant.id,
          apartmentId: houseApartmentMap.get(tenant.house_id) ?? null,
          houseId: tenant.house_id,
          fullName: tenant.full_name
        }));
        if (!mounted) {
          return;
        }
        setTenantRecords(tenants);
      } catch (error) {
        console.error('useApartmentTenantTracker error', error);
        if (mounted) {
          setTenantRecords([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const tenantCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tenantRecords.forEach((tenant) => {
      if (!tenant.apartmentId) {
        return;
      }
      counts[tenant.apartmentId] = (counts[tenant.apartmentId] ?? 0) + 1;
    });
    return counts;
  }, [tenantRecords]);

  const totalTenants = useMemo(
    () => Object.values(tenantCounts).reduce((sum, value) => sum + value, 0),
    [tenantCounts]
  );

  return {
    apartments,
    tenantRecords,
    tenantCounts,
    totalTenants,
    loading
  };
};

export default useApartmentTenantTracker;
