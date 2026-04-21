import { useCallback, useEffect, useState } from 'react';
import type { DashboardSummaryRow } from '../services/viewService';
import { fetchDashboardSummaryView, getCachedDashboardSummaryView } from '../services/viewService';
import useAuth from './useAuth';
import { useRealtimeRefresh } from './useRealtimeRefresh';

const useDashboardSummary = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummaryRow | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    if (!user?.id) {
      setSummary(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const rows = await getCachedDashboardSummaryView(user.id);
      setSummary(rows[0] ?? null);
    } catch (error) {
      console.error('useDashboardSummary cache error', error);
    }

    try {
      const rows = await fetchDashboardSummaryView(user.id);
      setSummary(rows[0] ?? null);
    } catch (error) {
      console.error('useDashboardSummary error', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useRealtimeRefresh({
    enabled: Boolean(user?.id),
    channelName: `dashboard-summary:${user?.id ?? 'guest'}`,
    tables: [
      {
        table: 'payments',
        filter: user?.id ? `creator_id=eq.${user.id}` : undefined
      },
      {
        table: 'apartment_payments',
        filter: user?.id ? `creator_id=eq.${user.id}` : undefined
      },
      {
        table: 'tenants',
        filter: user?.id ? `creator_id=eq.${user.id}` : undefined
      },
      {
        table: 'apartment_tenants',
        filter: user?.id ? `user_id=eq.${user.id}` : undefined
      },
      {
        table: 'units',
        filter: user?.id ? `creator_id=eq.${user.id}` : undefined
      },
      {
        table: 'houses'
      }
    ],
    onChange: loadSummary
  });

  return { summary, loading };
};

export default useDashboardSummary;
