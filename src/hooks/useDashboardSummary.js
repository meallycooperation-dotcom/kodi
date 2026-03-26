import { useEffect, useState } from 'react';
import { fetchDashboardSummaryView } from '../services/viewService';
import useAuth from './useAuth';
const useDashboardSummary = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!user?.id) {
            setSummary(null);
            setLoading(false);
            return;
        }
        let mounted = true;
        setLoading(true);
        fetchDashboardSummaryView(user.id)
            .then((rows) => {
            if (!mounted)
                return;
            setSummary(rows[0] ?? null);
        })
            .catch((error) => {
            console.error('useDashboardSummary error', error);
        })
            .finally(() => {
            if (mounted) {
                setLoading(false);
            }
        });
        return () => {
            mounted = false;
        };
    }, [user?.id]);
    return { summary, loading };
};
export default useDashboardSummary;
