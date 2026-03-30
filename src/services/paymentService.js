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
const mapApartmentPaymentRow = (row) => ({
    id: row.id,
    tenantId: row.tenant_id ?? '',
    unitId: row.apartment_id,
    amountPaid: row.amount_paid,
    paymentDate: row.payment_date,
    monthPaidFor: row.month_paid_for,
    paymentMethod: row.payment_method ?? undefined,
    reference: row.reference ?? undefined,
    createdAt: row.created_at,
    tenantName: row.apartment_tenants?.full_name ?? undefined
});
export const fetchPayments = async (creatorId, limit) => {
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
    return (data ?? []).map((row) => mapPaymentWithTenantRow(row));
};
export const fetchApartmentPayments = async (creatorId, limit) => {
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
    return (data ?? []).map((row) => mapApartmentPaymentRow(row));
};
export const paymentExistsForMonth = async (tenantId, monthPaidFor) => {
    const { data, error } = await supabase
        .from('payments')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('month_paid_for', monthPaidFor)
        .limit(1);
    handleError(error);
    return (data ?? []).length > 0;
};
export const insertApartmentPayment = async (payload) => {
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
            month_paid_for: payload.monthPaidFor,
            payment_method: payload.paymentMethod ?? null,
            reference: payload.reference ?? null,
            status: payload.status ?? 'completed',
            notes: payload.notes ?? null
        }
    ])
        .select('*, apartment_tenants(full_name)')
        .single();
    handleError(error);
    return mapApartmentPaymentRow(data);
};
export const fetchApartmentPaidView = async () => {
    const { data, error } = await supabase
        .from('apartment_paid_view')
        .select('*')
        .order('payment_date', { ascending: false });
    handleError(error);
    return (data ?? []).map((row) => ({
        paymentId: row.payment_id,
        tenantId: row.tenant_id,
        tenantName: row.full_name ?? undefined,
        houseNumber: row.house_number ?? undefined,
        blockName: row.block_name ?? undefined,
        apartmentName: row.apartment_name ?? undefined,
        amountPaid: Number(row.amount_paid ?? 0),
        monthPaidFor: row.month_paid_for ?? undefined,
        paymentDate: row.payment_date ?? undefined,
        paymentMethod: row.payment_method ?? undefined,
        reference: row.reference ?? undefined,
        phoneNumber: row.phone_number ?? undefined
    }));
};
export const fetchApartmentArrearsView = async () => {
    const { data, error } = await supabase.from('apartment_arrears_view').select('*');
    handleError(error);
    return (data ?? []).map((row) => ({
        tenantId: row.tenant_id,
        tenantName: row.full_name,
        phoneNumber: row.phone_number ?? undefined,
        houseId: row.house_id,
        houseNumber: row.house_number,
        rentAmount: Number(row.rent_amount ?? 0),
        blockName: row.block_name,
        apartmentName: row.apartment_name,
        currentMonth: row.current_month,
        totalPaid: Number(row.total_paid ?? 0),
        balance: Number(row.balance ?? 0)
    }));
};
