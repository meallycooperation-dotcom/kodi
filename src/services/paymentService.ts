import { supabase } from '../lib/supabaseClient';
import { buildCacheKey, readCache, writeCache } from '../lib/appCache';
import type { Payment } from '../types/payment';

export type NewPaymentInput = Omit<Payment, 'id' | 'createdAt' | 'tenantName'>;

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

const monthOnlyPattern = /^\d{4}-\d{2}$/;

const ensureFullMonthPaidForValue = (value: string) => (monthOnlyPattern.test(value) ? `${value}-01` : value);

const formatStoredMonthPaidFor = (value: string | null | undefined) => {
  if (!value) {
    return '';
  }
  return value.length >= 7 ? value.slice(0, 7) : value;
};

type PaymentRow = {
  id: string;
  tenant_id: string;
  unit_id: string;
  amount_paid: number;
  payment_date: string;
  month_paid_for: string;
  payment_method: string | null;
  reference: string | null;
  created_at: string;
};

const mapPaymentRow = (row: PaymentRow): Payment => ({
  id: row.id,
  tenantId: row.tenant_id,
  unitId: row.unit_id,
  amountPaid: row.amount_paid,
  paymentDate: row.payment_date,
  monthPaidFor: formatStoredMonthPaidFor(row.month_paid_for),
  paymentMethod: row.payment_method ?? undefined,
  reference: row.reference ?? undefined,
  createdAt: row.created_at
});

export const insertPayment = async (payload: NewPaymentInput) => {
  const monthPaidForForDb = ensureFullMonthPaidForValue(payload.monthPaidFor);
  const { data, error } = await supabase
    .from('payments')
    .insert([
      {
        tenant_id: payload.tenantId,
        unit_id: payload.unitId,
        amount_paid: payload.amountPaid,
        payment_date: payload.paymentDate,
        month_paid_for: monthPaidForForDb,
        payment_method: payload.paymentMethod ?? null,
        reference: payload.reference ?? null
      }
    ])
    .select('*')
    .single();
  handleError(error);
  return mapPaymentRow(data as PaymentRow);
};

type PaymentWithTenantRow = PaymentRow & {
  tenants: {
    full_name: string;
  };
};

const mapPaymentWithTenantRow = (row: PaymentWithTenantRow): Payment => ({
  ...mapPaymentRow(row),
  tenantName: row.tenants?.full_name ?? undefined
});

type ApartmentPaymentRow = {
  id: string;
  tenant_id: string | null;
  house_id: string | null;
  block_id: string | null;
  apartment_id: string;
  amount_paid: number;
  payment_date: string;
  month_paid_for: string;
  payment_method: string | null;
  reference: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  apartment_tenants: {
    full_name: string | null;
  } | null;
};

const mapApartmentPaymentRow = (row: ApartmentPaymentRow): Payment => ({
  id: row.id,
  tenantId: row.tenant_id ?? '',
  unitId: row.apartment_id,
  amountPaid: row.amount_paid,
  paymentDate: row.payment_date,
  monthPaidFor: formatStoredMonthPaidFor(row.month_paid_for),
  paymentMethod: row.payment_method ?? undefined,
  reference: row.reference ?? undefined,
  createdAt: row.created_at,
  tenantName: row.apartment_tenants?.full_name ?? undefined
});

const paymentsCacheKey = (creatorId?: string, limit?: number) =>
  buildCacheKey('payments', creatorId ?? 'all', limit ?? 'all');

const apartmentPaymentsCacheKey = (creatorId?: string, limit?: number) =>
  buildCacheKey('apartment-payments', creatorId ?? 'all', limit ?? 'all');

const apartmentPaidViewCacheKey = (userId?: string) => buildCacheKey('apartment-paid-view', userId ?? 'all');

const apartmentArrearsViewCacheKey = (tenantIds?: string[]) =>
  buildCacheKey('apartment-arrears-view', ...(tenantIds ?? []).slice().sort());

