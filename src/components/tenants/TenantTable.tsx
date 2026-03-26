import Table from '../ui/Table';
import type { Tenant } from '../../types/tenant';

type TenantTableProps = {
  tenants: Tenant[];
};

const TenantTable = ({ tenants }: TenantTableProps) => (
  <Table headers={['Name', 'Unit', 'Status', 'Move-in', 'Phone']}>
    {tenants.map((tenant) => (
      <tr key={tenant.id}>
        <td>{tenant.fullName}</td>
        <td>{tenant.unitId ?? '—'}</td>
        <td>{tenant.status}</td>
        <td>{tenant.moveInDate ?? '—'}</td>
        <td>{tenant.phone ?? '—'}</td>
      </tr>
    ))}
  </Table>
);

export default TenantTable;
