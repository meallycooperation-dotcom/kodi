import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import Badge from '../ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';
const ArrearsList = ({ arrears }) => (_jsx("ul", { className: "arrears-list space-y-4", children: arrears.map((item) => (_jsxs("li", { className: "arrears-item", children: [_jsxs("div", { children: [_jsxs("p", { children: [item.tenantName ?? 'Tenant', " (", item.tenantId, ") \u00B7 ", item.month] }), _jsxs("small", { children: ["Status: ", item.status] })] }), _jsx(Badge, { status: "warning", children: formatCurrency(item.amountDue) })] }, item.id))) }));
export default ArrearsList;
