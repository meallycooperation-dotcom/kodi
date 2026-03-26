import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

type DashboardLayoutProps = {
  children: ReactNode;
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => (
  <div className="layout-grid">
    <Sidebar />
    <div className="layout-main">
      <Topbar />
      <main>{children}</main>
    </div>
  </div>
);

export default DashboardLayout;
