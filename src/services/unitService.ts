import { supabase } from '../lib/supabaseClient';
import type { Unit } from '../types/unit';

type UnitRow = {
  id: string;
  property_id: string | null;
  unit_number: string;
  rent_amount: number;
  status: string;
  created_at: string;
  number_of_houses: number | null;
  creator_id: string | null;
};

const mapUnitRow = (row: UnitRow): Unit => ({
  id: row.id,
  propertyId: row.property_id,
  unitNumber: row.unit_number,
  rentAmount: row.rent_amount,
  status: row.status as Unit['status'],
  numberOfHouses: row.number_of_houses ?? undefined,
  userId: row.creator_id ?? undefined,
  createdAt: row.created_at
});

export const insertUnit = async (payload: {
  propertyId?: string;
  unitNumber: string;
  rentAmount: number;
  status: Unit['status'];
  numberOfHouses?: number;
  userId?: string;
}) => {
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

  return mapUnitRow(data as UnitRow);
};

export const fetchUnits = async (
  propertyId?: string,
  status: Unit['status'] | 'all' = 'vacant',
  ownerId?: string
) => {
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

  return (data ?? []).map((row) => mapUnitRow(row as UnitRow));
};

export const deleteUnit = async (id: string) => {
  const { error } = await supabase.from('units').delete().eq('id', id);
  if (error) {
    console.error('deleteUnit', error);
    throw error;
  }
};
