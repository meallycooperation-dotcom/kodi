import { supabase } from '../lib/supabaseClient';
import { buildCacheKey, readCache, writeCache } from '../lib/appCache';

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
  previousArrears?: number;
};

type TenantArrearsRow = {
  id: string;
  arrears: number | null;
};

const handleError = (error: Error | null) => {
  if (error) {
    console.error(error);
    throw error;
  }
};

const isMissingRelationError = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const typedError = error as { code?: string; message?: string };
  return (
    typedError.code === 'PGRST205' ||
    typedError.message?.includes("Could not find the table 'public.") === true ||
    typedError.message?.includes('schema cache') === true
  );
};

const monthsBetween = (startDate?: string | null) => {
  if (!startDate) {
    return 1;
  }

  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) {
    return 1;
  }

  const now = new Date();
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth()) +
    1;
  return Math.max(1, months);
};

const dashboardSummaryCacheKey = (creatorId: string) => buildCacheKey('dashboard-summary', creatorId);
const monthlyRevenueCacheKey = (creatorId: string) => buildCacheKey('monthly-revenue', creatorId);
const tenantPaymentHistoryCacheKey = (userId: string) => buildCacheKey('tenant-payment-history', userId);
const rentArrearsCacheKey = (userId: string) => buildCacheKey('rent-arrears', userId);

export const getCachedDashboardSummaryView = async (creatorId?: string): Promise<DashboardSummaryRow[]> =>
  readCache<DashboardSummaryRow[]>(dashboardSummaryCacheKey(creatorId ?? 'all'), []);

export const getCachedMonthlyRevenueView = async (creatorId?: string): Promise<MonthlyRevenueRow[]> =>
  readCache<MonthlyRevenueRow[]>(monthlyRevenueCacheKey(creatorId ?? 'all'), []);

export const getCachedTenantPaymentHistoryView = async (userId?: string): Promise<TenantPaymentHistoryRow[]> =>
  readCache<TenantPaymentHistoryRow[]>(tenantPaymentHistoryCacheKey(userId ?? 'all'), []);

export const getCachedRentArrearsView = async (userId?: string): Promise<RentArrearsRow[]> =>
  readCache<RentArrearsRow[]>(rentArrearsCacheKey(userId ?? 'all'), []);

