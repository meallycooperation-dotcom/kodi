import { useMemo } from 'react';
import Table from '../ui/Table';
import type { Payment } from '../../types/payment';
import { useCurrency } from '../../context/currency';

type RentTableProps = {
  payments: Payment[];
};

const RentTable = ({ payments }: RentTableProps) => {
  const { formatCurrency } = useCurrency();

  const paymentDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en-KE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
    []
  );

  return (
    <Table headers={['Tenant', 'Amount', 'Date', 'Method']}>
      {payments.map((payment) => {
        const paymentDate = payment.paymentDate
          ? new Date(payment.paymentDate)
          : payment.createdAt
          ? new Date(payment.createdAt)
          : null;
        const formattedDate =
          paymentDate && Number.isFinite(paymentDate.getTime())
            ? paymentDateFormatter.format(paymentDate)
            : 'Date not available';
        return (
          <tr key={payment.id}>
            <td>{payment.tenantName ?? payment.tenantId}</td>
            <td>{formatCurrency(payment.amountPaid)}</td>
            <td>{formattedDate}</td>
            <td>{payment.paymentMethod ?? '-'}</td>
          </tr>
        );
      })}
    </Table>
  );
};

export default RentTable;
