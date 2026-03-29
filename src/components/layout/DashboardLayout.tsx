import type { ReactNode } from 'react';
import Sidebar from './Sidebar';

type DashboardLayoutProps = {
  children: ReactNode;
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => (
  <div className="layout-grid">
    <Sidebar />
    <div className="layout-main">
      <main>{children}</main>
    </div>
  </div>
);

export default DashboardLayout;
