import { supabase } from '../lib/supabaseClient';
import type { Payment } from '../types/payment';

export type NewPaymentInput = Omit<Payment, 'id' | 'createdAt' | 'tenantName'>;

const handleError = (error: Error | null) => {
  if (error) {
    console.error(error);
    throw error;
  }
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
  return (data ?? []).map((row) => mapPaymentWithTenantRow(row as PaymentWithTenantRow));
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
  return (data ?? []).map((row) => mapApartmentPaymentRow(row as ApartmentPaymentRow));
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

  handleError(error);
  return (data ?? []).map<ApartmentPaidViewRecord>((row) => ({
    tenantId: row.tenant_id,
    tenantName: row.full_name ?? undefined,
    houseNumber: row.house_number ?? undefined,
    blockName: row.block_name ?? undefined,
    apartmentName: row.apartment_name ?? undefined,
    amountPaid: Number(row.total_paid ?? 0),
    month: row.month ?? undefined,
    phoneNumber: row.phone_number ?? undefined
  }));
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

  handleError(viewResponse.error);
  handleError(tenantResponse.error);

  const tenantArrearsMap = new Map(
    (tenantResponse.data ?? []).map((tenantRow: ApartmentTenantArrearsRow) => [
      tenantRow.id,
      Number(tenantRow.arrears ?? 0)
    ])
  );

  return (viewResponse.data ?? []).map<ApartmentArrearsViewRecord>((row) => {
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
};
