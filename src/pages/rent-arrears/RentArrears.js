import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    const [selectedUnitId, setSelectedUnitId] = useState('all');
    const filteredArrears = useMemo(() => selectedUnitId === 'all'
        ? arrears
        : arrears.filter((arrear) => arrear.unitId && arrear.unitId === selectedUnitId), [arrears, selectedUnitId]);
    const filteredTenantBalances = useMemo(() => {
        if (selectedUnitId === 'all')
            return tenantBalances;
        const arrearsByUnit = new Set(filteredArrears.map((arrear) => arrear.tenantId));
        return tenantBalances.filter((balance) => arrearsByUnit.has(balance.tenantId));
    }, [tenantBalances, filteredArrears, selectedUnitId]);
    const filteredTotalDue = useMemo(() => filteredArrears.reduce((sum, arrear) => sum + arrear.amountDue, 0), [filteredArrears]);
    const totalArrearsValue = filteredTotalDue;
    return (_jsxs("section", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { children: "Rent Arrears" }), _jsxs("p", { children: ["Total outstanding: ", formatCurrency(totalArrearsValue)] })] }), _jsxs("label", { className: "input-field", children: [_jsx("span", { children: "Filter by Unit" }), _jsxs("select", { value: selectedUnitId, onChange: (e) => setSelectedUnitId(e.target.value), className: "w-full md:w-48 p-2 border rounded-lg", children: [_jsx("option", { value: "all", children: "All Units" }), units.map((unit) => (_jsxs("option", { value: unit.id, children: ["Unit ", unit.unitNumber] }, unit.id)))] })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Tenants with arrears" }), filteredTenantBalances.length ? (_jsx("ul", { className: "space-y-3", children: filteredTenantBalances.map((balance) => (_jsxs("li", { className: "flex items-center justify-between rounded border border-dashed border-gray-200 p-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "font-semibold", children: balance.tenantName }), _jsx("p", { className: "text-sm text-gray-500", children: balance.months.join(', ') })] }), _jsx("span", { className: "text-lg font-semibold", children: formatCurrency(balance.totalDue) })] }, balance.tenantId))) })) : (_jsx("p", { className: "text-sm text-gray-500", children: "No tenants currently have outstanding balances." }))] }), _jsx(ArrearsList, { arrears: filteredArrears })] })] }));
};
export default RentArrears;
