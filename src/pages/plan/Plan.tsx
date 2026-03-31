import { useEffect, useMemo, useState } from 'react';
import Card from '../../components/ui/Card';
import useAuth from '../../hooks/useAuth';
import {
  createSubscription,
  fetchSubscriptionForUser,
  type SubscriptionRow
} from '../../services/subscriptionService';

type PlanTier = {
  id: 'basic' | 'standard' | 'premium';
  title: string;
  displayPrice: string;
  priceValue: number;
  maxApartments: number;
  maxAirbnbs: number;
  maxRentals: number;
  features: string[];
};

type StatusMessage = {
  type: 'success' | 'error';
  text: string;
};

const plans: PlanTier[] = [
  {
    id: 'basic',
    title: 'Basic Plan',
    displayPrice: 'Ksh 1,499/month',
    priceValue: 1499,
    maxApartments: 3,
    maxAirbnbs: 3,
    maxRentals: 3,
    features: [
      'Manage up to 3 apartments, 3 Airbnb listings, and 3 rental units',
      'Ideal for small landlords or first-time property managers',
      'Get started with simple, easy-to-use tools without the extra complexity'
    ]
  },
  {
    id: 'standard',
    title: 'Standard Plan',
    displayPrice: 'Ksh 2,999/month',
    priceValue: 2999,
    maxApartments: 6,
    maxAirbnbs: 6,
    maxRentals: 6,
    features: [
      'Manage up to 6 apartments, 6 Airbnb listings, and 6 rental units',
      'Perfect for growing landlords and small property management businesses',
      'Includes all Basic features with room to expand your portfolio'
    ]
  },
  {
    id: 'premium',
    title: 'Premium Plan',
    displayPrice: 'Ksh 4,499/month',
    priceValue: 4499,
    maxApartments: 9,
    maxAirbnbs: 9,
    maxRentals: 9,
    features: [
      'Manage up to 9 apartments, 9 Airbnb listings, and 9 rental units',
      'Designed for full-scale property management operations',
      'Unlock the full power of Kodi with maximum flexibility and control'
    ]
  }
];

const subscriptionDateFormatter = new Intl.DateTimeFormat('en-KE', {
  day: 'numeric',
  month: 'short',
  year: 'numeric'
});

const planTitleMap: Record<SubscriptionRow['plan_name'], string> = {
  basic: 'Basic Plan',
  standard: 'Standard Plan',
  premium: 'Premium Plan'
};

const Plan = () => {
  const { user } = useAuth();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  const handleChoosePlan = async (plan: PlanTier) => {
    if (!user?.id) {
      setStatusMessage({
        type: 'error',
        text: 'Please sign in before choosing a plan.'
      });
      return;
    }

    const confirmed = window.confirm(`Choose the ${plan.title} for ${plan.displayPrice}?`);
    if (!confirmed) {
      return;
    }

    setProcessingPlan(plan.id);
    setStatusMessage(null);

    const endsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const paymentReference = `plan-${plan.id}-${Date.now()}`;

    try {
      const createdSubscription = await createSubscription({
        userId: user.id,
        planName: plan.id,
        maxApartments: plan.maxApartments,
        maxAirbnbs: plan.maxAirbnbs,
        maxRentals: plan.maxRentals,
        amountPaid: plan.priceValue,
        paymentReference,
        paymentMethod: 'plan-page',
        endsAt,
        lastPaymentAt: new Date().toISOString()
      });

      setStatusMessage({
        type: 'success',
        text: `${plan.title} activated. Your subscription runs through ${new Date(endsAt).toLocaleDateString()}.`
      });
      setSubscription(createdSubscription);
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: 'Unable to save the subscription. Please try again later.'
      });
    } finally {
      setProcessingPlan(null);
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setSubscription(null);
      return;
    }

    setSubscriptionError(null);
    setSubscriptionLoading(true);
    fetchSubscriptionForUser(user.id)
      .then((data) => setSubscription(data ?? null))
      .catch(() => {
        setSubscriptionError('Unable to load subscription details.');
      })
      .finally(() => setSubscriptionLoading(false));
  }, [user?.id]);

  const subscriptionMeter = useMemo(() => {
    if (!subscription?.created_at || !subscription?.ends_at) {
      return null;
    }

    const created = new Date(subscription.created_at);
    const ends = new Date(subscription.ends_at);
    if (!Number.isFinite(created.getTime()) || !Number.isFinite(ends.getTime())) {
      return null;
    }

    const now = new Date();
    const totalMs = Math.max(1, ends.getTime() - created.getTime());
    const elapsedMs = Math.max(0, Math.min(now.getTime(), ends.getTime()) - created.getTime());
    const progress = Math.min(100, Math.round((elapsedMs / totalMs) * 100));
    const daysRemaining = Math.max(0, Math.ceil((ends.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return { ends, progress, daysRemaining };
  }, [subscription]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <h1>Plan</h1>
        <p className="text-sm text-gray-500">Choose the tier that matches the size of your property business.</p>
      </div>
      {statusMessage && (
        <p
          className={`text-sm ${
            statusMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {statusMessage.text}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const hasSubscription = Boolean(subscription);
          const buttonLabel =
            processingPlan === plan.id
              ? 'Saving…'
              : hasSubscription
              ? 'Subscription active'
              : 'Choose plan';
          return (
            <Card key={plan.id} className="space-y-4">
              <div>
                <p className="text-lg font-semibold">{plan.title}</p>
                <p className="text-sm text-blue-600">{plan.displayPrice}</p>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => handleChoosePlan(plan)}
                disabled={processingPlan === plan.id || hasSubscription}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {buttonLabel}
              </button>
            </Card>
          );
        })}
      </div>

      {subscriptionError && (
        <p className="text-sm text-red-600">{subscriptionError}</p>
      )}

      {subscription ? (
        <Card className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your current plan</h2>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {subscription.status}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            <p>
              <strong className="text-gray-900">{planTitleMap[subscription.plan_name]}</strong> (
              {subscription.plan_name})
            </p>
            <p>
              Active until{' '}
              {subscriptionMeter
                ? subscriptionDateFormatter.format(subscriptionMeter.ends)
                : subscriptionDateFormatter.format(new Date(subscription.ends_at))}
            </p>
          </div>
          {subscriptionMeter && (
            <div className="space-y-1">
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-200"
                  style={{ width: `${subscriptionMeter.progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">
                {subscriptionMeter.daysRemaining} day
                {subscriptionMeter.daysRemaining === 1 ? '' : 's'} remaining
              </p>
            </div>
          )}
          <div className="grid gap-2 text-sm text-gray-500">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Max apartments</p>
              <p>{subscription.max_apartments}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Max Airbnbs</p>
              <p>{subscription.max_airbnbs}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Max rentals</p>
              <p>{subscription.max_rentals}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Amount paid</p>
              <p>Ksh {subscription.amount_paid.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Payment method</p>
              <p>{subscription.payment_method ?? '—'}</p>
            </div>
          </div>
        </Card>
      ) : (
        !subscriptionLoading && (
          <p className="text-sm text-gray-500">You have not subscribed yet.</p>
        )
      )}
    </section>
  );
};

export default Plan;
