import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Card from '../../components/ui/Card';
import KPIStats from '../../components/analytics/KPIStats';
import OccupancyChart from '../../components/analytics/OccupancyChart';
import RevenueChart from '../../components/analytics/RevenueChart';
import D3ComparisonChart from '../../components/analytics/D3ComparisonChart';
import Calendar from '../../components/ui/Calendar';
import useAuth from '../../hooks/useAuth';
import useArrears from '../../hooks/useArrears';
import useDashboardSummary from '../../hooks/useDashboardSummary';
import useMonthlyRevenue from '../../hooks/useMonthlyRevenue';
import useNotifications from '../../hooks/useNotifications';
import usePayments from '../../hooks/usePayments';
import useReminders from '../../hooks/useReminders';
import useTenants from '../../hooks/useTenants';
import { formatCurrency } from '../../utils/formatCurrency';
import SeoHighlights from '../../components/seo/SeoHighlights';
const metricCards = [
    { label: 'Total collected', key: 'totalCollected' },
    { label: 'Tenants paid', key: 'tenantsPaid' },
    { label: 'Overdues', key: 'overdues' },
    { label: 'Balance', key: 'balance' },
    { label: 'Reminders', key: 'reminders' },
    { label: 'Notifications', key: 'notifications' }
];
const Dashboard = () => {
    const { user, loading: authLoading } = useAuth();
    const { tenants } = useTenants(user?.id);
    const { payments, totalCollected, tenantsPaidCount, loading: paymentsLoading } = usePayments();
    const { arrears, totalDue } = useArrears();
    const { reminders } = useReminders();
    const { notifications } = useNotifications();
    const { summary, loading: summaryLoading } = useDashboardSummary();
    const { months } = useMonthlyRevenue();
    const totalOverdues = arrears.length;
    const totalCollectedValue = summary?.total_collected ?? totalCollected;
    const totalArrearsValue = summary?.total_arrears ?? totalDue;
    const isLoading = authLoading || paymentsLoading || summaryLoading;
    const balance = totalCollectedValue - totalArrearsValue;
    const trackedTenants = summary?.total_tenants ?? tenants.length;
    const latestMonth = months[0]?.month;
    const summaryStats = [
        { label: 'Tracked tenants', value: `${trackedTenants}` },
        { label: 'Rent collected', value: formatCurrency(totalCollectedValue) },
        { label: 'Outstanding arrears', value: formatCurrency(totalArrearsValue) }
    ];
    const occupancyRate = tenants.length
        ? `${Math.round((tenants.filter((tenant) => tenant.status === 'active').length / tenants.length) * 100)}%`
        : '0%';
    const metrics = {
        totalCollected: formatCurrency(totalCollectedValue),
        tenantsPaid: `${tenantsPaidCount}`,
        overdues: `${totalOverdues}`,
        balance: formatCurrency(balance),
        reminders: `${reminders.length}`,
        notifications: `${notifications.length}`
    };
    const metricsReady = !paymentsLoading && !summaryLoading;
    const skeletonBlock = (_jsx("span", { className: "inline-block h-6 w-20 animate-pulse rounded bg-gray-200", "aria-hidden": "true" }));
    return (_jsxs("section", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("h1", { children: "Dashboard" }), isLoading && _jsx("span", { className: "text-sm text-gray-500", children: "Refreshing data..." })] }), _jsx(SeoHighlights, { totalCollected: totalCollectedValue, totalArrears: totalArrearsValue, trackedTenants: trackedTenants, latestMonth: latestMonth }), _jsx("div", { className: "grid gap-4 md:grid-cols-3 lg:grid-cols-6", children: metricCards.map((metric) => (_jsx(Card, { title: metric.label, children: _jsx("p", { className: "text-2xl font-semibold", children: metricsReady ? metrics[metric.key] : skeletonBlock }) }, metric.key))) }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [_jsx(Card, { title: "Calendar", children: _jsx(Calendar, {}) }), _jsx(Card, { title: "Totals", children: _jsx(KPIStats, { stats: summaryStats, loading: !metricsReady }) })] }), _jsxs("div", { className: "grid gap-6 xl:grid-cols-3", children: [_jsx(Card, { title: "Recent paid tenants", children: _jsx("ul", { className: "space-y-3", children: payments.slice(0, 3).map((payment) => (_jsxs("li", { children: [_jsx("strong", { children: payment.tenantName ?? payment.tenantId }), " \u00B7 ", formatCurrency(payment.amountPaid), " \u00B7", ' ', payment.monthPaidFor] }, payment.id))) }) }), _jsx(Card, { title: "Analytics (collected vs overdue)", className: "xl:col-span-2", children: _jsxs("div", { className: "space-y-4", children: [_jsx(RevenueChart, { summary: `Collected ${formatCurrency(totalCollectedValue)}` }), _jsx(OccupancyChart, { summary: `${occupancyRate} occupancy` }), _jsx(D3ComparisonChart, { data: [
                                        { label: 'Collected', value: totalCollectedValue },
                                        { label: 'Overdue', value: totalArrearsValue }
                                    ] }), months[0] && (_jsxs("p", { className: "text-sm text-gray-500", children: ["Latest month: ", months[0].month, " \u2013 collected ", formatCurrency(months[0].collected_revenue), " vs overdue", ' ', formatCurrency(months[0].total_arrears)] }))] }) })] })] }));
};
export default Dashboard;
