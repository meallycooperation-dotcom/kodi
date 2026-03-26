import { supabase } from '../lib/supabaseClient';
const handleError = (error) => {
    if (error) {
        console.error(error);
        throw error;
    }
};
const mapPaymentRow = (row) => ({
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
export const insertPayment = async (payload) => {
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
    return mapPaymentRow(data);
};
const mapPaymentWithTenantRow = (row) => ({
    ...mapPaymentRow(row),
    tenantName: row.tenants?.full_name ?? undefined
});
export const fetchPayments = async (creatorId, limit = 10) => {
    let query = supabase
        .from('payments')
        .select('*, tenants!inner(full_name)')
        .order('payment_date', { ascending: false })
        .limit(limit);
    if (creatorId) {
        query = query.eq('creator_id', creatorId);
    }
    const { data, error } = await query;
    handleError(error);
    return (data ?? []).map((row) => mapPaymentWithTenantRow(row));
};
