import { supabase } from '../lib/supabaseClient';
import type { Tenant } from '../types/tenant';

export type NewTenantInput = Omit<Tenant, 'id' | 'createdAt'>;

export type RentSettingInput = {
  userId: string;
  rentMode: string;
  defaultRent: number;
};

const handleError = (error: Error | null) => {
  if (error) {
    console.error(error);
    throw error;
  }
};

type TenantRow = {
  id: string;
  user_id: string | null;
  unit_id: string | null;
  house_number: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  move_in_date: string | null;
  status: string;
  created_at: string;
};

const mapTenantRow = (row: TenantRow): Tenant => ({
  id: row.id,
  userId: row.user_id,
  unitId: row.unit_id,
  houseNumber: row.house_number ?? undefined,
  fullName: row.full_name ?? '',
  phone: row.phone ?? '',
  email: row.email ?? '',
  moveInDate: row.move_in_date ?? undefined,
  status: (row.status as Tenant['status']) ?? 'active',
  createdAt: row.created_at
});

export const fetchTenants = async (userId?: string) => {
  let query = supabase.from('tenants').select('*');
  if (userId) {
    query = query.eq('user_id', userId);
  }
  const { data, error } = await query;
  handleError(error);
  return (data ?? []).map(mapTenantRow);
};

export const insertTenant = async (payload: NewTenantInput) => {
  const { data, error } = await supabase
    .from('tenants')
    .insert([
      {
        user_id: payload.userId,
        unit_id: payload.unitId,
        house_number: payload.houseNumber ?? null,
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
  return mapTenantRow(data as TenantRow);
};

export const insertRentSetting = async (payload: RentSettingInput) => {
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
