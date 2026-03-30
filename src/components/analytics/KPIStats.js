import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const defaultStats = [
    { label: 'Occupancy', value: '92%' },
    { label: 'Collection rate', value: '98%' },
    { label: 'Avg. rent', value: 'Ksh. 1,150' }
];
const KPIStats = ({ stats = defaultStats, loading = false }) => (_jsx("div", { className: "kpi-grid", children: stats.map((stat) => (_jsxs("article", { className: "kpi-item", children: [_jsx("p", { className: "kpi-value", children: loading ? (_jsx("span", { className: "inline-block h-6 w-24 animate-pulse rounded bg-gray-200", "aria-hidden": "true" })) : (stat.value) }), _jsx("small", { children: stat.label })] }, stat.label))) }));
export default KPIStats;