export const fetchDashboardSummaryView = async (creatorId?: string): Promise<DashboardSummaryRow[]> => {
  if (!creatorId) {
    return [];
  }

  const { data, error } = await supabase
    .from('dashboard_summary_view')
    .select('*')
    .eq('user_id', creatorId);
  if (!error) {
    const rows = data ?? [];
    await writeCache(dashboardSummaryCacheKey(creatorId), rows);
    return rows;
  }

  if (!isMissingRelationError(error)) {
    handleError(error);
  }

  const [tenantResponse, apartmentTenantResponse, paymentResponse, apartmentPaymentResponse, unitResponse] =
    await Promise.all([
      supabase
        .from('tenants')
        .select('id, unit_id, arrears, move_in_date, units!left(rent_amount)')
        .eq('creator_id', creatorId),
      supabase
        .from('apartment_tenants')
        .select('id, house_id, arrears, move_in_date, houses!left(rent_amount, block_id, blocks!left(price, apartment_id, apartments!left(id)))')
        .eq('user_id', creatorId),
      supabase
        .from('payments')
        .select('amount_paid')
        .eq('creator_id', creatorId),
      supabase
        .from('apartment_payments')
        .select('amount_paid')
        .eq('creator_id', creatorId),
      supabase
        .from('units')
        .select('rent_amount')
        .eq('creator_id', creatorId)
    ]);

  const tenantCount = (tenantResponse.data ?? []).length + (apartmentTenantResponse.data ?? []).length;
  const totalCollected =
    (paymentResponse.data ?? []).reduce((sum, row) => sum + Number(row.amount_paid ?? 0), 0) +
    (apartmentPaymentResponse.data ?? []).reduce((sum, row) => sum + Number(row.amount_paid ?? 0), 0);

  const tenantExpectedRent = (tenantResponse.data ?? []).reduce((sum, row: any) => {
    const rentAmount = Number(row.units?.rent_amount ?? 0);
    return sum + rentAmount * monthsBetween(row.move_in_date);
  }, 0);

  const apartmentExpectedRent = (apartmentTenantResponse.data ?? []).reduce((sum, row: any) => {
    const rentAmount = Number(row.houses?.rent_amount ?? row.houses?.blocks?.price ?? 0);
    return sum + rentAmount * monthsBetween(row.move_in_date);
  }, 0);

  const tenantArrears = (tenantResponse.data ?? []).reduce(
    (sum, row: any) => sum + Number(row.arrears ?? 0),
    0
  );
  const apartmentArrears = (apartmentTenantResponse.data ?? []).reduce(
    (sum, row: any) => sum + Number(row.arrears ?? 0),
    0
  );

  const rows = [
    {
      user_id: creatorId,
      total_tenants: tenantCount,
      total_expected_rent: tenantExpectedRent + apartmentExpectedRent,
      total_collected: totalCollected,
      total_arrears: tenantArrears + apartmentArrears
    }
  ];

  await writeCache(dashboardSummaryCacheKey(creatorId), rows);
  return rows;
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
  if (!error) {
    const rows = data ?? [];
    await writeCache(monthlyRevenueCacheKey(creatorId), rows);
    return rows;
  }

  if (!isMissingRelationError(error)) {
    handleError(error);
  }

  const [paymentsResponse, apartmentPaymentsResponse] = await Promise.all([
    supabase
      .from('payments')
      .select('amount_paid, payment_date, month_paid_for, creator_id')
      .eq('creator_id', creatorId),
    supabase
      .from('apartment_payments')
      .select('amount_paid, payment_date, month_paid_for, creator_id')
      .eq('creator_id', creatorId)
  ]);

  const buckets = new Map<string, MonthlyRevenueRow>();

  const addToBucket = (monthValue: string | null | undefined, amount: number) => {
    const monthKey = monthValue ? monthValue.slice(0, 7) : new Date().toISOString().slice(0, 7);
    const existing = buckets.get(monthKey) ?? {
      user_id: creatorId,
      month: monthKey,
      expected_revenue: 0,
      collected_revenue: 0,
      total_arrears: 0
    };
    existing.collected_revenue += amount;
    existing.expected_revenue += amount;
    buckets.set(monthKey, existing);
  };

  (paymentsResponse.data ?? []).forEach((row: any) => addToBucket(row.month_paid_for, Number(row.amount_paid ?? 0)));
  (apartmentPaymentsResponse.data ?? []).forEach((row: any) => addToBucket(row.month_paid_for, Number(row.amount_paid ?? 0)));

  const rows = Array.from(buckets.values()).sort((a, b) => b.month.localeCompare(a.month));
  await writeCache(monthlyRevenueCacheKey(creatorId), rows);
  return rows;
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
  const rows = data ?? [];
  await writeCache(tenantPaymentHistoryCacheKey(userId), rows);
  return rows;
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

  if (!error) {
    const rows = data ?? [];
    const tenantIds = Array.from(new Set(rows.map((row) => row.tenant_id)));
    let tenantArrearsMap = new Map<string, number>();
    if (tenantIds.length > 0) {
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('id, arrears')
        .in('id', tenantIds);
      handleError(tenantError);
      tenantArrearsMap = new Map(
        (tenantData ?? []).map((tenantRow) => [tenantRow.id, Number(tenantRow.arrears ?? 0)])
      );
    }

    const records = rows.map((row) => {
      const previousArrears = tenantArrearsMap.get(row.tenant_id) ?? 0;
      const totalArrears = Number(row.arrears ?? 0) + previousArrears;
      return {
        ...row,
        arrears: totalArrears,
        previousArrears
      };
    });
    await writeCache(rentArrearsCacheKey(userId), records);
    return records;
  }

  if (!isMissingRelationError(error)) {
    handleError(error);
  }

  const [tenantResponse, paymentResponse] = await Promise.all([
    supabase
      .from('tenants')
      .select('id, user_id, unit_id, full_name, arrears, move_in_date, status, units!left(unit_number, rent_amount)')
      .eq('creator_id', userId),
    supabase
      .from('payments')
      .select('tenant_id, amount_paid')
      .eq('creator_id', userId)
  ]);

  const paymentMap = new Map<string, number>();
  (paymentResponse.data ?? []).forEach((row: any) => {
    paymentMap.set(row.tenant_id, (paymentMap.get(row.tenant_id) ?? 0) + Number(row.amount_paid ?? 0));
  });

  const records = (tenantResponse.data ?? []).map<RentArrearsRow>((row: any) => {
    const expectedRent = Number(row.units?.rent_amount ?? 0);
    const monthsStayed = monthsBetween(row.move_in_date);
    const totalExpectedRent = expectedRent * monthsStayed;
    const totalPaid = paymentMap.get(row.id) ?? 0;
    const arrearsValue = Number(row.arrears ?? 0);

    return {
      tenant_id: row.id,
      full_name: row.full_name ?? null,
      user_id: row.user_id ?? userId,
      unit_number: row.units?.unit_number ?? null,
      property_id: row.unit_id ?? null,
      expected_rent: expectedRent,
      months_stayed: monthsStayed,
      total_expected_rent: totalExpectedRent,
      total_paid: totalPaid,
      arrears: arrearsValue,
      status: arrearsValue <= 0 ? 'paid' : 'unpaid',
      previousArrears: arrearsValue
    };
  });

  await writeCache(rentArrearsCacheKey(userId), records);
  return records.sort((a, b) => b.arrears - a.arrears);
};
