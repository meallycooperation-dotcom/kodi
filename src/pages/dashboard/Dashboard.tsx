import { useMemo, useState, useCallback, useEffect } from 'react';
import Card from '../../components/ui/Card';
import KPIStats from '../../components/analytics/KPIStats';
import OccupancyChart from '../../components/analytics/OccupancyChart';
import RevenueChart from '../../components/analytics/RevenueChart';
import D3ComparisonChart from '../../components/analytics/D3ComparisonChart';
import Calendar from '../../components/ui/Calendar';
import useAuth from '../../hooks/useAuth';
import useArrears from '../../hooks/useArrears';
import useDashboardSummary from '../../hooks/useDashboardSummary';
import useMonthlyRevenue from '../../hooks/useMonthlyRevenue';
import useNotifications from '../../hooks/useNotifications';
import usePayments from '../../hooks/usePayments';
import useReminders from '../../hooks/useReminders';
import useTenants from '../../hooks/useTenants';
import useUnits from '../../hooks/useUnits';
import useApartmentTenantTracker from '../../hooks/useApartmentTenantTracker';
import { useCurrency } from '../../context/currency';
import { fetchAirbnbListingsByCreator } from '../../services/airbnbService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { fetchAirbnbTenantsByListingIds } from '../../services/airbnbTenantService';
import {
  fetchApartmentPaidView,
  getCachedApartmentPaidView,
  type ApartmentPaidViewRecord
} from '../../services/paymentService';
import type { AirbnbTenant } from '../../types/airbnbTenant';
import { fetchSubscriptionForUser, fetchPlanPrice, type SubscriptionRow } from '../../services/subscriptionService';
import type { Tenant } from '../../types/tenant';

const isUnitTenant = (tenant: Tenant | AirbnbTenant): tenant is Tenant =>
  'unitId' in tenant && tenant.unitId != null;

