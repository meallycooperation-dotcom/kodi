import { useCallback, useEffect, useRef, useState } from 'react';
import type { Arrear, TenantArrearBalance } from '../types/arrears';
import { fetchRentArrearsView, getCachedRentArrearsView } from '../services/viewService';
import {
  fetchApartmentArrearsView,
  fetchApartmentPaidView,
  getCachedApartmentArrearsView,
  getCachedApartmentPaidView,
  type ApartmentArrearsViewRecord,
  type ApartmentPaidViewRecord
} from '../services/paymentService';
import { fetchTenants, getCachedTenants } from '../services/tenantService';
import useAuth from './useAuth';
import { isUuid } from '../utils/uuid';
import { useRealtimeRefresh } from './useRealtimeRefresh';

const useArrears = () => {
  const { user } = useAuth();
  const [arrears, setArrears] = useState<Arrear[]>([]);
  const [tenantBalances, setTenantBalances] = useState<TenantArrearBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isMounted = useRef(true);

  const loadArrears = useCallback(async () => {
    if (!user?.id) {
      if (isMounted.current) {
        setArrears([]);
        setTenantBalances([]);
        setIsLoading(false);
      }
      return;
    }

    if (isMounted.current) {
      setIsLoading(true);
    }

    const buildState = (
      tenantRecords: Awaited<ReturnType<typeof fetchTenants>>,
      arrearsRecords: Awaited<ReturnType<typeof fetchRentArrearsView>>,
      apartmentArrearsRecords: ApartmentArrearsViewRecord[],
      apartmentPaidRecords: ApartmentPaidViewRecord[]
    ) => {
      const uniqueArrearsRecords = Array.from(
        new Map(arrearsRecords.map((record) => [record.tenant_id, record])).values()
      );

      const tenantById = new Map(tenantRecords.map((t) => [t.id, t.fullName]));
      const unitByTenant = new Map(tenantRecords.map((t) => [t.id, t.unitId]));

      const mapped = uniqueArrearsRecords.map<Arrear>((record) => {
        const arrearsValue = Number(record.arrears ?? 0);
        return {
          id: `unit-${record.tenant_id}`,
          tenantId: record.tenant_id,
          unitId: unitByTenant.get(record.tenant_id) ?? undefined,
          tenantName:
            tenantById.get(record.tenant_id) ??
            record.full_name ??
            'Unknown tenant',
          amountDue: arrearsValue,
          totalExpectedRent: Number(record.total_expected_rent ?? 0),
          totalPaid: Number(record.total_paid ?? 0),
          monthsStayed: Number(record.months_stayed ?? 0) || undefined,
          status:
            (record.status as Arrear['status']) ??
            (arrearsValue <= 0 ? 'paid' : 'unpaid'),
          createdAt: new Date().toISOString()
        };
      });

      const apartmentPaidMap = new Map<string, ApartmentPaidViewRecord[]>();
      apartmentPaidRecords.forEach((record) => {
        if (!record.tenantId) {
          return;
        }
        const values = apartmentPaidMap.get(record.tenantId) ?? [];
        values.push(record);
        apartmentPaidMap.set(record.tenantId, values);
      });

      const uniqueApartmentArrears = Array.from(
        new Map<string, ApartmentArrearsViewRecord>(
          apartmentArrearsRecords.map((record) => [record.tenantId, record])
        ).values()
      );

      const apartmentMapped = uniqueApartmentArrears.map<Arrear>((record) => {
        const apartmentPaid = apartmentPaidMap.get(record.tenantId);
        const tenantName =
          record.tenantName ??
          apartmentPaid?.[0]?.tenantName ??
          'Unknown tenant';
        const arrearsValue = Number(record.balance ?? 0);
        return {
          id: `apt-${record.tenantId}`,
          tenantId: record.tenantId,
          unitId: record.apartmentName ?? undefined,
          tenantName,
          amountDue: arrearsValue,
          totalExpectedRent: record.totalExpectedRent,
          totalPaid: record.totalPaid,
          monthsStayed: record.monthsStayed,
          status: record.status ?? (arrearsValue <= 0 ? 'paid' : 'unpaid'),
          createdAt: new Date().toISOString()
        };
      });

      const combined = [...mapped, ...apartmentMapped];

      const balanceMap = new Map<string, TenantArrearBalance>();
      combined.forEach((entry) => {
        const existing = balanceMap.get(entry.tenantId);
        const totalExpectedRent =
          entry.totalExpectedRent || existing?.totalExpectedRent || 0;
        const totalPaid = entry.totalPaid || existing?.totalPaid || 0;
        const arrears = entry.amountDue;
        const monthsStayed = entry.monthsStayed ?? existing?.monthsStayed;
        const status =
          entry.status ??
          existing?.status ??
          (arrears <= 0 ? 'paid' : 'unpaid');
        balanceMap.set(entry.tenantId, {
          tenantId: entry.tenantId,
          tenantName: entry.tenantName ?? existing?.tenantName ?? 'Unknown',
          totalExpectedRent,
          totalPaid,
          arrears,
          monthsStayed,
          status
        });
      });
      const balances = Array.from(balanceMap.values()).sort((a, b) => b.arrears - a.arrears);

      if (isMounted.current) {
        setArrears(combined);
        setTenantBalances(balances);
      }
    };

    try {
      const tenantRecords = await getCachedTenants(user.id);
      const tenantIds = tenantRecords.map((tenant) => tenant.id).filter(isUuid);
      const [arrearsRecords, apartmentArrearsRecords, apartmentPaidRecords] = await Promise.all([
        getCachedRentArrearsView(user.id),
        getCachedApartmentArrearsView(tenantIds),
        getCachedApartmentPaidView(user.id)
      ]);

      buildState(tenantRecords, arrearsRecords, apartmentArrearsRecords, apartmentPaidRecords);
    } catch (error) {
      console.error('useArrears cache error', error);
    }

    try {
      const tenantRecords = await fetchTenants(user.id);
      const tenantIds = tenantRecords.map((tenant) => tenant.id).filter(isUuid);
      const [arrearsRecords, apartmentArrearsRecords, apartmentPaidRecords] = await Promise.all([
        fetchRentArrearsView(user.id),
        fetchApartmentArrearsView(tenantIds),
        fetchApartmentPaidView(user.id)
      ]);

      buildState(tenantRecords, arrearsRecords, apartmentArrearsRecords, apartmentPaidRecords);
    } catch (error) {
      console.error('useArrears error', error);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    loadArrears();
  }, [loadArrears]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handler = () => {
      loadArrears();
    };
    window.addEventListener('apartment-payment-recorded', handler);
    return () => window.removeEventListener('apartment-payment-recorded', handler);
  }, [loadArrears]);

  useRealtimeRefresh({
    enabled: Boolean(user?.id),
    channelName: `arrears:${user?.id ?? 'guest'}`,
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
        table: 'payments',
        filter: user?.id ? `creator_id=eq.${user.id}` : undefined
      },
      {
        table: 'apartment_payments',
        filter: user?.id ? `creator_id=eq.${user.id}` : undefined
      },
      {
        table: 'units',
        filter: user?.id ? `creator_id=eq.${user.id}` : undefined
      },
      { table: 'houses' }
    ],
    onChange: loadArrears
  });

  const totalDue = arrears.reduce((sum, entry) => sum + entry.amountDue, 0);
  const totalExpectedRent = tenantBalances.reduce(
    (sum, entry) => sum + entry.totalExpectedRent,
    0
  );
  const totalPaid = tenantBalances.reduce((sum, entry) => sum + entry.totalPaid, 0);

  return { arrears, totalDue, totalExpectedRent, totalPaid, tenantBalances, isLoading };
};

export default useArrears;
