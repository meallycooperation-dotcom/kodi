import Table from '../ui/Table';
import type { Payment } from '../../types/payment';
import { useCurrency } from '../../context/currency';

type RentTableProps = {
  payments: Payment[];
};

const RentTable = ({ payments }: RentTableProps) => {
  const { formatCurrency } = useCurrency();

  return (
    <Table headers={['Tenant', 'Amount', 'Month', 'Method']}>
      {payments.map((payment) => (
        <tr key={payment.id}>
          <td>{payment.tenantName ?? payment.tenantId}</td>
          <td>{formatCurrency(payment.amountPaid)}</td>
          <td>{payment.monthPaidFor}</td>
          <td>{payment.paymentMethod ?? '-'}</td>
        </tr>
      ))}
    </Table>
  );
};

export default RentTable;
