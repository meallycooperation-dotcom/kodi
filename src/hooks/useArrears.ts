import { useEffect, useState } from 'react';
import type { Arrear, TenantArrearBalance } from '../types/arrears';
import { fetchRentArrearsView } from '../services/viewService';
import { fetchTenants } from '../services/tenantService';
import useAuth from './useAuth';

const useArrears = () => {
  const { user } = useAuth();
  const [arrears, setArrears] = useState<Arrear[]>([]);
  const [tenantBalances, setTenantBalances] = useState<TenantArrearBalance[]>([]);

  useEffect(() => {
    let mounted = true;

    if (!user?.id) {
      setArrears([]);
      setTenantBalances([]);
      return;
    }

    (async () => {
      try {
        const [arrearsRecords, tenantRecords] = await Promise.all([
          fetchRentArrearsView(user.id),
          fetchTenants(user.id)
        ]);

        const tenantById = new Map(tenantRecords.map((t) => [t.id, t.fullName]));

        const mapped = arrearsRecords.map<Arrear>((record) => ({
          id: `${record.tenant_id}-${record.month}`,
          tenantId: record.tenant_id,
          tenantName: tenantById.get(record.tenant_id) ?? 'Unknown',
          amountDue: record.arrears,
          month: record.month,
          status: (record.status as Arrear['status']) ?? 'unpaid',
          createdAt: new Date().toISOString()
        }));

        const balanceMap = new Map<string, TenantArrearBalance>();
        mapped.forEach((entry) => {
          const existing = balanceMap.get(entry.tenantId);
          const months = existing ? [...existing.months] : [];
          if (!months.includes(entry.month)) {
            months.push(entry.month);
          }
          balanceMap.set(entry.tenantId, {
            tenantId: entry.tenantId,
            tenantName: entry.tenantName ?? 'Unknown',
            totalDue: (existing?.totalDue ?? 0) + entry.amountDue,
            months
          });
        });
        const balances = Array.from(balanceMap.values()).sort((a, b) => b.totalDue - a.totalDue);

        if (mounted) setArrears(mapped);
        if (mounted) setTenantBalances(balances);
      } catch (error) {
        console.error('useArrears error', error);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const totalDue = arrears.reduce((sum, entry) => sum + entry.amountDue, 0);

  return { arrears, totalDue, tenantBalances };
};

export default useArrears;
