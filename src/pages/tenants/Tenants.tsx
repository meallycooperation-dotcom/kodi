import { useMemo, useState } from 'react';
import TenantTable from '../../components/tenants/TenantTable';
import useAuth from '../../hooks/useAuth';
import useTenants from '../../hooks/useTenants';
import useUnits from '../../hooks/useUnits';
import PageLoader from '../../components/ui/PageLoader';

const Tenants = () => {
  const { user } = useAuth();
  const { tenants, isLoading } = useTenants();
  const { units } = useUnits('all', user?.id);
  const [selectedUnitId, setSelectedUnitId] = useState<string | 'all'>('all');

  const filteredTenants = useMemo(
    () =>
      selectedUnitId === 'all'
        ? tenants
        : tenants.filter((tenant) => tenant.unitId === selectedUnitId),
    [tenants, selectedUnitId]
  );

  if (isLoading) {
    return <PageLoader message="Loading tenants data..." />;
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1>Tenants</h1>
          <p>Track tenant profiles and rent mode configurations.</p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-3">
          <label className="input-field">
            <span>Filter by Unit</span>
            <select
              value={selectedUnitId}
              onChange={(event) => setSelectedUnitId(event.target.value as string | 'all')}
              className="w-full md:w-48 p-2 border rounded-lg"
            >
              <option value="all">All Units</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  Unit {unit.unitNumber}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <TenantTable tenants={filteredTenants} units={units} />
    </section>
  );
};

export default Tenants;