export const getCachedPayments = async (creatorId?: string, limit?: number) =>
  readCache<Payment[]>(paymentsCacheKey(creatorId, limit), []);

export const getCachedApartmentPayments = async (creatorId?: string, limit?: number) =>
  readCache<Payment[]>(apartmentPaymentsCacheKey(creatorId, limit), []);

export const getCachedApartmentPaidView = async (userId?: string) =>
  readCache<ApartmentPaidViewRecord[]>(apartmentPaidViewCacheKey(userId), []);

export const getCachedApartmentArrearsView = async (tenantIds?: string[]) =>
  readCache<ApartmentArrearsViewRecord[]>(apartmentArrearsViewCacheKey(tenantIds), []);

export const fetchPayments = async (creatorId?: string, limit?: number) => {
  const regularQuery = supabase
    .from('payments')
    .select('*, tenants!inner(full_name)')
    .order('payment_date', { ascending: false });

  if (limit) {
    regularQuery.limit(limit);
  }

  if (creatorId) {
    regularQuery.eq('creator_id', creatorId);
  }

  const { data, error } = await regularQuery;
  handleError(error);
  const payments = (data ?? []).map((row) => mapPaymentWithTenantRow(row as PaymentWithTenantRow));
  await writeCache(paymentsCacheKey(creatorId, limit), payments);
  return payments;
};

export const fetchApartmentPayments = async (creatorId?: string, limit?: number) => {
  const apartmentQuery = supabase
    .from('apartment_payments')
    .select('*, apartment_tenants!left(full_name)')
    .order('payment_date', { ascending: false });

  if (limit) {
    apartmentQuery.limit(limit);
  }

  if (creatorId) {
    apartmentQuery.eq('creator_id', creatorId);
  }

  const { data, error } = await apartmentQuery;
  handleError(error);
  const payments = (data ?? []).map((row) => mapApartmentPaymentRow(row as ApartmentPaymentRow));
  await writeCache(apartmentPaymentsCacheKey(creatorId, limit), payments);
  return payments;
};

export const paymentExistsForMonth = async (tenantId: string, monthPaidFor: string): Promise<boolean> => {
  const monthForDb = ensureFullMonthPaidForValue(monthPaidFor);
  const { data, error } = await supabase
    .from('payments')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('month_paid_for', monthForDb)
    .limit(1);

  handleError(error);
  return (data ?? []).length > 0;
};

export type ApartmentPaymentInput = {
  tenantId: string;
  houseId?: string | null;
  blockId?: string | null;
  apartmentId: string;
  amountPaid: number;
  paymentDate?: string;
  monthPaidFor: string;
  paymentMethod?: string;
  reference?: string;
  status?: string;
  notes?: string;
  creatorId?: string | null;
};

export const insertApartmentPayment = async (payload: ApartmentPaymentInput) => {
  const monthPaidForForDb = ensureFullMonthPaidForValue(payload.monthPaidFor);
  const { data, error } = await supabase
    .from('apartment_payments')
    .insert([
      {
        tenant_id: payload.tenantId,
        house_id: payload.houseId ?? null,
        block_id: payload.blockId ?? null,
        apartment_id: payload.apartmentId,
        amount_paid: payload.amountPaid,
        payment_date: payload.paymentDate ?? null,
        month_paid_for: monthPaidForForDb,
        creator_id: payload.creatorId ?? null,
        payment_method: payload.paymentMethod ?? null,
        reference: payload.reference ?? null,
        status: payload.status ?? 'completed',
        notes: payload.notes ?? null
      }
    ])
    .select('*, apartment_tenants(full_name)')
    .single();
  handleError(error);
  return mapApartmentPaymentRow(data as ApartmentPaymentRow);
};

export type ApartmentPaidViewRow = {
  tenant_id: string | null;
  full_name: string | null;
  phone_number: string | null;
  house_number: string | null;
  block_name: string | null;
  apartment_name: string | null;
  month: string | null;
  total_paid: number | null;
  user_id: string | null;
};

