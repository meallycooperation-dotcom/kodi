import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
const SeoHighlights = ({ totalCollected, totalArrears, trackedTenants, latestMonth }) => {
    const monthLabel = latestMonth
        ? new Date(`${latestMonth}-01`).toLocaleString('default', { month: 'long', year: 'numeric' })
        : 'the latest period';
    return (_jsx("section", { className: "seo-hero card", "aria-label": "Rent intelligence highlights", children: _jsxs("div", { className: "seo-hero__links", children: [_jsxs("p", { className: "text-sm text-gray-500", children: ["Freshest data updated for ", monthLabel] }), _jsx(Link, { to: "/rent-paid", className: "seo-hero__link", children: "Review tenant payments" }), _jsx(Link, { to: "/rent-arrears", className: "seo-hero__link", children: "Inspect overdue balances" }), _jsx(Link, { to: "/analytics", className: "seo-hero__link", children: "Deep dive into property analytics" })] }) }));
};
export default SeoHighlights;
