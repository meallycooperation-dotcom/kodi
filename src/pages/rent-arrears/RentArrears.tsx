import { useMemo, useState } from 'react';
import ArrearsList from '../../components/rent/ArrearsList';
import useArrears from '../../hooks/useArrears';
import useDashboardSummary from '../../hooks/useDashboardSummary';
import useUnits from '../../hooks/useUnits';
import useAuth from '../../hooks/useAuth';
import { useCurrency } from '../../context/currency';
import PageLoader from '../../components/ui/PageLoader';

const RentArrears = () => {
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();
  const { units } = useUnits('all', user?.id);
  const { arrears, totalDue, tenantBalances, isLoading } = useArrears();
  const { summary } = useDashboardSummary();
  const [selectedUnitId, setSelectedUnitId] = useState<string | 'all'>('all');

  const filteredArrears = useMemo(
    () =>
      selectedUnitId === 'all'
        ? arrears
        : arrears.filter((arrear) => arrear.unitId && arrear.unitId === selectedUnitId),
    [arrears, selectedUnitId]
  );

  const filteredTenantBalances = useMemo(() => {
    if (selectedUnitId === 'all') return tenantBalances;
    const arrearsByUnit = new Set(
      filteredArrears.map((arrear) => arrear.tenantId)
    );
    return tenantBalances.filter((balance) => arrearsByUnit.has(balance.tenantId));
  }, [tenantBalances, filteredArrears, selectedUnitId]);

  const filteredTotalDue = useMemo(
    () => filteredArrears.reduce((sum, arrear) => sum + arrear.amountDue, 0),
    [filteredArrears]
  );

  const filteredTotalExpected = useMemo(
    () => filteredTenantBalances.reduce((sum, balance) => sum + balance.totalExpectedRent, 0),
    [filteredTenantBalances]
  );

  const filteredTotalPaid = useMemo(
    () => filteredTenantBalances.reduce((sum, balance) => sum + balance.totalPaid, 0),
    [filteredTenantBalances]
  );

  const totalArrearsValue = filteredTotalDue;

  if (isLoading) {
    return <PageLoader message="Loading arrears data..." />;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1>Rent Arrears</h1>
          <p>Total outstanding: {formatCurrency(totalArrearsValue)}</p>
        </div>
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
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Total Rent Due</p>
          <p className="text-2xl font-semibold">{formatCurrency(filteredTotalExpected)}</p>
          <p className="text-xs text-gray-400">Includes all tenants in the current filter</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Total Paid</p>
          <p className="text-2xl font-semibold">{formatCurrency(filteredTotalPaid)}</p>
          <p className="text-xs text-gray-400">Cumulative payments recorded so far</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Outstanding Balance</p>
          <p className="text-2xl font-semibold">{formatCurrency(filteredTotalDue)}</p>
          <p className="text-xs text-gray-400">Sum of tenant arrears</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tenant financial summary</h2>
            <span className="text-sm text-gray-500">{filteredTenantBalances.length} tenant(s)</span>
          </div>
          {filteredTenantBalances.length ? (
            <ul className="space-y-3">
              {filteredTenantBalances.map((balance) => (
                <li
                  key={balance.tenantId}
                  className="flex items-center justify-between rounded-lg border border-dashed border-gray-200 bg-white p-4"
                >
                  <div>
                    <p className="font-semibold">{balance.tenantName}</p>
                    <p className="text-sm text-gray-500">
                      {balance.monthsStayed
                        ? `${balance.monthsStayed} month${balance.monthsStayed === 1 ? '' : 's'} of tenancy`
                        : 'Lifetime summary'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Total Rent: {formatCurrency(balance.totalExpectedRent)} · Paid: {formatCurrency(balance.totalPaid)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(balance.arrears)}</p>
                    <span
                      className={`text-sm font-semibold ${
                        balance.status === 'paid' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {balance.status === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No tenants currently have outstanding balances.</p>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Arrears details</h2>
          <ArrearsList arrears={filteredArrears} />
        </div>
      </div>
    </section>
  );
};

export default RentArrears;
