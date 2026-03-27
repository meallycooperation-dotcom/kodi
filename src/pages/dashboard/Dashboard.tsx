import { useMemo } from 'react';
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
import { formatCurrency } from '../../utils/formatCurrency';

const metricCards = [
  { label: 'Total collected', key: 'totalCollected' },
  { label: 'Tenants paid', key: 'tenantsPaid' },
  { label: 'Overdues', key: 'overdues' },
  { label: 'Balance', key: 'balance' },
  { label: 'Reminders', key: 'reminders' },
  { label: 'Notifications', key: 'notifications' }
];

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { tenants } = useTenants();
  const { units } = useUnits('all', user?.id);
  const { payments, totalCollected, tenantsPaidCount, loading: paymentsLoading } = usePayments();
  const { arrears, totalDue } = useArrears();
  const { reminders } = useReminders();
  const { notifications } = useNotifications();

  const { summary, loading: summaryLoading } = useDashboardSummary();
  const { months } = useMonthlyRevenue();

  const tenantCountsByUnit = useMemo(() => {
    const map = new Map<string, number>();
    tenants.forEach((tenant) => {
      if (!tenant.unitId) {
        return;
      }
      const isActiveTenant = tenant.status === 'active' || tenant.status === 'late';
      if (!isActiveTenant) {
        return;
      }
      map.set(tenant.unitId, (map.get(tenant.unitId) ?? 0) + 1);
    });
    return map;
  }, [tenants]);

  const totalOverdues = arrears.length;
  const totalCollectedValue = summary?.total_collected ?? totalCollected;
  const totalArrearsValue = summary?.total_arrears ?? totalDue;
  const isLoading = authLoading || paymentsLoading || summaryLoading;
  const balance = totalCollectedValue - totalArrearsValue;
  const trackedTenants = summary?.total_tenants ?? tenants.length;
  const latestMonth = months[0]?.month;
  const summaryStats = [
    { label: 'Tracked tenants', value: `${trackedTenants}` },
    { label: 'Rent collected', value: formatCurrency(totalCollectedValue) },
    { label: 'Outstanding arrears', value: formatCurrency(totalArrearsValue) }
  ];
  const { occupiedHouses, totalHouses } = useMemo(() => {
    let occupied = 0;
    let total = 0;
    units.forEach((unit) => {
      const houses = unit.numberOfHouses ?? 1;
      total += houses;
      occupied += Math.min(tenantCountsByUnit.get(unit.id) ?? 0, houses);
    });
    return { occupiedHouses: occupied, totalHouses: total };
  }, [tenantCountsByUnit, units]);

  const occupancyRate = totalHouses
    ? `${Math.round((occupiedHouses / totalHouses) * 100)}%`
    : '0%';

  const metrics = {
    totalCollected: formatCurrency(totalCollectedValue),
    tenantsPaid: `${tenantsPaidCount}`,
    overdues: `${totalOverdues}`,
    balance: formatCurrency(balance),
    reminders: `${reminders.length}`,
    notifications: `${notifications.length}`
  };
  const metricsReady = !paymentsLoading && !summaryLoading;
  const skeletonBlock = (
    <span className="inline-block h-6 w-20 animate-pulse rounded bg-gray-200" aria-hidden="true" />
  );

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="sr-only">Dashboard</h1>
        {isLoading && <span className="sr-only text-sm text-gray-500">Refreshing data...</span>}
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
            {payments.slice(0, 3).map((payment) => (
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
