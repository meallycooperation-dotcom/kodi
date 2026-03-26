import { supabase } from '../lib/supabaseClient';
const handleError = (error) => {
    if (error) {
        console.error(error);
        throw error;
    }
};
export const fetchDashboardSummaryView = async (creatorId) => {
    if (!creatorId) {
        return [];
    }
    const { data, error } = await supabase
        .from('dashboard_summary_view')
        .select('*')
        .eq('creator_id', creatorId)
        .limit(1);
    handleError(error);
    return data ?? [];
};
export const fetchMonthlyRevenueView = async (creatorId) => {
    if (!creatorId) {
        return [];
    }
    const { data, error } = await supabase
        .from('monthly_revenue_view')
        .select('user_id, month, expected_revenue, collected_revenue, total_arrears')
        .eq('creator_id', creatorId)
        .order('month', { ascending: false })
        .limit(12);
    handleError(error);
    return data ?? [];
};
export const fetchTenantPaymentHistoryView = async (userId) => {
    if (!userId) {
        return [];
    }
    const { data, error } = await supabase
        .from('tenant_payment_history_view')
        .select('tenant_id, full_name, amount_paid, payment_date, month_paid_for, payment_method, reference')
        .eq('creator_id', userId)
        .order('payment_date', { ascending: false })
        .limit(10);
    handleError(error);
    return data ?? [];
};
export const fetchRentArrearsView = async (userId) => {
    if (!userId) {
        return [];
    }
    const { data, error } = await supabase
        .from('rent_arrears_view')
        .select('tenant_id, month, arrears, status, created_at')
        .eq('creator_id', userId)
        .order('month', { ascending: false })
        .limit(10);
    handleError(error);
    return data ?? [];
};
