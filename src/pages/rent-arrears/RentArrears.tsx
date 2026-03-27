import { useMemo, useState } from 'react';
import ArrearsList from '../../components/rent/ArrearsList';
import useArrears from '../../hooks/useArrears';
import useDashboardSummary from '../../hooks/useDashboardSummary';
import useUnits from '../../hooks/useUnits';
import useAuth from '../../hooks/useAuth';
import { useCurrency } from '../../context/currency';

const RentArrears = () => {
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();
  const { units } = useUnits('all', user?.id);
  const { arrears, totalDue, tenantBalances } = useArrears();
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

  const totalArrearsValue = filteredTotalDue;

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
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Tenants with arrears</h2>
          {filteredTenantBalances.length ? (
            <ul className="space-y-3">
              {filteredTenantBalances.map((balance) => (
                <li
                  key={balance.tenantId}
                  className="flex items-center justify-between rounded border border-dashed border-gray-200 p-3"
                >
                  <div className="space-y-1">
                    <p className="font-semibold">{balance.tenantName}</p>
                    <p className="text-sm text-gray-500">
                      {balance.months.join(', ')}
                    </p>
                  </div>
                  <span className="text-lg font-semibold">{formatCurrency(balance.totalDue)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No tenants currently have outstanding balances.</p>
          )}
        </div>
        <ArrearsList arrears={filteredArrears} />
      </div>
    </section>
  );
};

export default RentArrears;
