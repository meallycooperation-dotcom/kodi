import { supabase } from '../lib/supabaseClient';
const handleError = (error) => {
    if (error) {
        console.error(error);
        throw error;
    }
};
const mapTenantRow = (row) => ({
    id: row.id,
    userId: row.user_id,
    unitId: row.unit_id,
    fullName: row.full_name ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    moveInDate: row.move_in_date ?? undefined,
    status: row.status ?? 'active',
    createdAt: row.created_at
});
export const fetchTenants = async (userId) => {
    let query = supabase.from('tenants').select('*');
    if (userId) {
        query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    handleError(error);
    return (data ?? []).map(mapTenantRow);
};
export const insertTenant = async (payload) => {
    const { data, error } = await supabase
        .from('tenants')
        .insert([
        {
            user_id: payload.userId,
            unit_id: payload.unitId,
            full_name: payload.fullName,
            phone: payload.phone,
            email: payload.email,
            move_in_date: payload.moveInDate ?? null,
            status: payload.status
        }
    ])
        .select('*')
        .single();
    handleError(error);
    return mapTenantRow(data);
};
export const insertRentSetting = async (payload) => {
    const { data, error } = await supabase.from('rent_settings').insert([
        {
            user_id: payload.userId,
            rent_mode: payload.rentMode,
            default_rent: payload.defaultRent
        }
    ]);
    handleError(error);
    return data;
};
