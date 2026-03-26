import Badge from '../ui/Badge';
import type { Arrear } from '../../types/arrears';
import { formatCurrency } from '../../utils/formatCurrency';

type ArrearsListProps = {
  arrears: Arrear[];
};

const ArrearsList = ({ arrears }: ArrearsListProps) => (
  <ul className="arrears-list space-y-4">
    {arrears.map((item) => (
      <li key={item.id} className="arrears-item">
        <div>
          <p>
            {item.tenantName ?? 'Tenant'} ({item.tenantId}) · {item.month}
          </p>
          <small>Status: {item.status}</small>
        </div>
        <Badge status="warning">{formatCurrency(item.amountDue)}</Badge>
      </li>
    ))}
  </ul>
);

export default ArrearsList;
