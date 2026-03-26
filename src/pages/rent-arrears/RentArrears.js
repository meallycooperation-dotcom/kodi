import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import ArrearsList from '../../components/rent/ArrearsList';
import useArrears from '../../hooks/useArrears';
import useDashboardSummary from '../../hooks/useDashboardSummary';
import { formatCurrency } from '../../utils/formatCurrency';
const RentArrears = () => {
    const { arrears, totalDue, tenantBalances } = useArrears();
    const { summary } = useDashboardSummary();
    const totalArrearsValue = summary?.total_arrears ?? totalDue;
    const balances = tenantBalances;
    return (_jsxs("section", { className: "space-y-4", children: [_jsx("div", { className: "page-header", children: _jsxs("div", { children: [_jsx("h1", { children: "Rent Arrears" }), _jsxs("p", { children: ["Total outstanding: ", formatCurrency(totalArrearsValue)] })] }) }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Tenants with arrears" }), balances.length ? (_jsx("ul", { className: "space-y-3", children: balances.map((balance) => (_jsxs("li", { className: "flex items-center justify-between rounded border border-dashed border-gray-200 p-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "font-semibold", children: balance.tenantName }), _jsx("p", { className: "text-sm text-gray-500", children: balance.months.join(', ') })] }), _jsx("span", { className: "text-lg font-semibold", children: formatCurrency(balance.totalDue) })] }, balance.tenantId))) })) : (_jsx("p", { className: "text-sm text-gray-500", children: "No tenants currently have outstanding balances." }))] }), _jsx(ArrearsList, { arrears: arrears })] })] }));
};
export default RentArrears;
