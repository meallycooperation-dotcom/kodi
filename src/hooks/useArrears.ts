import { useEffect, useState } from 'react';
import type { Arrear, TenantArrearBalance } from '../types/arrears';
import { fetchRentArrearsView } from '../services/viewService';
import {
  fetchApartmentArrearsView,
  fetchApartmentPaidView,
  type ApartmentArrearsViewRecord,
  type ApartmentPaidViewRecord
} from '../services/paymentService';
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
        const [arrearsRecords, tenantRecords, apartmentArrearsRecords, apartmentPaidRecords] =
          await Promise.all([
            fetchRentArrearsView(user.id),
            fetchTenants(user.id),
            fetchApartmentArrearsView(user.id),
            fetchApartmentPaidView(user.id)
          ]);

        const uniqueArrearsRecords = Array.from(
          new Map(
            arrearsRecords.map((record) => [
              `${record.tenant_id}-${record.month}`,
              record
            ])
          ).values()
        );

        const tenantById = new Map(tenantRecords.map((t) => [t.id, t.fullName]));
        const unitByTenant = new Map(tenantRecords.map((t) => [t.id, t.unitId]));

        const mapped = uniqueArrearsRecords.map<Arrear>((record) => ({
          id: `${record.tenant_id}-${record.month}`,
          tenantId: record.tenant_id,
          unitId: unitByTenant.get(record.tenant_id) ?? undefined,
          tenantName: tenantById.get(record.tenant_id) ?? 'Unknown',
          amountDue: record.arrears,
          month: record.month,
          status: (record.status as Arrear['status']) ?? 'unpaid',
          createdAt: new Date().toISOString()
        }));

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
            apartmentArrearsRecords.map((record) => [
              `${record.tenantId}-${record.currentMonth}`,
              record
            ])
          ).values()
        );

        const apartmentMapped = uniqueApartmentArrears.map<Arrear>((record) => {
          const apartmentPaid = apartmentPaidMap.get(record.tenantId);
          const tenantName =
            record.tenantName ??
            apartmentPaid?.[0]?.tenantName ??
            'Unknown tenant';
          return {
            id: `apt-${record.tenantId}-${record.currentMonth}`,
            tenantId: record.tenantId,
            unitId: record.apartmentName ?? undefined,
            tenantName,
            amountDue: Number(record.balance ?? 0),
            month: record.currentMonth,
            status: 'overdue',
            createdAt: new Date().toISOString()
          };
        });

        const combined = [...mapped, ...apartmentMapped];

        const balanceMap = new Map<string, TenantArrearBalance>();
        combined.forEach((entry) => {
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

        if (mounted) setArrears(combined);
        if (mounted) setTenantBalances(balances);
      } catch (error) {
        console.error('useArrears error', error);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const totalDue = arrears.reduce((sum, entry) => sum + entry.amountDue, 0);

  return { arrears, totalDue, tenantBalances };
};

export default useArrears;