const Dashboard = () => {
  const { formatCurrency } = useCurrency();
  const { user, loading: authLoading } = useAuth();
  const { tenants } = useTenants();
  const { units } = useUnits('all', user?.id);
  const { payments, totalCollected, loading: paymentsLoading } = usePayments();
  const { arrears, totalDue, totalExpectedRent, totalPaid } = useArrears();
  const { reminders } = useReminders();
  const { notifications } = useNotifications();
  const { summary, loading: summaryLoading } = useDashboardSummary();
  const { months } = useMonthlyRevenue();
  const { totalTenants: apartmentTenantTotal, loading: apartmentTenantLoading } = useApartmentTenantTracker();
  const paymentDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en-KE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
    []
  );
  const [apartmentPaidRecords, setApartmentPaidRecords] = useState<ApartmentPaidViewRecord[]>([]);
  const [apartmentPaidLoading, setApartmentPaidLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [expiryModalOpen, setExpiryModalOpen] = useState(false);
  const [prevSubscriptionStatus, setPrevSubscriptionStatus] = useState<string | null>(null);
  const [planPrices, setPlanPrices] = useState<Record<string, number>>({});
  const [initializingPayment, setInitializingPayment] = useState(false);
  const [initStatus, setInitStatus] = useState<string | null>(null);
  const planTitles: Record<'basic'|'standard'|'premium', string> = {
    basic: 'Basic Plan',
    standard: 'Standard Plan',
    premium: 'Premium Plan'
  };
  // Pricing: dynamic price from Plans catalog with a safe static fallback
  const staticPlanPrices: Record<'basic'|'standard'|'premium', number> = {
    basic: 1499,
    standard: 10,
    premium: 4499
  };
  // planPrices are loaded dynamically from fetchPlanPrice and stored in state planPrices
  const amountMap: Record<'basic'|'standard'|'premium', number> = {
    basic: 1499,
    standard: 10,
    premium: 4499
  };

  // Base URL for API requests (production should set VITE_API_BASE_URL)
  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://kodiserver-production.up.railway.app';

  const handleInitializePayment = async (plan: 'basic'|'standard'|'premium') => {
    const amount = amountMap[plan];
    try {
      const res = await fetch(`${API_BASE}/api/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: user?.email, amount, user_id: user?.id, plan })
      });
      const data = await res.json();
      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch (err) {
      console.error('initialize payment error', err);
    }
  };
  // Single handleInitializePayment(plan) remains (defined above) and used by onClick

  const [selectedUnitId, setSelectedUnitId] = useState<string | 'all' | 'airbnb'>('all');
  const [airbnbTenants, setAirbnbTenants] = useState<AirbnbTenant[]>([]);
  const [loadingAirbnbData, setLoadingAirbnbData] = useState(false);
  const loadAirbnbData = useCallback(async () => {
    if (!user?.id) {
      setAirbnbTenants([]);
      return;
    }

    setLoadingAirbnbData(true);
    try {
      const listings = await fetchAirbnbListingsByCreator(user.id);
      const tenants = listings.length
        ? await fetchAirbnbTenantsByListingIds(listings.map((listing) => listing.id))
        : [];
      setAirbnbTenants(tenants);
    } catch (error) {
      console.error('loadAirbnbDashboard', error);
    } finally {
      setLoadingAirbnbData(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadAirbnbData();
  }, [loadAirbnbData]);

  // Poll for subscription status changes to trigger expiry modal
  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;
    const fetchInitial = async () => {
      try {
        const sub = await fetchSubscriptionForUser(user.id);
        if (mounted) {
          setSubscription(sub ?? null);
          setPrevSubscriptionStatus(sub?.status ?? null);
          if (sub?.status === 'expired') {
            setExpiryModalOpen(true);
          }
  // Fetch price for the current plan; fallback to static price if needed
  if (sub?.plan_name) {
            try {
              const price = await fetchPlanPrice(sub.plan_name);
              setPlanPrices((p) => ({ ...p, [sub.plan_name!]: price }));
            } catch {
              setPlanPrices((p) => ({ ...p, [sub.plan_name!]: staticPlanPrices[sub.plan_name!] }));
            }
          }
        }
      } catch {
        // ignore
      }
    };
    fetchInitial();

    const interval = setInterval(async () => {
      try {
        const sub = await fetchSubscriptionForUser(user.id);
        if (!mounted) return;
        if (sub) {
          const currentStatus = sub.status ?? '';
          if (prevSubscriptionStatus && prevSubscriptionStatus !== currentStatus && currentStatus === 'expired') {
            setExpiryModalOpen(true);
          }
          setPrevSubscriptionStatus(currentStatus);
          setSubscription(sub);
        } else {
          setSubscription(null);
          setPrevSubscriptionStatus(null);
        }
      } catch {
        // ignore
      }
    }, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user?.id, prevSubscriptionStatus]);

  useEffect(() => {
    let mounted = true;

    const loadApartmentPaid = async () => {
      if (!user?.id) {
        if (mounted) {
          setApartmentPaidRecords([]);
        }
        return;
      }

      setApartmentPaidLoading(true);
      try {
        const cached = await getCachedApartmentPaidView(user.id);
        if (mounted) {
          setApartmentPaidRecords(cached);
        }
      } catch (error) {
        console.error('loadApartmentPaidView cache error', error);
      }

      try {
        const records = await fetchApartmentPaidView(user.id);
        if (mounted) {
          setApartmentPaidRecords(records);
        }
      } catch (error) {
        console.error('loadApartmentPaidView error', error);
      } finally {
        if (mounted) {
          setApartmentPaidLoading(false);
        }
      }
    };

    loadApartmentPaid();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  // Access control: handle expired subscription via UI modal only (no automatic redirect)
  // Previously redirected to payments; now we rely on the modal and existing flows.

  const filteredTenants = useMemo(() => {
    if (selectedUnitId === 'all') {
      return tenants;
    }

    if (selectedUnitId === 'airbnb') {
      return airbnbTenants;
    }

    return tenants.filter((tenant) => tenant.unitId === selectedUnitId);
  }, [tenants, airbnbTenants, selectedUnitId]);

  const filteredUnitTenants = useMemo(
    () => filteredTenants.filter((tenant) => isUnitTenant(tenant)),
    [filteredTenants]
  );

  const filteredPayments = useMemo(
    () =>
      selectedUnitId === 'all'
        ? payments
        : selectedUnitId === 'airbnb'
        ? []
        : payments.filter((payment) => payment.unitId === selectedUnitId),
    [payments, selectedUnitId]
  );

  const filteredArrears = useMemo(
    () =>
      selectedUnitId === 'all'
        ? arrears
        : selectedUnitId === 'airbnb'
        ? []
        : arrears.filter((arrear) => arrear.unitId && arrear.unitId === selectedUnitId),
    [arrears, selectedUnitId]
  );

  const tenantCountsByUnit = useMemo(() => {
    const map = new Map<string, number>();
    filteredUnitTenants.forEach((tenant) => {
      const unitId = tenant.unitId;
      if (!unitId) {
        return;
      }
      const isActiveTenant = tenant.status === 'active' || tenant.status === 'late';
      if (!isActiveTenant) {
        return;
      }
      map.set(unitId, (map.get(unitId) ?? 0) + 1);
    });
    return map;
  }, [filteredUnitTenants]);

  const totalOverdues = filteredArrears.length;
  const filteredTotalCollected = useMemo(() => {
    return filteredPayments.reduce((sum, payment) => sum + payment.amountPaid, 0);
  }, [filteredPayments]);
  const filteredTotalArrears = useMemo(() => {
    return filteredArrears.reduce((sum, arrear) => sum + arrear.amountDue, 0);
  }, [filteredArrears]);
  const filteredTenantsPaid = useMemo(() => {
    const paid = new Set<string>();
    filteredPayments.forEach((payment) => {
      paid.add(payment.tenantId);
    });
    return paid.size;
  }, [filteredPayments]);

  const airbnbEarnings = useMemo(
    () => airbnbTenants.reduce((sum, tenant) => sum + (tenant.totalAmount ?? 0), 0),
    [airbnbTenants]
  );
  const airbnbEarningsDisplay = loadingAirbnbData ? 'Loading...' : formatCurrency(airbnbEarnings);

  const totalCollectedValue = filteredTotalCollected;
  const totalArrearsValue = filteredTotalArrears;
  const isLoading = authLoading || paymentsLoading || summaryLoading;
  const trackedTenants = useMemo(() => {
    if (selectedUnitId === 'airbnb') {
      return filteredTenants.filter((t) => t.status === 'checked_in').length;
    }
    return filteredTenants.filter((t) => t.status === 'active' || t.status === 'late').length;
  }, [filteredTenants, selectedUnitId]);
  const latestMonth = months[0]?.month;
  const apartmentEarningsValue = apartmentPaidRecords.reduce((sum, record) => sum + record.amountPaid, 0);
  const apartmentEarningsDisplay = apartmentPaidLoading ? 'Loading...' : formatCurrency(apartmentEarningsValue);
  const apartmentTenantCount = apartmentTenantTotal;
  const summaryStats = [
    { label: 'Tracked tenants', value: `${trackedTenants}` },
    { label: 'Apartment earnings', value: apartmentEarningsDisplay },
    { label: 'Apartment tenants', value: `${apartmentTenantCount}` },
    { label: 'Rent collected', value: formatCurrency(totalCollectedValue) },
    { label: 'Outstanding arrears', value: formatCurrency(totalArrearsValue) },
    { label: 'Airbnb earnings', value: airbnbEarningsDisplay },
    { label: 'Tenants paid', value: `${filteredTenantsPaid}` },
    { label: 'Overdues', value: `${totalOverdues}` },
    { label: 'Reminders', value: `${reminders.length}` },
    { label: 'Notifications', value: `${notifications.length}` }
  ];
  
  const displayUnits =
    selectedUnitId === 'all'
      ? units
      : selectedUnitId === 'airbnb'
      ? []
      : units.filter((u) => u.id === selectedUnitId);
  
  const { occupiedHouses, totalHouses } = useMemo(() => {
    let occupied = 0;
    let total = 0;
    displayUnits.forEach((unit) => {
      const houses = unit.numberOfHouses ?? 1;
      total += houses;
      occupied += Math.min(tenantCountsByUnit.get(unit.id) ?? 0, houses);
    });
    return { occupiedHouses: occupied, totalHouses: total };
  }, [tenantCountsByUnit, displayUnits]);

  const occupancyRate = totalHouses
    ? `${Math.round((occupiedHouses / totalHouses) * 100)}%`
    : '0%';

  const metricsReady =
    !paymentsLoading && !summaryLoading && !apartmentPaidLoading && !apartmentTenantLoading;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="sr-only">Dashboard</h1>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span
                className="h-5 w-5 animate-spin rounded-full border-4 border-solid border-transparent border-t-blue-500"
                aria-hidden="true"
              />
              <span>Loading dashboard data…</span>
            </div>
          ) : (
            <span className="sr-only text-sm text-gray-500">Dashboard data loaded</span>
          )}
        </div>
        <label className="input-field">
          <span>Filter by Units</span>
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value as string | 'all' | 'airbnb')}
            className="w-full md:w-48 p-2 border rounded-lg"
          >
            <option value="all">All Units</option>
            <option value="airbnb">Airbnb listings</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                Unit {unit.unitNumber}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Card title="Financial snapshot" className="space-y-0">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="snapshot-panel">
            <p className="text-sm text-gray-500">Total Rent Due</p>
            <p className="text-2xl font-semibold">{formatCurrency(totalExpectedRent)}</p>
            <p className="text-xs text-gray-400">All tenants, all time</p>
          </div>
          <div className="snapshot-panel">
            <p className="text-sm text-gray-500">Total Paid</p>
            <p className="text-2xl font-semibold">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-gray-400">Cumulative payments</p>
          </div>
          <div className="snapshot-panel">
            <p className="text-sm text-gray-500">Outstanding Balance</p>
            <p className="text-2xl font-semibold">{formatCurrency(totalDue)}</p>
            <p className="text-xs text-gray-400">Current arrears</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Calendar">
          <Calendar />
        </Card>
        <div className="space-y-4">
          <Card title="Totals">
            <KPIStats stats={summaryStats} loading={!metricsReady} />
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Recent paid tenants">
          <ul className="space-y-3">
            {filteredPayments.slice(0, 3).map((payment) => (
              <li key={payment.id}>
                <strong>{payment.tenantName ?? payment.tenantId}</strong> · {formatCurrency(payment.amountPaid)} ·{' '}
                {payment.monthPaidFor}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Analytics (collected vs overdue)" className="xl:col-span-2">
          <div className="space-y-4">
            <RevenueChart summary={`Collected ${formatCurrency(totalCollectedValue)}`} />
            <OccupancyChart summary={`${occupancyRate} occupancy`} />
            <D3ComparisonChart
              data={[
                { label: 'Collected', value: totalCollectedValue },
                { label: 'Overdue', value: totalArrearsValue }
              ]}
            />
            {months[0] && (
              <p className="text-sm text-gray-500">
                Latest month: {months[0].month} – collected {formatCurrency(months[0].collected_revenue)} vs overdue{' '}
                {formatCurrency(months[0].total_arrears)}
              </p>
            )}
          </div>
        </Card>
      </div>

      {expiryModalOpen && (
        <Modal title="Subscription expired">
          <p className="text-sm text-gray-600">Your subscription has expired. Please renew to continue.</p>
          <div className="mt-2 text-sm text-gray-600">
            {subscription ? (
              <>
                Current plan: <strong>{planTitles[subscription.plan_name as keyof typeof planTitles]}</strong>
                {subscription.ends_at ? <> • Ends: {new Date(subscription.ends_at).toLocaleDateString()}</> : null}
                {typeof planPrices[subscription.plan_name as keyof typeof planPrices] === 'number' ? (
                  <> • Price: {formatCurrency(planPrices[subscription.plan_name as keyof typeof planPrices]!)} / month</>
                ) : (
                  <> • Price: -</>
                )}
              </>
            ) : (
              <>Loading subscription details…</>
            )}
          </div>
  <div className="mt-4">
    <Button onClick={() => subscription?.plan_name ? handleInitializePayment(subscription.plan_name as 'basic'|'standard'|'premium') : null} disabled={initializingPayment}>
      {initializingPayment ? 'Initializing…' : 'Proceed to payment'}
    </Button>
  </div>
        </Modal>
      )}
    </section>
  );
};

export default Dashboard;
