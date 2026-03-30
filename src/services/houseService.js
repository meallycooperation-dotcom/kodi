import { supabase } from '../lib/supabaseClient';
const mapHouseRow = (row) => ({
    id: row.id,
    unitId: row.unit_id,
    houseNumber: row.house_number,
    status: row.status,
    createdAt: row.created_at
});
export const fetchHouses = async (unitId) => {
    const { data, error } = await supabase
        .from('houses')
        .select('*')
        .eq('unit_id', unitId);
    if (error) {
        console.error('fetchHouses', error);
        throw error;
    }
    return (data ?? []).map((row) => mapHouseRow(row));
};
export const fetchAllHouses = async (userId) => {
    // First fetch unit IDs for the user
    const { data: units, error: unitsError } = await supabase
        .from('units')
        .select('id')
        .eq('creator_id', userId);
    if (unitsError) {
        console.error('fetchAllHouses - units', unitsError);
        throw unitsError;
    }
    const unitIds = (units ?? []).map((unit) => unit.id);
    if (unitIds.length === 0) {
        return [];
    }
    // Then fetch houses for those units
    const { data, error } = await supabase
        .from('houses')
        .select('*')
        .in('unit_id', unitIds);
    if (error) {
        console.error('fetchAllHouses - houses', error);
        throw error;
    }
    return (data ?? []).map((row) => mapHouseRow(row));
};
export const insertHouse = async (payload) => {
    const { data, error } = await supabase
        .from('houses')
        .insert([
        {
            unit_id: payload.unitId,
            house_number: payload.houseNumber,
            status: payload.status ?? 'vacant'
        }
    ])
        .select('*')
        .single();
    if (error) {
        console.error('insertHouse', error);
        throw error;
    }
    return mapHouseRow(data);
};
export const updateHouse = async (id, payload) => {
    const { data, error } = await supabase
        .from('houses')
        .update({
        house_number: payload.houseNumber,
        status: payload.status
    })
        .eq('id', id)
        .select('*')
        .single();
    if (error) {
        console.error('updateHouse', error);
        throw error;
    }
    return mapHouseRow(data);
};
