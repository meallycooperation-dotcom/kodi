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
  full_name: string | null;
  user_id: string;
  unit_number: string | null;
  property_id: string | null;
  expected_rent: number;
  months_stayed: number;
  total_expected_rent: number;
  total_paid: number;
  arrears: number;
  status: 'paid' | 'unpaid';
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
    .eq('user_id', creatorId);
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
    .eq('user_id', creatorId)
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
    .eq('user_id', userId)
    .order('payment_date', { ascending: false })
    .limit(12);

  handleError(error);
  return data ?? [];
};

export const fetchRentArrearsView = async (userId?: string): Promise<RentArrearsRow[]> => {
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from('rent_arrears_view')
    .select(
      'tenant_id, full_name, user_id, unit_number, property_id, expected_rent, months_stayed, total_expected_rent, total_paid, arrears, status'
    )
    .eq('user_id', userId)
    .order('arrears', { ascending: false });

  handleError(error);
  return data ?? [];
};
