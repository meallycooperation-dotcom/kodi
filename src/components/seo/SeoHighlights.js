import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency';
const SeoHighlights = ({ totalCollected, totalArrears, trackedTenants, latestMonth }) => {
    const monthLabel = latestMonth
        ? new Date(`${latestMonth}-01`).toLocaleString('default', { month: 'long', year: 'numeric' })
        : 'the latest period';
    return (_jsxs("section", { className: "seo-hero card", "aria-label": "Rent intelligence highlights", children: [_jsxs("div", { children: [_jsx("p", { className: "seo-hero__eyebrow", children: "Rent management intelligence" }), _jsx("h2", { children: "Control every tenant payment from one Kenyan-shilling native dashboard" }), _jsxs("p", { children: ["Kodi keeps tenant payments, overdue balances, and analytics in sync so you can see ", trackedTenants, ' ', "tracked residences, collect ", formatCurrency(totalCollected), " in the latest period, and monitor arrears in real time."] }), _jsxs("ul", { className: "seo-hero__list", children: [_jsx("li", { children: "Transparent tenant ledger that lists amounts due, amounts paid, and statuses for every unit." }), _jsx("li", { children: "Automated arrears tracking alerts you when tenants fall behind, backed by live rent fees." }), _jsx("li", { children: "Actionable analytics and reminders to close gaps between expected and collected rent each month." })] })] }), _jsxs("div", { className: "seo-hero__links", children: [_jsxs("p", { className: "text-sm text-gray-500", children: ["Freshest data updated for ", monthLabel] }), _jsx(Link, { to: "/rent-paid", className: "seo-hero__link", children: "Review tenant payments" }), _jsx(Link, { to: "/rent-arrears", className: "seo-hero__link", children: "Inspect overdue balances" }), _jsx(Link, { to: "/analytics", className: "seo-hero__link", children: "Deep dive into property analytics" })] })] }));
};
export default SeoHighlights;
