import type { Tenant } from '../../types/tenant';

type TenantCardProps = {
  tenant: Tenant;
};

const TenantCard = ({ tenant }: TenantCardProps) => (
  <article className="tenant-card">
    <h2>{tenant.fullName}</h2>
    <p>
      <strong>Unit:</strong> {tenant.unitId ?? '—'}
    </p>
    <p>
      <strong>House:</strong> {tenant.houseNumber ?? '—'}
    </p>
    <p>
      <strong>Contact:</strong> {tenant.phone ?? 'n/a'} · {tenant.email ?? 'n/a'}
    </p>
    <p>
      <strong>Move-in:</strong> {tenant.moveInDate ?? '—'}
    </p>
    <p>
      <strong>Status:</strong> {tenant.status}
    </p>
  </article>
);

export default TenantCard;
