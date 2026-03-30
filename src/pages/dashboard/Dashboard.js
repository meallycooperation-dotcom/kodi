import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState, useCallback, useEffect } from 'react';
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
import useUnits from '../../hooks/useUnits';
import { useCurrency } from '../../context/currency';
import { fetchAirbnbListingsByCreator } from '../../services/airbnbService';
import { fetchAirbnbTenantsByListingIds } from '../../services/airbnbTenantService';
const metricCards = [
    { label: 'Total collected', key: 'totalCollected' },
    { label: 'Tenants paid', key: 'tenantsPaid' },
    { label: 'Overdues', key: 'overdues' },
    { label: 'Balance', key: 'balance' },
    { label: 'Airbnb earnings', key: 'airbnbEarnings' },
    { label: 'Reminders', key: 'reminders' },
    { label: 'Notifications', key: 'notifications' }
];
const isUnitTenant = (tenant) => 'unitId' in tenant && tenant.unitId != null;
const Dashboard = () => {
    const { formatCurrency } = useCurrency();
    const { user, loading: authLoading } = useAuth();
    const { tenants } = useTenants();
    const { units } = useUnits('all', user?.id);
    const { payments, totalCollected, loading: paymentsLoading } = usePayments();
    const { arrears, totalDue } = useArrears();
    const { reminders } = useReminders();
    const { notifications } = useNotifications();
    const { summary, loading: summaryLoading } = useDashboardSummary();
    const { months } = useMonthlyRevenue();
    const [selectedUnitId, setSelectedUnitId] = useState('all');
    const [airbnbTenants, setAirbnbTenants] = useState([]);
    const [loadingAirbnbData, setLoadingAirbnbData] = useState(false);
    const loadAirbnbData = useCallback(async () => {
        if (!user?.id) {
            setAirbnbTenants([]);
            return;
        }
        setLoadingAirbnbData(true);
        try {
            const listings = await fetchAirbnbListingsByCreator(user.id);
            const tenants = listings.length
                ? await fetchAirbnbTenantsByListingIds(listings.map((listing) => listing.id))
                : [];
            setAirbnbTenants(tenants);
        }
        catch (error) {
            console.error('loadAirbnbDashboard', error);
        }
        finally {
            setLoadingAirbnbData(false);
        }
    }, [user?.id]);
    useEffect(() => {
        loadAirbnbData();
    }, [loadAirbnbData]);
    const filteredTenants = useMemo(() => {
        if (selectedUnitId === 'all') {
            return tenants;
        }
        if (selectedUnitId === 'airbnb') {
            return airbnbTenants;
        }
        return tenants.filter((tenant) => tenant.unitId === selectedUnitId);
    }, [tenants, airbnbTenants, selectedUnitId]);
    const filteredUnitTenants = useMemo(() => filteredTenants.filter((tenant) => isUnitTenant(tenant)), [filteredTenants]);
    const filteredPayments = useMemo(() => selectedUnitId === 'all'
        ? payments
        : selectedUnitId === 'airbnb'
            ? []
            : payments.filter((payment) => payment.unitId === selectedUnitId), [payments, selectedUnitId]);
    const filteredArrears = useMemo(() => selectedUnitId === 'all'
        ? arrears
        : selectedUnitId === 'airbnb'
            ? []
            : arrears.filter((arrear) => arrear.unitId && arrear.unitId === selectedUnitId), [arrears, selectedUnitId]);
    const tenantCountsByUnit = useMemo(() => {
        const map = new Map();
        filteredUnitTenants.forEach((tenant) => {
            const unitId = tenant.unitId;
            if (!unitId) {
                return;
            }
            const isActiveTenant = tenant.status === 'active' || tenant.status === 'late';
            if (!isActiveTenant) {
                return;
            }
            map.set(unitId, (map.get(unitId) ?? 0) + 1);
        });
        return map;
    }, [filteredUnitTenants]);
    const totalOverdues = filteredArrears.length;
    const filteredTotalCollected = useMemo(() => {
        return filteredPayments.reduce((sum, payment) => sum + payment.amountPaid, 0);
    }, [filteredPayments]);
    const filteredTotalArrears = useMemo(() => {
        return filteredArrears.reduce((sum, arrear) => sum + arrear.amountDue, 0);
    }, [filteredArrears]);
    const filteredTenantsPaid = useMemo(() => {
        const paid = new Set();
        filteredPayments.forEach((payment) => {
            paid.add(payment.tenantId);
        });
        return paid.size;
    }, [filteredPayments]);
    const airbnbEarnings = useMemo(() => airbnbTenants.reduce((sum, tenant) => sum + (tenant.totalAmount ?? 0), 0), [airbnbTenants]);
    const airbnbEarningsDisplay = loadingAirbnbData ? 'Loading...' : formatCurrency(airbnbEarnings);
    const totalCollectedValue = filteredTotalCollected;
    const totalArrearsValue = filteredTotalArrears;
    const isLoading = authLoading || paymentsLoading || summaryLoading;
    const balance = totalCollectedValue - totalArrearsValue;
    const trackedTenants = useMemo(() => {
        if (selectedUnitId === 'airbnb') {
            return filteredTenants.filter((t) => t.status === 'checked_in').length;
        }
        return filteredTenants.filter((t) => t.status === 'active' || t.status === 'late').length;
    }, [filteredTenants, selectedUnitId]);
    const latestMonth = months[0]?.month;
    const summaryStats = [
        { label: 'Tracked tenants', value: `${trackedTenants}` },
        { label: 'Rent collected', value: formatCurrency(totalCollectedValue) },
        { label: 'Outstanding arrears', value: formatCurrency(totalArrearsValue) },
        { label: 'Airbnb earnings', value: airbnbEarningsDisplay }
    ];
    const displayUnits = selectedUnitId === 'all'
        ? units
        : selectedUnitId === 'airbnb'
            ? []
            : units.filter((u) => u.id === selectedUnitId);
    const { occupiedHouses, totalHouses } = useMemo(() => {
        let occupied = 0;
        let total = 0;
        displayUnits.forEach((unit) => {
            const houses = unit.numberOfHouses ?? 1;
            total += houses;
            occupied += Math.min(tenantCountsByUnit.get(unit.id) ?? 0, houses);
        });
        return { occupiedHouses: occupied, totalHouses: total };
    }, [tenantCountsByUnit, displayUnits]);
    const occupancyRate = totalHouses
        ? `${Math.round((occupiedHouses / totalHouses) * 100)}%`
        : '0%';
    const metrics = {
        totalCollected: formatCurrency(totalCollectedValue),
        tenantsPaid: `${filteredTenantsPaid}`,
        overdues: `${totalOverdues}`,
        balance: formatCurrency(balance),
        airbnbEarnings: airbnbEarningsDisplay,
        reminders: `${reminders.length}`,
        notifications: `${notifications.length}`
    };
    const metricsReady = !paymentsLoading && !summaryLoading;
    const skeletonBlock = (_jsx("span", { className: "inline-block h-6 w-20 animate-pulse rounded bg-gray-200", "aria-hidden": "true" }));
    return (_jsxs("section", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "sr-only", children: "Dashboard" }), isLoading ? (_jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-500", children: [_jsx("span", { className: "h-5 w-5 animate-spin rounded-full border-4 border-solid border-transparent border-t-blue-500", "aria-hidden": "true" }), _jsx("span", { children: "Loading dashboard data\u2026" })] })) : (_jsx("span", { className: "sr-only text-sm text-gray-500", children: "Dashboard data loaded" }))] }), _jsxs("label", { className: "input-field", children: [_jsx("span", { children: "Filter by Unit" }), _jsxs("select", { value: selectedUnitId, onChange: (e) => setSelectedUnitId(e.target.value), className: "w-full md:w-48 p-2 border rounded-lg", children: [_jsx("option", { value: "all", children: "All Units" }), _jsx("option", { value: "airbnb", children: "Airbnb listings" }), units.map((unit) => (_jsxs("option", { value: unit.id, children: ["Unit ", unit.unitNumber] }, unit.id)))] })] })] }), _jsx("div", { className: "grid gap-4 md:grid-cols-3 lg:grid-cols-6", children: metricCards.map((metric) => (_jsx(Card, { title: metric.label, children: _jsx("p", { className: "text-2xl font-semibold", children: metricsReady ? metrics[metric.key] : skeletonBlock }) }, metric.key))) }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [_jsx(Card, { title: "Calendar", children: _jsx(Calendar, {}) }), _jsx(Card, { title: "Totals", children: _jsx(KPIStats, { stats: summaryStats, loading: !metricsReady }) })] }), _jsxs("div", { className: "grid gap-6 xl:grid-cols-3", children: [_jsx(Card, { title: "Recent paid tenants", children: _jsx("ul", { className: "space-y-3", children: filteredPayments.slice(0, 3).map((payment) => (_jsxs("li", { children: [_jsx("strong", { children: payment.tenantName ?? payment.tenantId }), " \u00B7 ", formatCurrency(payment.amountPaid), " \u00B7", ' ', payment.monthPaidFor] }, payment.id))) }) }), _jsx(Card, { title: "Analytics (collected vs overdue)", className: "xl:col-span-2", children: _jsxs("div", { className: "space-y-4", children: [_jsx(RevenueChart, { summary: `Collected ${formatCurrency(totalCollectedValue)}` }), _jsx(OccupancyChart, { summary: `${occupancyRate} occupancy` }), _jsx(D3ComparisonChart, { data: [
                                        { label: 'Collected', value: totalCollectedValue },
                                        { label: 'Overdue', value: totalArrearsValue }
                                    ] }), months[0] && (_jsxs("p", { className: "text-sm text-gray-500", children: ["Latest month: ", months[0].month, " \u2013 collected ", formatCurrency(months[0].collected_revenue), " vs overdue", ' ', formatCurrency(months[0].total_arrears)] }))] }) })] })] }));
};
export default Dashboard;
