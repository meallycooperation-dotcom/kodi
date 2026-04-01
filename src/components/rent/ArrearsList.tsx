import Badge from '../ui/Badge';
import type { Arrear } from '../../types/arrears';
import { useCurrency } from '../../context/currency';

type ArrearsListProps = {
  arrears: Arrear[];
};

const ArrearsList = ({ arrears }: ArrearsListProps) => {
  const { formatCurrency } = useCurrency();

  return (
    <ul className="arrears-list space-y-4">
      {arrears.map((item) => {
        const isPaid = item.amountDue <= 0;
        const monthsLabel = item.monthsStayed
          ? `${item.monthsStayed} month${item.monthsStayed === 1 ? '' : 's'} of tenancy`
          : 'Lifetime summary';
        return (
          <li key={item.id} className="arrears-item">
            <div>
              <p className="font-semibold">
                {item.tenantName ?? 'Tenant'} ({item.tenantId})
              </p>
              <p className="text-sm text-gray-500">{monthsLabel}</p>
              <p className="text-sm text-gray-500">
                Total rent: {formatCurrency(item.totalExpectedRent)} · Paid: {formatCurrency(item.totalPaid)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-base font-semibold text-gray-900">
                {formatCurrency(item.amountDue)}
              </span>
              <Badge status={isPaid ? 'success' : 'warning'}>
                {isPaid ? 'Paid' : `Owes ${formatCurrency(item.amountDue)}`}
              </Badge>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default ArrearsList;
