import Card from '../../components/ui/Card';
import KPIStats from '../../components/analytics/KPIStats';
import OccupancyChart from '../../components/analytics/OccupancyChart';
import MonthlyRevenueChart from '../../components/analytics/MonthlyRevenueChart';
import useTenants from '../../hooks/useTenants';
import usePayments from '../../hooks/usePayments';
import useArrears from '../../hooks/useArrears';
import useMonthlyRevenue from '../../hooks/useMonthlyRevenue';
import { formatCurrency } from '../../utils/formatCurrency';

const Analytics = () => {
  const { tenants } = useTenants();
  const { payments, totalCollected } = usePayments();
  const { totalDue } = useArrears();

  const stats = [
    { label: 'Active tenants', value: `${tenants.filter((tenant) => tenant.status === 'active').length}` },
    { label: 'Rent collected', value: formatCurrency(totalCollected) },
    { label: 'Rent outstanding', value: formatCurrency(totalDue) }
  ];

  const occupancyRate = tenants.length
    ? `${Math.round((tenants.filter((tenant) => tenant.status === 'active').length / tenants.length) * 100)}%`
    : '0%';

  const { months } = useMonthlyRevenue();

  return (
    <section className="space-y-6">
      <h1>Analytics</h1>
      <Card>
        <KPIStats stats={stats} />
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Revenue Trend">
          {months.length ? (
            <MonthlyRevenueChart data={months} />
          ) : (
            <p className="text-sm text-gray-500">Revenue history will appear here once payments are recorded.</p>
          )}
        </Card>
        <Card title="Occupancy">
          <OccupancyChart summary={occupancyRate} />
        </Card>
      </div>
    </section>
  );
};

export default Analytics;
