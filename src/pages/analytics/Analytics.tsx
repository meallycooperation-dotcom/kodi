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
import { fetchAirbnbListingsByCreator } from '../../services/airbnbService';
import { fetchAirbnbTenantsByListingIds } from '../../services/airbnbTenantService';
import {
  fetchApartmentPaidView,
  fetchApartmentArrearsView,
  type ApartmentPaidViewRecord,
  type ApartmentArrearsViewRecord
} from '../../services/paymentService';
import type { AirbnbTenant } from '../../types/airbnbTenant';
import type { Tenant } from '../../types/tenant';
import { useCurrency } from '../../context/currency';
import useApartmentTenantTracker from '../../hooks/useApartmentTenantTracker';

type ScopeValue = 'all' | 'airbnb' | `unit:${string}` | `apartment:${string}`;
type ParsedScope =
  | { type: 'all' }
  | { type: 'airbnb' }
  | { type: 'unit'; id: string }
  | { type: 'apartment'; id: string };

const Analytics = () => {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { tenants } = useTenants();
  const { payments } = usePayments();
  const { arrears } = useArrears();
  const { units } = useUnits('all', user?.id);
  const { months } = useMonthlyRevenue();
  const [selectedScope, setSelectedScope] = useState<ScopeValue>('all');
  const [airbnbTenants, setAirbnbTenants] = useState<AirbnbTenant[]>([]);
  const [loadingAirbnbData, setLoadingAirbnbData] = useState(false);
  const [apartmentPaidRecords, setApartmentPaidRecords] = useState<ApartmentPaidViewRecord[]>([]);
  const [apartmentArrearsRecords, setApartmentArrearsRecords] = useState<ApartmentArrearsViewRecord[]>([]);
  const { apartments, tenantRecords, totalTenants: apartmentTenantTotal } = useApartmentTenantTracker();
  const loadAirbnbData = useCallback(async () => {
    if (!user?.id) {
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

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user?.id) {
        if (mounted) {
          setApartmentPaidRecords([]);
          setApartmentArrearsRecords([]);
        }
        return;
      }
      try {
        const [paidRes, arrearsRes] = await Promise.all([
          fetchApartmentPaidView(user.id),
          fetchApartmentArrearsView(user.id)
        ]);
        if (!mounted) {
          return;
        }
        setApartmentPaidRecords(paidRes);
        setApartmentArrearsRecords(arrearsRes);
      } catch (error) {
        console.error('loadApartmentAnalytics error', error);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const parsedScope = useMemo<ParsedScope>(() => {
    if (selectedScope === 'all') {
      return { type: 'all' };
    }
    if (selectedScope === 'airbnb') {
      return { type: 'airbnb' };
    }
    if (selectedScope.startsWith('apartment:')) {
      return { type: 'apartment', id: selectedScope.split(':')[1] };
    }
    if (selectedScope.startsWith('unit:')) {
      return { type: 'unit', id: selectedScope.split(':')[1] };
    }
    return { type: 'unit', id: selectedScope };
  }, [selectedScope]);

  const filteredTenants = useMemo(() => {
    switch (parsedScope.type) {
      case 'all':
        return tenants;
      case 'airbnb':
        return airbnbTenants;
      case 'apartment':
        return tenantRecords.filter((tenant) => tenant.apartmentId === parsedScope.id);
      case 'unit':
        return tenants.filter((tenant) => tenant.unitId === parsedScope.id);
    }
  }, [parsedScope, tenants, airbnbTenants, tenantRecords]);


  const filteredPayments = useMemo(() => {
    switch (parsedScope.type) {
      case 'all':
        return payments;
      case 'unit':
        return payments.filter((payment) => payment.unitId === parsedScope.id);
      case 'airbnb':
        return [];
      case 'apartment': {
        const apartmentName = apartments.find((apt) => apt.id === parsedScope.id)?.name;
        if (!apartmentName) {
          return [];
        }
        return apartmentPaidRecords.filter((record) => record.apartmentName === apartmentName);
      }
    }
  }, [parsedScope, payments, apartmentPaidRecords, apartments]);

  const filteredArrears = useMemo(() => {
    switch (parsedScope.type) {
      case 'all':
        return arrears;
      case 'unit':
        return arrears.filter((arrear) => arrear.unitId && arrear.unitId === parsedScope.id);
      case 'airbnb':
        return [];
      case 'apartment': {
        const apartmentName = apartments.find((apt) => apt.id === parsedScope.id)?.name;
        if (!apartmentName) {
          return [];
        }
        return apartmentArrearsRecords.filter((record) => record.apartmentName === apartmentName);
      }
    }
  }, [parsedScope, arrears, apartmentArrearsRecords, apartments]);
  const filteredTotalCollected = useMemo(
    () => filteredPayments.reduce((sum, payment) => sum + payment.amountPaid, 0),
    [filteredPayments]
  );

  const filteredTotalDue = useMemo(
    () =>
      filteredArrears.reduce((sum, record) => {
        const amount = 'amountDue' in record ? record.amountDue : record.balance ?? 0;
        return sum + amount;
      }, 0),
    [filteredArrears]
  );

  const airbnbEarnings = useMemo(
    () => airbnbTenants.reduce((sum, tenant) => sum + (tenant.totalAmount ?? 0), 0),
    [airbnbTenants]
  );
  const airbnbEarningsDisplay = loadingAirbnbData ? 'Loading...' : formatCurrency(airbnbEarnings);

  const activeTenantCount = useMemo(() => {
    if (parsedScope.type === 'airbnb') {
      return filteredTenants.filter(
        (tenant) => 'status' in tenant && tenant.status === 'checked_in'
      ).length;
    }
    return filteredTenants.filter((tenant) => {
      if ('status' in tenant) {
        return tenant.status === 'active';
      }
      return true;
    }).length;
  }, [filteredTenants, parsedScope.type]);

  const apartmentActiveTenantCount = apartmentTenantTotal;
  const apartmentRentCollected = useMemo(
    () => apartmentPaidRecords.reduce((sum, record) => sum + record.amountPaid, 0),
    [apartmentPaidRecords]
  );
  const apartmentRentOutstanding = useMemo(
    () => apartmentArrearsRecords.reduce((sum, record) => sum + record.balance, 0),
    [apartmentArrearsRecords]
  );

  const stats = [
    { label: 'Active tenants', value: `${activeTenantCount}` },
    { label: 'Rent collected', value: formatCurrency(filteredTotalCollected) },
    { label: 'Rent outstanding', value: formatCurrency(filteredTotalDue) },
    { label: 'Apartment active tenants', value: `${apartmentActiveTenantCount}` },
    { label: 'Apartment rent collected', value: formatCurrency(apartmentRentCollected) },
    { label: 'Apartment rent outstanding', value: formatCurrency(apartmentRentOutstanding) },
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
          <span>Filter by scope</span>
          <select
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value as ScopeValue)}
            className="w-full md:w-48 p-2 border rounded-lg"
          >
            <option value="all">All Units</option>
            <option value="airbnb">Airbnb listings</option>
            <optgroup label="Apartments">
              {apartments.map((apt) => (
                <option key={`apt-${apt.id}`} value={`apartment:${apt.id}`}>
                  Apartment {apt.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Units">
              {units.map((unit) => (
                <option key={`unit-${unit.id}`} value={`unit:${unit.id}`}>
                  Unit {unit.unitNumber}
                </option>
              ))}
            </optgroup>
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
