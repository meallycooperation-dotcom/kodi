import ArrearsList from '../../components/rent/ArrearsList';
import useArrears from '../../hooks/useArrears';
import useDashboardSummary from '../../hooks/useDashboardSummary';
import { formatCurrency } from '../../utils/formatCurrency';

const RentArrears = () => {
  const { arrears, totalDue, tenantBalances } = useArrears();
  const { summary } = useDashboardSummary();
  const totalArrearsValue = summary?.total_arrears ?? totalDue;
  const balances = tenantBalances;

  return (
    <section className="space-y-4">
      <div className="page-header">
        <div>
          <h1>Rent Arrears</h1>
          <p>Total outstanding: {formatCurrency(totalArrearsValue)}</p>
        </div>
      </div>
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Tenants with arrears</h2>
          {balances.length ? (
            <ul className="space-y-3">
              {balances.map((balance) => (
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
        <ArrearsList arrears={arrears} />
      </div>
    </section>
  );
};

export default RentArrears;
