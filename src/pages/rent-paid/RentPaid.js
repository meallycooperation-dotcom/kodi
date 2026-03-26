import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import PaymentForm from '../../components/rent/PaymentForm';
import RentTable from '../../components/rent/RentTable';
import Button from '../../components/ui/Button';
import usePayments from '../../hooks/usePayments';
import useTenants from '../../hooks/useTenants';
import useUnits from '../../hooks/useUnits';
import useAuth from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatCurrency';
const RentPaid = () => {
    const { payments, totalCollected } = usePayments();
    const { user } = useAuth();
    const { units } = useUnits('occupied', user?.id);
    const { tenants } = useTenants(user?.id);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const selectedMonth = useMemo(() => payments[0]?.monthPaidFor ?? new Date().toISOString().slice(0, 7), [payments]);
    const paymentSums = useMemo(() => {
        const map = new Map();
        payments
            .filter((payment) => payment.monthPaidFor === selectedMonth)
            .forEach((payment) => {
            const existing = map.get(payment.unitId) ?? { amount: 0, name: payment.tenantName };
            map.set(payment.unitId, {
                amount: existing.amount + payment.amountPaid,
                name: existing.name ?? payment.tenantName
            });
        });
        return map;
    }, [payments, selectedMonth]);
    const tenantsByUnit = useMemo(() => {
        const map = new Map();
        tenants.forEach((tenant) => {
            if (tenant.unitId) {
                map.set(tenant.unitId, tenant.fullName);
            }
        });
        return map;
    }, [tenants]);
    const outstanding = useMemo(() => {
        const rows = units
            .map((unit) => {
            const { amount = 0, name } = paymentSums.get(unit.id) ?? {};
            const balance = Math.max(unit.rentAmount - amount, 0);
            const displayName = tenantsByUnit.get(unit.id) ?? name ?? `Unit ${unit.unitNumber ?? unit.id}`;
            return {
                unit,
                paid: amount,
                balance,
                displayName
            };
        })
            .filter((row) => row.balance > 0)
            .sort((a, b) => b.balance - a.balance);
        const total = rows.reduce((sum, row) => sum + row.balance, 0);
        return { rows, total };
    }, [paymentSums, tenantsByUnit, units]);
    const formattedMonth = useMemo(() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        if (!Number.isFinite(year) || !Number.isFinite(month)) {
            return selectedMonth;
        }
        return new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    }, [selectedMonth]);
    return (_jsxs("section", { className: "space-y-5", children: [_jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { children: "Rent Paid" }), _jsxs("p", { children: ["Total collected this month: ", formatCurrency(totalCollected)] })] }), _jsx(Button, { type: "button", onClick: () => setShowPaymentForm((v) => !v), children: showPaymentForm ? 'Hide Form' : 'Record Payment' })] }), showPaymentForm && _jsx(PaymentForm, {}), _jsxs("section", { className: "space-y-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("h2", { className: "text-lg font-semibold", children: ["Outstanding balances for ", formattedMonth] }), _jsx("p", { className: "text-sm text-gray-500", children: "Subtracts paid amounts from the unit rent, using the latest recorded month to highlight who still owes." })] }), outstanding.rows.length ? (_jsxs("div", { className: "space-y-3 rounded border border-gray-200 bg-white p-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "font-medium", children: "Total outstanding" }), _jsx("p", { className: "text-xl font-semibold", children: formatCurrency(outstanding.total) })] }), _jsx("ul", { className: "space-y-3", children: outstanding.rows.map((row) => (_jsxs("li", { className: "flex flex-col gap-2 rounded border border-dashed border-gray-200 p-3 shadow-sm md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold", children: row.displayName }), _jsxs("p", { className: "text-sm text-gray-500", children: ["Unit ", row.unit.unitNumber || row.unit.id] })] }), _jsxs("div", { className: "text-sm text-gray-500 md:text-right", children: [_jsxs("p", { children: ["Expected: ", formatCurrency(row.unit.rentAmount)] }), _jsxs("p", { children: ["Paid: ", formatCurrency(row.paid)] })] }), _jsx("p", { className: "text-lg font-semibold text-amber-600", children: formatCurrency(row.balance) })] }, row.unit.id))) })] })) : (_jsxs("p", { className: "text-sm text-gray-500", children: ["No outstanding balances detected for ", formattedMonth, "."] }))] }), _jsx(RentTable, { payments: payments })] }));
};
export default RentPaid;
