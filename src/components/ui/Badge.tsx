import type { ReactNode } from 'react';

type BadgeProps = {
  children: ReactNode;
  status?: 'success' | 'warning' | 'pending';
};

const Badge = ({ children, status = 'pending' }: BadgeProps) => (
  <span className={`badge badge--${status}`}>{children}</span>
);

export default Badge;

