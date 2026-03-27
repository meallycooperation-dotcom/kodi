import Table from '../ui/Table';
import type { Tenant } from '../../types/tenant';
import type { Unit } from '../../types/unit';

type TenantTableProps = {
  tenants: Tenant[];
  units?: Unit[];
};

const TenantTable = ({ tenants, units = [] }: TenantTableProps) => {
  const unitMap = new Map(units.map((unit) => [unit.id, unit.unitNumber]));

  return (
    <Table headers={['Name', 'Unit', 'House', 'Status', 'Move-in', 'Phone']}>
      {tenants.map((tenant) => (
        <tr key={tenant.id}>
          <td>{tenant.fullName}</td>
          <td>{tenant.unitId ? unitMap.get(tenant.unitId) ?? tenant.unitId : '—'}</td>
          <td>{tenant.houseNumber ?? '—'}</td>
          <td>{tenant.status}</td>
          <td>{tenant.moveInDate ?? '—'}</td>
          <td>{tenant.phone ?? '—'}</td>
        </tr>
      ))}
    </Table>
  );
};

export default TenantTable;
