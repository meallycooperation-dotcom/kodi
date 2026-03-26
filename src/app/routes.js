import { jsx as _jsx } from "react/jsx-runtime";
import DashboardLayout from '../components/layout/DashboardLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import Analytics from '../pages/analytics/Analytics';
import Dashboard from '../pages/dashboard/Dashboard';
import Notifications from '../pages/notifications/Notifications';
import Reminders from '../pages/reminders/Reminders';
import RentArrears from '../pages/rent-arrears/RentArrears';
import RentPaid from '../pages/rent-paid/RentPaid';
import Settings from '../pages/settings/Settings';
import Tenants from '../pages/tenants/Tenants';
import TenantDetails from '../pages/tenants/TenantDetails';
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import Properties from '../pages/properties/Properties';
const withLayout = (element) => (_jsx(ProtectedRoute, { children: _jsx(DashboardLayout, { children: element }) }));
const routes = [
    { path: '/', element: withLayout(_jsx(Dashboard, {})) },
    { path: '/dashboard', element: withLayout(_jsx(Dashboard, {})) },
    { path: '/rent-paid', element: withLayout(_jsx(RentPaid, {})) },
    { path: '/rent-arrears', element: withLayout(_jsx(RentArrears, {})) },
    { path: '/tenants', element: withLayout(_jsx(Tenants, {})) },
    { path: '/tenants/:tenantId', element: withLayout(_jsx(TenantDetails, {})) },
    { path: '/analytics', element: withLayout(_jsx(Analytics, {})) },
    { path: '/reminders', element: withLayout(_jsx(Reminders, {})) },
    { path: '/notifications', element: withLayout(_jsx(Notifications, {})) },
    { path: '/settings', element: withLayout(_jsx(Settings, {})) },
    { path: '/properties', element: withLayout(_jsx(Properties, {})) },
    { path: '/auth/login', element: _jsx(Login, {}) },
    { path: '/auth/signup', element: _jsx(Signup, {}) },
    { path: '/signup', element: _jsx(Signup, {}) }
];
export default routes;
