import { useEffect, useState } from 'react';
import type { MonthlyRevenueRow } from '../services/viewService';
import { fetchMonthlyRevenueView } from '../services/viewService';
import useAuth from './useAuth';

const useMonthlyRevenue = () => {
  const { user } = useAuth();
  const [months, setMonths] = useState<MonthlyRevenueRow[]>([]);

  useEffect(() => {
    if (!user?.id) {
      setMonths([]);
      return;
    }

    let mounted = true;
    fetchMonthlyRevenueView(user.id)
      .then((rows) => {
        if (!mounted) return;
        setMonths(rows);
      })
      .catch((error) => {
        console.error('useMonthlyRevenue error', error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { months };
};

export default useMonthlyRevenue;
