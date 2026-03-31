import { supabase } from '../lib/supabaseClient';

export type NewSubscriptionPayload = {
  userId: string;
  planName: 'basic' | 'standard' | 'premium';
  maxApartments: number;
  maxAirbnbs: number;
  maxRentals: number;
  amountPaid: number;
  paymentReference: string;
  paymentMethod: string;
  endsAt: string;
  lastPaymentAt: string;
};

export const createSubscription = async (payload: NewSubscriptionPayload) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert([
      {
        user_id: payload.userId,
        plan_name: payload.planName,
        max_apartments: payload.maxApartments,
        max_airbnbs: payload.maxAirbnbs,
        max_rentals: payload.maxRentals,
        amount_paid: payload.amountPaid,
        payment_reference: payload.paymentReference,
        payment_method: payload.paymentMethod,
        ends_at: payload.endsAt,
        last_payment_at: payload.lastPaymentAt
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('createSubscription', error);
    throw error;
  }

  return data as SubscriptionRow;
};

export type SubscriptionRow = {
  id: string;
  user_id: string;
  plan_name: 'basic' | 'standard' | 'premium';
  max_apartments: number;
  max_airbnbs: number;
  max_rentals: number;
  amount_paid: number;
  payment_reference: string;
  payment_method: string | null;
  status: string;
  created_at: string;
  ends_at: string;
  last_payment_at: string | null;
};

export const fetchSubscriptionForUser = async (userId: string) => {
  const { data, error } = await supabase
    .from<SubscriptionRow>('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('fetchSubscriptionForUser', error);
    throw error;
  }

  return data;
};
