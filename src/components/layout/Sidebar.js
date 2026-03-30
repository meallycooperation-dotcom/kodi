import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from 'react-router-dom';
const sections = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Rent Paid', to: '/rent-paid' },
    { label: 'Arrears', to: '/rent-arrears' },
    { label: 'Tenants', to: '/tenants' },
    { label: 'Properties', to: '/properties' },
    { label: 'Airbnb', to: '/airbnb' },
    { label: 'Apartments', to: '/apartments' },
    { label: 'Analytics', to: '/analytics' },
    { label: 'Reminders', to: '/reminders' },
    { label: 'Notifications', to: '/notifications' },
    { label: 'Settings', to: '/settings' }
];
const Sidebar = () => (_jsxs("aside", { className: "sidebar", children: [_jsx("h2", { className: "logo", children: "Kodi" }), _jsx("nav", { children: sections.map((item) => (_jsx(NavLink, { to: item.to, children: item.label }, item.to))) })] }));
export default Sidebar;
