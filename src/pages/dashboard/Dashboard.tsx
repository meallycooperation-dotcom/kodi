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
import { useCurrency } from '../../context/currency';
import { fetchAirbnbListingsByCreator } from '../../services/airbnbService';
import { fetchAirbnbTenantsByListingIds } from '../../services/airbnbTenantService';
import type { AirbnbTenant } from '../../types/airbnbTenant';
import type { Tenant } from '../../types/tenant';

const metricCards = [
  { label: 'Total collected', key: 'totalCollected' },
  { label: 'Tenants paid', key: 'tenantsPaid' },
  { label: 'Overdues', key: 'overdues' },
  { label: 'Balance', key: 'balance' },
  { label: 'Airbnb earnings', key: 'airbnbEarnings' },
  { label: 'Reminders', key: 'reminders' },
  { label: 'Notifications', key: 'notifications' }
];

const isUnitTenant = (tenant: Tenant | AirbnbTenant): tenant is Tenant =>
  'unitId' in tenant && tenant.unitId != null;

const Dashboard = () => {
  const { formatCurrency } = useCurrency();
  const { user, loading: authLoading } = useAuth();
  const { tenants } = useTenants();
  const { units } = useUnits('all', user?.id);
  const { payments, totalCollected, loading: paymentsLoading } = usePayments();
  const { arrears, totalDue } = useArrears();
  const { reminders } = useReminders();
  const { notifications } = useNotifications();
  const { summary, loading: summaryLoading } = useDashboardSummary();
  const { months } = useMonthlyRevenue();

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
  const balance = totalCollectedValue - totalArrearsValue;
  const trackedTenants = useMemo(() => {
    if (selectedUnitId === 'airbnb') {
      return filteredTenants.filter((t) => t.status === 'checked_in').length;
    }
    return filteredTenants.filter((t) => t.status === 'active' || t.status === 'late').length;
  }, [filteredTenants, selectedUnitId]);
  const latestMonth = months[0]?.month;
  const summaryStats = [
    { label: 'Tracked tenants', value: `${trackedTenants}` },
    { label: 'Rent collected', value: formatCurrency(totalCollectedValue) },
    { label: 'Outstanding arrears', value: formatCurrency(totalArrearsValue) },
    { label: 'Airbnb earnings', value: airbnbEarningsDisplay }
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

  const metrics = {
    totalCollected: formatCurrency(totalCollectedValue),
    tenantsPaid: `${filteredTenantsPaid}`,
    overdues: `${totalOverdues}`,
    balance: formatCurrency(balance),
    airbnbEarnings: airbnbEarningsDisplay,
    reminders: `${reminders.length}`,
    notifications: `${notifications.length}`
  };
  const metricsReady = !paymentsLoading && !summaryLoading;
  const skeletonBlock = (
    <span className="inline-block h-6 w-20 animate-pulse rounded bg-gray-200" aria-hidden="true" />
  );

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
          <span>Filter by Unit</span>
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
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {metricCards.map((metric) => (
          <Card key={metric.key} title={metric.label}>
            <p className="text-2xl font-semibold">
              {metricsReady ? metrics[metric.key as keyof typeof metrics] : skeletonBlock}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Calendar">
          <Calendar />
        </Card>
        <Card title="Totals">
          <KPIStats stats={summaryStats} loading={!metricsReady} />
        </Card>
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
    </section>
  );
};

export default Dashboard;
