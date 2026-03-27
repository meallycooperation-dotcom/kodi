import { supabase } from '../lib/supabaseClient';
import type { Payment } from '../types/payment';

export type NewPaymentInput = Omit<Payment, 'id' | 'createdAt' | 'tenantName'>;

const handleError = (error: Error | null) => {
  if (error) {
    console.error(error);
    throw error;
  }
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
  monthPaidFor: row.month_paid_for,
  paymentMethod: row.payment_method ?? undefined,
  reference: row.reference ?? undefined,
  createdAt: row.created_at
});

export const insertPayment = async (payload: NewPaymentInput) => {
  const { data, error } = await supabase
    .from('payments')
    .insert([
      {
        tenant_id: payload.tenantId,
        unit_id: payload.unitId,
        amount_paid: payload.amountPaid,
        payment_date: payload.paymentDate,
        month_paid_for: payload.monthPaidFor,
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

export const fetchPayments = async (creatorId?: string, limit?: number) => {
  let query = supabase
    .from('payments')
    .select('*, tenants!inner(full_name)')
    .order('payment_date', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  if (creatorId) {
    query = query.eq('creator_id', creatorId);
  }

  const { data, error } = await query;
  handleError(error);
  return (data ?? []).map((row) => mapPaymentWithTenantRow(row as PaymentWithTenantRow));
};

export const paymentExistsForMonth = async (tenantId: string, monthPaidFor: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('payments')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('month_paid_for', monthPaidFor)
    .limit(1);

  handleError(error);
  return (data ?? []).length > 0;
};
