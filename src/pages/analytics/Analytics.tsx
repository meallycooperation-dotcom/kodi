import { useMemo, useState, useCallback, useEffect } from 'react';
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
import { fetchAirbnbListingsByCreator } from '../../services/airbnbService';
import { fetchAirbnbTenantsByListingIds } from '../../services/airbnbTenantService';
import type { AirbnbTenant } from '../../types/airbnbTenant';

type FilterScope = string | 'all' | 'airbnb';

const Analytics = () => {
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();
  const { tenants } = useTenants();
  const { payments, totalCollected } = usePayments();
  const { arrears, totalDue } = useArrears();
  const { units } = useUnits('all', user?.id);
  const { months } = useMonthlyRevenue();
  const [selectedUnitId, setSelectedUnitId] = useState<FilterScope>('all');
  const [airbnbTenants, setAirbnbTenants] = useState<AirbnbTenant[]>([]);
  const [loadingAirbnbData, setLoadingAirbnbData] = useState(false);
  const loadAirbnbData = useCallback(async () => {
    if (!user?.id) {
      setAirbnbListings([]);
      setAirbnbTenants([]);
      return;
    }

    setLoadingAirbnbData(true);
    try {
      const listings = await fetchAirbnbListingsByCreator(user.id);
      const tenants = await fetchAirbnbTenantsByListingIds(listings.map((listing) => listing.id));
      setAirbnbTenants(tenants);
    } catch (error) {
      console.error('loadAirbnbAnalytics', error);
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

  const airbnbEarnings = useMemo(
    () => airbnbTenants.reduce((sum, tenant) => sum + (tenant.totalAmount ?? 0), 0),
    [airbnbTenants]
  );
  const airbnbEarningsDisplay = loadingAirbnbData ? 'Loading...' : formatCurrency(airbnbEarnings);

  const activeTenantCount = useMemo(() => {
    if (selectedUnitId === 'airbnb') {
      return filteredTenants.filter((tenant) => tenant.status === 'checked_in').length;
    }
    return filteredTenants.filter((tenant) => tenant.status === 'active').length;
  }, [filteredTenants, selectedUnitId]);

  const stats = [
    { label: 'Active tenants', value: `${activeTenantCount}` },
    { label: 'Rent collected', value: formatCurrency(filteredTotalCollected) },
    { label: 'Rent outstanding', value: formatCurrency(filteredTotalDue) },
    { label: 'Airbnb earnings', value: airbnbEarningsDisplay }
  ];

  const occupancyRate = filteredTenants.length
    ? `${Math.round((activeTenantCount / filteredTenants.length) * 100)}%`
    : '0%';

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1>Analytics</h1>
        <label className="input-field">
          <span>Filter by Unit</span>
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value as FilterScope)}
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
