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
  { label: 'Plan', to: '/plan' },
  { label: 'Settings', to: '/settings' }
];

const Sidebar = () => (
  <aside className="sidebar">
    <h2 className="logo">Kodi</h2>
    <nav>
      {sections.map((item) => (
        <NavLink key={item.to} to={item.to}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  </aside>
);

export default Sidebar;
