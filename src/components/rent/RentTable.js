import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Table from '../ui/Table';
import { formatCurrency } from '../../utils/formatCurrency';
const RentTable = ({ payments }) => (_jsx(Table, { headers: ['Tenant', 'Amount', 'Month', 'Method'], children: payments.map((payment) => (_jsxs("tr", { children: [_jsx("td", { children: payment.tenantName ?? payment.tenantId }), _jsx("td", { children: formatCurrency(payment.amountPaid) }), _jsx("td", { children: payment.monthPaidFor }), _jsx("td", { children: payment.paymentMethod ?? '—' })] }, payment.id))) }));
export default RentTable;
