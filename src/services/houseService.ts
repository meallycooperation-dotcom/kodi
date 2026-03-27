import { supabase } from '../lib/supabaseClient';
import type { House } from '../types/house';

type HouseRow = {
  id: string;
  unit_id: string;
  house_number: string;
  status: string;
  created_at: string;
};

const mapHouseRow = (row: HouseRow): House => ({
  id: row.id,
  unitId: row.unit_id,
  houseNumber: row.house_number,
  status: row.status as House['status'],
  createdAt: row.created_at
});

export const fetchHouses = async (unitId: string): Promise<House[]> => {
  const { data, error } = await supabase
    .from('houses')
    .select('*')
    .eq('unit_id', unitId);
  if (error) {
    console.error('fetchHouses', error);
    throw error;
  }

  return (data ?? []).map((row) => mapHouseRow(row as HouseRow));
};

export const fetchAllHouses = async (userId: string): Promise<House[]> => {
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

  return (data ?? []).map((row) => mapHouseRow(row as HouseRow));
};

export const insertHouse = async (payload: {
  unitId: string;
  houseNumber: string;
  status?: House['status'];
}): Promise<House> => {
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

  return mapHouseRow(data as HouseRow);
};

export const updateHouse = async (id: string, payload: Partial<{
  houseNumber: string;
  status: House['status'];
}>): Promise<House> => {
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

  return mapHouseRow(data as HouseRow);
};
