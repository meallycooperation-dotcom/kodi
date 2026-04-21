import { useCallback, useEffect, useState } from 'react';
import type { MonthlyRevenueRow } from '../services/viewService';
import { fetchMonthlyRevenueView, getCachedMonthlyRevenueView } from '../services/viewService';
import useAuth from './useAuth';
import { useRealtimeRefresh } from './useRealtimeRefresh';

const useMonthlyRevenue = () => {
  const { user } = useAuth();
  const [months, setMonths] = useState<MonthlyRevenueRow[]>([]);

  const loadMonthlyRevenue = useCallback(async () => {
    if (!user?.id) {
      setMonths([]);
      return;
    }

    try {
      const rows = await getCachedMonthlyRevenueView(user.id);
      setMonths(rows);
    } catch (error) {
      console.error('useMonthlyRevenue cache error', error);
    }

    try {
      const rows = await fetchMonthlyRevenueView(user.id);
      setMonths(rows);
    } catch (error) {
      console.error('useMonthlyRevenue error', error);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadMonthlyRevenue();
  }, [loadMonthlyRevenue]);

  useRealtimeRefresh({
    enabled: Boolean(user?.id),
    channelName: `monthly-revenue:${user?.id ?? 'guest'}`,
    tables: [
      {
        table: 'payments',
        filter: user?.id ? `creator_id=eq.${user.id}` : undefined
      },
      {
        table: 'apartment_payments',
        filter: user?.id ? `creator_id=eq.${user.id}` : undefined
      }
    ],
    onChange: loadMonthlyRevenue
  });

  return { months };
};

export default useMonthlyRevenue;
