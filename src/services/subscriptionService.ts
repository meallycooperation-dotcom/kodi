import { supabase } from '../lib/supabaseClient';

const PLAN_PRICE_MAP: Record<'basic' | 'standard' | 'premium', number> = {
  basic: 1499,
  standard: 10,
  premium: 4499
};

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

// Return a SubscriptionRow or null for a given user
export const fetchSubscriptionForUser = async (userId: string): Promise<SubscriptionRow | null> => {
  const { data, error } = await supabase
    .from('subscriptions')
    // Avoid strict generic typing issues across Supabase versions by using a plain select
    // and casting the final result to the known SubscriptionRow type.
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('fetchSubscriptionForUser', error);
    throw error;
  }

  // Cast to the expected shape (SubscriptionRow | null) for type safety
  return data as SubscriptionRow | null;
};

// The schema does not include a plans catalog table, so use the known plan pricing
// from the subscription flow instead of querying a missing table.
export const fetchPlanPrice = async (planName: 'basic' | 'standard' | 'premium'): Promise<number> => {
  return PLAN_PRICE_MAP[planName];
};
