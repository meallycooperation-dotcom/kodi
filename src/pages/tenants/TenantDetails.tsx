import TenantCard from '../../components/tenants/TenantCard';

const TenantDetails = () => (
  <section className="space-y-4">
    <h1>Tenant Details</h1>
    <TenantCard tenant={{} as any} />
  </section>
);

export default TenantDetails;

