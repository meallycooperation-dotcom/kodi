import { useMemo, useState } from 'react';
import Card from '../../components/ui/Card';
import KPIStats from '../../components/analytics/KPIStats';
import OccupancyChart from '../../components/analytics/OccupancyChart';
import MonthlyRevenueChart from '../../components/analytics/MonthlyRevenueChart';
import useTenants from '../../hooks/useTenants';
import usePayments from '../../hooks/usePayments';
import useArrears from '../../hooks/useArrears';
import useMonthlyRevenue from '../../hooks/useMonthlyRevenue';
import useUnits from '../../hooks/useUnits';
import useAuth from '../../hooks/useAuth';
import { useCurrency } from '../../context/currency';

const Analytics = () => {
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();
  const { tenants } = useTenants();
  const { payments, totalCollected } = usePayments();
  const { arrears, totalDue } = useArrears();
  const { units } = useUnits('all', user?.id);
  const { months } = useMonthlyRevenue();
  const [selectedUnitId, setSelectedUnitId] = useState<string | 'all'>('all');

  const filteredTenants = useMemo(
    () =>
      selectedUnitId === 'all'
        ? tenants
        : tenants.filter((tenant) => tenant.unitId === selectedUnitId),
    [tenants, selectedUnitId]
  );

  const filteredPayments = useMemo(
    () =>
      selectedUnitId === 'all'
        ? payments
        : payments.filter((payment) => payment.unitId === selectedUnitId),
    [payments, selectedUnitId]
  );

  const filteredArrears = useMemo(
    () =>
      selectedUnitId === 'all'
        ? arrears
        : arrears.filter((arrear) => arrear.unitId === selectedUnitId),
    [arrears, selectedUnitId]
  );

  const filteredTotalCollected = useMemo(
    () => filteredPayments.reduce((sum, payment) => sum + payment.amountPaid, 0),
    [filteredPayments]
  );

  const filteredTotalDue = useMemo(
    () => filteredArrears.reduce((sum, arrear) => sum + arrear.amountDue, 0),
    [filteredArrears]
  );

  const stats = [
    { label: 'Active tenants', value: `${filteredTenants.filter((tenant) => tenant.status === 'active').length}` },
    { label: 'Rent collected', value: formatCurrency(filteredTotalCollected) },
    { label: 'Rent outstanding', value: formatCurrency(filteredTotalDue) }
  ];

  const occupancyRate = filteredTenants.length
    ? `${Math.round((filteredTenants.filter((tenant) => tenant.status === 'active').length / filteredTenants.length) * 100)}%`
    : '0%';

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1>Analytics</h1>
        <label className="input-field">
          <span>Filter by Unit</span>
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value as string | 'all')}
            className="w-full md:w-48 p-2 border rounded-lg"
          >
            <option value="all">All Units</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                Unit {unit.unitNumber}
              </option>
            ))}
          </select>
        </label>
      </div>
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
