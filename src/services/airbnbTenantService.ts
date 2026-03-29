import { supabase } from '../lib/supabaseClient';
import type { AirbnbTenant, AirbnbTenantStatus } from '../types/airbnbTenant';

type AirbnbTenantRow = {
  id: string;
  user_id: string | null;
  airbnb_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  check_in_at: string;
  check_out_at: string;
  total_amount: number | null;
  status: AirbnbTenantStatus;
  created_at: string;
  room_number: string | null;
};

const mapAirbnbTenantRow = (row: AirbnbTenantRow): AirbnbTenant => ({
  id: row.id,
  userId: row.user_id ?? undefined,
  airbnbId: row.airbnb_id,
  fullName: row.full_name,
  phone: row.phone ?? undefined,
  email: row.email ?? undefined,
  checkInAt: row.check_in_at,
  checkOutAt: row.check_out_at,
  totalAmount: row.total_amount ?? undefined,
  status: row.status,
  createdAt: row.created_at,
  roomNumber: row.room_number ?? undefined
});

const toDateOnly = (timestamp: string) => {
  if (!timestamp) {
    return null;
  }
  return timestamp.split('T')[0];
};

export const insertAirbnbTenant = async (payload: {
  userId: string;
  airbnbId: string;
  fullName: string;
  phone?: string;
  email?: string;
  checkInAt: string;
  checkOutAt: string;
  totalAmount?: number;
  status?: AirbnbTenantStatus;
  roomNumber?: string;
}) => {
  const { data, error } = await supabase
    .from('airbnbtenants')
    .insert([
      {
        user_id: payload.userId,
        airbnb_id: payload.airbnbId,
        full_name: payload.fullName,
        phone: payload.phone ?? null,
        email: payload.email ?? null,
        check_in_at: payload.checkInAt,
        check_out_at: payload.checkOutAt,
        check_in_date: toDateOnly(payload.checkInAt),
        check_out_date: toDateOnly(payload.checkOutAt),
        total_amount: payload.totalAmount ?? null,
        status: payload.status ?? 'booked',
        room_number: payload.roomNumber ?? null
      }
    ])
    .select('*')
    .single();

  if (error) {
    console.error('insertAirbnbTenant', error);
    throw error;
  }

  return mapAirbnbTenantRow(data as AirbnbTenantRow);
};

export const updateAirbnbTenantDates = async (tenantId: string, payload: { checkInAt: string; checkOutAt: string }) => {
  const { data, error } = await supabase
    .from('airbnbtenants')
    .update({
      check_in_at: payload.checkInAt,
      check_out_at: payload.checkOutAt,
      check_in_date: toDateOnly(payload.checkInAt),
      check_out_date: toDateOnly(payload.checkOutAt)
    })
    .eq('id', tenantId)
    .select('*')
    .single();

  if (error) {
    console.error('updateAirbnbTenantDates', error);
    throw error;
  }

  return mapAirbnbTenantRow(data as AirbnbTenantRow);
};

export const fetchAirbnbTenantsByListing = async (airbnbId: string) => {
  const { data, error } = await supabase
    .from('airbnbtenants')
    .select('*')
    .eq('airbnb_id', airbnbId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchAirbnbTenantsByListing', error);
    throw error;
  }

  return (data ?? []).map((row) => mapAirbnbTenantRow(row as AirbnbTenantRow));
};

export const fetchAirbnbTenantsByListingIds = async (airbnbIds: string[]) => {
  if (airbnbIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('airbnbtenants')
    .select('*')
    .in('airbnb_id', airbnbIds)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchAirbnbTenantsByListingIds', error);
    throw error;
  }

  return (data ?? []).map((row) => mapAirbnbTenantRow(row as AirbnbTenantRow));
};
