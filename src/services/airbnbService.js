import { supabase } from '../lib/supabaseClient';
const mapAirbnbRow = (row) => ({
    id: row.id,
    unitName: row.unit_name,
    location: row.location ?? undefined,
    pricePerNight: Number(row.price_per_night),
    status: row.status,
    creatorId: row.creator_id ?? undefined,
    createdAt: row.created_at,
    roomNumbers: row.room_numbers ?? undefined
});
export const insertAirbnbListing = async (payload) => {
    const { data, error } = await supabase
        .from('airbnb')
        .insert([
        {
            unit_name: payload.unitName,
            location: payload.location ?? null,
            price_per_night: payload.pricePerNight,
            status: payload.status ?? 'available',
            creator_id: payload.userId ?? null,
            room_numbers: payload.roomNumbers ?? null
        }
    ])
        .select('*')
        .single();
    if (error) {
        console.error('insertAirbnbListing', error);
        throw error;
    }
    return mapAirbnbRow(data);
};
export const fetchAirbnbListingsByCreator = async (creatorId) => {
    const { data, error } = await supabase
        .from('airbnb')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });
    if (error) {
        console.error('fetchAirbnbListingsByCreator', error);
        throw error;
    }
    return (data ?? []).map((row) => mapAirbnbRow(row));
};
