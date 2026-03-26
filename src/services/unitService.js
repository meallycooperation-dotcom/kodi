import { supabase } from '../lib/supabaseClient';
const mapUnitRow = (row) => ({
    id: row.id,
    propertyId: row.property_id,
    unitNumber: row.unit_number,
    rentAmount: row.rent_amount,
    status: row.status,
    numberOfHouses: row.number_of_houses ?? undefined,
    userId: row.creator_id ?? undefined,
    createdAt: row.created_at
});
export const insertUnit = async (payload) => {
    const { data, error } = await supabase
        .from('units')
        .insert([
        {
            property_id: payload.propertyId ?? null,
            unit_number: payload.unitNumber,
            rent_amount: payload.rentAmount,
            status: payload.status,
            number_of_houses: payload.numberOfHouses ?? null,
            creator_id: payload.userId ?? null
        }
    ])
        .select('*')
        .single();
    if (error) {
        console.error('insertUnit', error);
        throw error;
    }
    return mapUnitRow(data);
};
export const fetchUnits = async (propertyId, status = 'vacant', ownerId) => {
    if (!ownerId) {
        return [];
    }
    const query = supabase.from('units').select('*');
    if (propertyId) {
        query.eq('property_id', propertyId);
    }
    if (status !== 'all') {
        query.eq('status', status);
    }
    if (ownerId) {
        query.eq('creator_id', ownerId);
    }
    const { data, error } = await query;
    if (error) {
        console.error('fetchUnits', error);
        throw error;
    }
    return (data ?? []).map((row) => mapUnitRow(row));
};
