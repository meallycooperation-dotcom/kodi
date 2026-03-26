import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Card from '../../components/ui/Card';
import KPIStats from '../../components/analytics/KPIStats';
import OccupancyChart from '../../components/analytics/OccupancyChart';
import MonthlyRevenueChart from '../../components/analytics/MonthlyRevenueChart';
import useAuth from '../../hooks/useAuth';
import useTenants from '../../hooks/useTenants';
import usePayments from '../../hooks/usePayments';
import useArrears from '../../hooks/useArrears';
import useMonthlyRevenue from '../../hooks/useMonthlyRevenue';
import { formatCurrency } from '../../utils/formatCurrency';
const Analytics = () => {
    const { user } = useAuth();
    const { tenants } = useTenants(user?.id);
    const { payments, totalCollected } = usePayments();
    const { totalDue } = useArrears();
    const stats = [
        { label: 'Active tenants', value: `${tenants.filter((tenant) => tenant.status === 'active').length}` },
        { label: 'Rent collected', value: formatCurrency(totalCollected) },
        { label: 'Rent outstanding', value: formatCurrency(totalDue) }
    ];
    const occupancyRate = tenants.length
        ? `${Math.round((tenants.filter((tenant) => tenant.status === 'active').length / tenants.length) * 100)}%`
        : '0%';
    const { months } = useMonthlyRevenue();
    return (_jsxs("section", { className: "space-y-6", children: [_jsx("h1", { children: "Analytics" }), _jsx(Card, { children: _jsx(KPIStats, { stats: stats }) }), _jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [_jsx(Card, { title: "Revenue Trend", children: months.length ? (_jsx(MonthlyRevenueChart, { data: months })) : (_jsx("p", { className: "text-sm text-gray-500", children: "Revenue history will appear here once payments are recorded." })) }), _jsx(Card, { title: "Occupancy", children: _jsx(OccupancyChart, { summary: occupancyRate }) })] })] }));
};
export default Analytics;
