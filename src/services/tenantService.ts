import { supabase } from '../lib/supabaseClient';
import { buildCacheKey, readCache, writeCache } from '../lib/appCache';
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
  arrears: number | null;
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
  arrears: row.arrears ?? 0,
  createdAt: row.created_at
});

type ApartmentTenantRow = {
  id: string;
  user_id: string | null;
  house_id: string;
  full_name: string | null;
  phone_number: string | null;
  move_in_date: string | null;
  created_at: string;
  houses: {
    house_number: string | null;
  } | null;
};

const mapApartmentTenantRow = (row: ApartmentTenantRow): Tenant => ({
  id: row.id,
  userId: row.user_id,
  unitId: null,
  houseNumber: row.houses?.house_number ?? undefined,
  fullName: row.full_name ?? '',
  phone: row.phone_number ?? '',
  email: '',
  moveInDate: row.move_in_date ?? undefined,
  status: 'active',
  createdAt: row.created_at
});

const tenantCacheKey = (userId?: string) => buildCacheKey('tenants', userId ?? 'all');
const apartmentTenantCacheKey = (userId?: string) => buildCacheKey('apartment-tenants', userId ?? 'all');

export const getCachedTenants = async (userId?: string) => readCache<Tenant[]>(tenantCacheKey(userId), []);

export const getCachedApartmentTenants = async (userId?: string) =>
  readCache<Tenant[]>(apartmentTenantCacheKey(userId), []);

export const fetchTenants = async (userId?: string) => {
  let query = supabase.from('tenants').select('*').eq('status', 'active');
  if (userId) {
    query = query.eq('user_id', userId);
  }
  const { data, error } = await query;
  handleError(error);
  const tenants = (data ?? []).map(mapTenantRow);
  await writeCache(tenantCacheKey(userId), tenants);
  return tenants;
};

export const fetchApartmentTenants = async (userId?: string) => {
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from('apartment_tenants')
    .select('*, houses!inner(house_number)')
    .eq('status', 'active')
    .eq('user_id', userId);

  handleError(error);
  const tenants = (data ?? []).map(mapApartmentTenantRow);
  await writeCache(apartmentTenantCacheKey(userId), tenants);
  return tenants;
};

export const insertTenant = async (payload: NewTenantInput) => {
  const { data, error } = await supabase
    .from('tenants')
    .insert([
      {
        user_id: payload.userId,
        creator_id: payload.userId,
        unit_id: payload.unitId,
        house_number: payload.houseNumber ?? null,
        full_name: payload.fullName,
        phone: payload.phone,
        email: payload.email,
        move_in_date: payload.moveInDate ?? null,
        arrears: payload.arrears ?? 0,
        status: payload.status
      }
    ])
    .select('*')
    .single();
  handleError(error);
  return mapTenantRow(data as TenantRow);
};

export const deleteTenant = async (tenantId: string) => {
  const { error } = await supabase
    .from('tenants')
    .update({ status: 'inactive' })
    .eq('id', tenantId);

  handleError(error);
};

export const deactivateApartmentTenant = async (tenantId: string) => {
  const { error } = await supabase
    .from('apartment_tenants')
    .update({ status: 'inactive' })
    .eq('id', tenantId);

  handleError(error);
};

export const insertRentSetting = async (payload: RentSettingInput) => {
  const { data, error } = await supabase
    .from('rent_settings')
    .upsert(
      {
        user_id: payload.userId,
        rent_mode: payload.rentMode,
        default_rent: payload.defaultRent
      },
      { onConflict: 'user_id' }
    )
    .select('*')
    .single();
  handleError(error);
  return data;
};
