import { jsx as _jsx } from "react/jsx-runtime";
import DashboardLayout from '../components/layout/DashboardLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import Analytics from '../pages/analytics/Analytics';
import Airbnb from '../pages/airbnb/Airbnb';
import Apartments from '../pages/apartments/Apartments';
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
import ConfirmEmailSent from '../pages/auth/ConfirmEmailSent';
import ForgotPassword from '../pages/auth/ForgotPassword';
import NewPassword from '../pages/auth/NewPassword';
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
    { path: '/airbnb', element: withLayout(_jsx(Airbnb, {})) },
    { path: '/apartments', element: withLayout(_jsx(Apartments, {})) },
    { path: '/auth/login', element: _jsx(Login, {}) },
    { path: '/auth/signup', element: _jsx(Signup, {}) },
    { path: '/auth/forgot-password', element: _jsx(ForgotPassword, {}) },
    { path: '/auth/new-password', element: _jsx(NewPassword, {}) },
    { path: '/auth/confirm-email', element: _jsx(ConfirmEmailSent, {}) },
    { path: '/signup', element: _jsx(Signup, {}) }
];
export default routes;
