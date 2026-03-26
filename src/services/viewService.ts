import { supabase } from '../lib/supabaseClient';

export type DashboardSummaryRow = {
  user_id: string;
  total_tenants: number;
  total_expected_rent: number;
  total_collected: number;
  total_arrears: number;
};

export type MonthlyRevenueRow = {
  user_id: string;
  month: string;
  expected_revenue: number;
  collected_revenue: number;
  total_arrears: number;
};

export type TenantPaymentHistoryRow = {
  tenant_id: string;
  full_name: string | null;
  amount_paid: number;
  payment_date: string;
  month_paid_for: string;
  payment_method: string | null;
  reference: string | null;
};

export type RentArrearsRow = {
  tenant_id: string;
  month: string;
  arrears: number;
  status: string;
  created_at: string | null;
};

const handleError = (error: Error | null) => {
  if (error) {
    console.error(error);
    throw error;
  }
};

export const fetchDashboardSummaryView = async (creatorId?: string): Promise<DashboardSummaryRow[]> => {
  if (!creatorId) {
    return [];
  }

  const { data, error } = await supabase
    .from('dashboard_summary_view')
    .select('*')
    .eq('creator_id', creatorId);
  handleError(error);
  return data ?? [];
};

export const fetchMonthlyRevenueView = async (creatorId?: string): Promise<MonthlyRevenueRow[]> => {
  if (!creatorId) {
    return [];
  }

  const { data, error } = await supabase
    .from('monthly_revenue_view')
    .select('user_id, month, expected_revenue, collected_revenue, total_arrears')
    .eq('creator_id', creatorId)
    .order('month', { ascending: false });
  handleError(error);
  return data ?? [];
};

export const fetchTenantPaymentHistoryView = async (userId?: string): Promise<TenantPaymentHistoryRow[]> => {
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

export const fetchRentArrearsView = async (userId?: string): Promise<RentArrearsRow[]> => {
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
