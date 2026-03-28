import type { ReactElement } from 'react';
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

export type AppRoute = {
  path: string;
  element: ReactElement;
};

const withLayout = (element: ReactElement) => (
  <ProtectedRoute>
    <DashboardLayout>{element}</DashboardLayout>
  </ProtectedRoute>
);

const routes: AppRoute[] = [
  { path: '/', element: withLayout(<Dashboard />) },
  { path: '/dashboard', element: withLayout(<Dashboard />) },
  { path: '/rent-paid', element: withLayout(<RentPaid />) },
  { path: '/rent-arrears', element: withLayout(<RentArrears />) },
  { path: '/tenants', element: withLayout(<Tenants />) },
  { path: '/tenants/:tenantId', element: withLayout(<TenantDetails />) },
  { path: '/analytics', element: withLayout(<Analytics />) },
  { path: '/reminders', element: withLayout(<Reminders />) },
  { path: '/notifications', element: withLayout(<Notifications />) },
  { path: '/settings', element: withLayout(<Settings />) },
  { path: '/properties', element: withLayout(<Properties />) },
  { path: '/airbnb', element: withLayout(<Airbnb />) },
  { path: '/apartments', element: withLayout(<Apartments />) },
  { path: '/auth/login', element: <Login /> },
  { path: '/auth/signup', element: <Signup /> },
  { path: '/auth/forgot-password', element: <ForgotPassword /> },
  { path: '/auth/new-password', element: <NewPassword /> },
  { path: '/auth/confirm-email', element: <ConfirmEmailSent /> },
  { path: '/signup', element: <Signup /> }
];

export default routes;