export type ApartmentPaidViewRecord = {
  tenantId: string | null;
  tenantName?: string;
  phoneNumber?: string;
  houseNumber?: string;
  blockName?: string;
  apartmentName?: string;
  amountPaid: number;
  month?: string;
};

export const fetchApartmentPaidView = async (userId?: string) => {
  let query = supabase
    .from('apartment_paid_view')
    .select('*')
    .order('month', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (!error) {
    const records = (data ?? []).map<ApartmentPaidViewRecord>((row) => ({
      tenantId: row.tenant_id,
      tenantName: row.full_name ?? undefined,
      houseNumber: row.house_number ?? undefined,
      blockName: row.block_name ?? undefined,
      apartmentName: row.apartment_name ?? undefined,
      amountPaid: Number(row.total_paid ?? 0),
      month: row.month ?? undefined,
      phoneNumber: row.phone_number ?? undefined
    }));
    await writeCache(apartmentPaidViewCacheKey(userId), records);
    return records;
  }

  if (!isMissingRelationError(error)) {
    handleError(error);
  }

  const [tenantResponse, paymentResponse] = await Promise.all([
    supabase
      .from('apartment_tenants')
      .select(
        'id, full_name, phone_number, house_id, houses!left(house_number, block_id, blocks!left(block_name, apartment_id, apartments!left(name)))'
      )
      .eq('user_id', userId ?? ''),
    supabase
      .from('apartment_payments')
      .select('tenant_id, amount_paid, payment_date, month_paid_for')
      .eq('creator_id', userId ?? '')
  ]);

  handleError(tenantResponse.error);
  handleError(paymentResponse.error);

  const tenantMap = new Map(
    (tenantResponse.data ?? []).map((row: any) => [
      row.id,
      {
        tenantName: row.full_name ?? undefined,
        phoneNumber: row.phone_number ?? undefined,
        houseNumber: row.houses?.house_number ?? undefined,
        blockName: row.houses?.blocks?.block_name ?? undefined,
        apartmentName: row.houses?.blocks?.apartments?.name ?? undefined
      }
    ])
  );

  const records = (paymentResponse.data ?? []).map<ApartmentPaidViewRecord>((row: any) => {
    const tenant = tenantMap.get(row.tenant_id) ?? {
      tenantName: undefined,
      phoneNumber: undefined,
      houseNumber: undefined,
      blockName: undefined,
      apartmentName: undefined
    };
    return {
      tenantId: row.tenant_id,
      tenantName: tenant.tenantName,
      phoneNumber: tenant.phoneNumber,
      houseNumber: tenant.houseNumber,
      blockName: tenant.blockName,
      apartmentName: tenant.apartmentName,
      amountPaid: Number(row.amount_paid ?? 0),
      month: row.month_paid_for ? String(row.month_paid_for).slice(0, 7) : undefined
    };
  });

  await writeCache(apartmentPaidViewCacheKey(userId), records);
  return records;
};

export type ApartmentArrearsViewRow = {
  user_id: string;
  tenant_id: string;
  full_name: string;
  phone_number: string | null;
  house_id: string;
  house_number: string;
  rent_amount: number | null;
  block_name: string;
  apartment_name: string;
  months_stayed: number | null;
  total_expected_rent: number | null;
  total_paid: number | null;
  balance: number | null;
};

export type ApartmentArrearsViewRecord = {
  userId: string;
  tenantId: string;
  tenantName: string;
  phoneNumber?: string;
  houseId: string;
  houseNumber: string;
  rentAmount: number;
  blockName: string;
  apartmentName: string;
  monthsStayed?: number;
  totalExpectedRent: number;
  totalPaid: number;
  balance: number;
  previousArrears: number;
  status: 'paid' | 'unpaid';
};

type ApartmentTenantArrearsRow = {
  id: string;
  arrears: number | null;
};

export const fetchApartmentArrearsView = async (tenantIds?: string[]) => {
  if (!tenantIds || tenantIds.length === 0) {
    return [];
  }

  const viewResponse = await supabase
    .from('apartment_arrears_view')
    .select(
      'user_id, tenant_id, full_name, phone_number, house_id, house_number, rent_amount, block_name, apartment_name, months_stayed, total_expected_rent, total_paid, balance'
    )
    .in('tenant_id', tenantIds);

  const tenantResponse = await supabase
    .from('apartment_tenants')
    .select('id, arrears')
    .in('id', tenantIds);

  if (!viewResponse.error && !tenantResponse.error) {
    const tenantArrearsMap = new Map(
      (tenantResponse.data ?? []).map((tenantRow: ApartmentTenantArrearsRow) => [
        tenantRow.id,
        Number(tenantRow.arrears ?? 0)
      ])
    );

    const records = (viewResponse.data ?? []).map<ApartmentArrearsViewRecord>((row) => {
      const baseBalance = Number(row.balance ?? 0);
      const previousArrears = tenantArrearsMap.get(row.tenant_id) ?? 0;
      const balance = baseBalance + previousArrears;
      return {
        userId: row.user_id,
        tenantId: row.tenant_id,
        tenantName: row.full_name,
        phoneNumber: row.phone_number ?? undefined,
        houseId: row.house_id,
        houseNumber: row.house_number,
        rentAmount: Number(row.rent_amount ?? 0),
        blockName: row.block_name,
        apartmentName: row.apartment_name,
        monthsStayed: Number(row.months_stayed ?? 0) || undefined,
        totalExpectedRent: Number(row.total_expected_rent ?? 0),
        totalPaid: Number(row.total_paid ?? 0),
        balance,
        previousArrears,
        status: balance <= 0 ? 'paid' : 'unpaid'
      };
    });
    await writeCache(apartmentArrearsViewCacheKey(tenantIds), records);
    return records;
  }

  if (!isMissingRelationError(viewResponse.error) && !isMissingRelationError(tenantResponse.error)) {
    handleError(viewResponse.error);
    handleError(tenantResponse.error);
  }

  const [tenantRowsResponse, paymentRowsResponse] = await Promise.all([
    supabase
      .from('apartment_tenants')
      .select(
        'id, user_id, house_id, full_name, phone_number, move_in_date, arrears, houses!left(house_number, rent_amount, block_id, blocks!left(block_name, price, apartment_id, apartments!left(name)))'
      )
      .in('id', tenantIds),
    supabase
      .from('apartment_payments')
      .select('tenant_id, amount_paid')
      .in('tenant_id', tenantIds)
  ]);

  handleError(tenantRowsResponse.error);
  handleError(paymentRowsResponse.error);

  const paymentMap = new Map<string, number>();
  (paymentRowsResponse.data ?? []).forEach((row: any) => {
    paymentMap.set(row.tenant_id, (paymentMap.get(row.tenant_id) ?? 0) + Number(row.amount_paid ?? 0));
  });

  const records = (tenantRowsResponse.data ?? []).map<ApartmentArrearsViewRecord>((row: any) => {
    const rentAmount = Number(row.houses?.rent_amount ?? row.houses?.blocks?.price ?? 0);
    const monthsStayed = monthsBetween(row.move_in_date);
    const totalExpectedRent = rentAmount * monthsStayed;
    const totalPaid = paymentMap.get(row.id) ?? 0;
    const previousArrears = Number(row.arrears ?? 0);
    const balance = Math.max(0, totalExpectedRent - totalPaid + previousArrears);

    return {
      userId: row.user_id,
      tenantId: row.id,
      tenantName: row.full_name ?? '',
      phoneNumber: row.phone_number ?? undefined,
      houseId: row.house_id,
      houseNumber: row.houses?.house_number ?? '',
      rentAmount,
      blockName: row.houses?.blocks?.block_name ?? '',
      apartmentName: row.houses?.blocks?.apartments?.name ?? '',
      monthsStayed,
      totalExpectedRent,
      totalPaid,
      balance,
      previousArrears,
      status: balance <= 0 ? 'paid' : 'unpaid'
    };
  });

  await writeCache(apartmentArrearsViewCacheKey(tenantIds), records);
  return records;
};
