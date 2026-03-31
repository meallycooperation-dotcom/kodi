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
import { fetchAirbnbTenantsByListingIds } from '../../services/airbnbTenantService';
import {
  fetchApartmentPaidView,
  type ApartmentPaidViewRecord
} from '../../services/paymentService';
import type { AirbnbTenant } from '../../types/airbnbTenant';
import type { Tenant } from '../../types/tenant';

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
  const { totalTenants: apartmentTenantTotal, loading: apartmentTenantLoading } = useApartmentTenantTracker();
  const [apartmentPaidRecords, setApartmentPaidRecords] = useState<ApartmentPaidViewRecord[]>([]);
  const [apartmentPaidLoading, setApartmentPaidLoading] = useState(false);

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
    </section>
  );
};

export default Dashboard;
