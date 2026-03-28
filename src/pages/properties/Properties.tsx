import { FormEvent, useEffect, useMemo, useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { insertUnit } from '../../services/unitService';
import { insertHouse } from '../../services/houseService';
import useAuth from '../../hooks/useAuth';
import useTenants from '../../hooks/useTenants';
import useUnits from '../../hooks/useUnits';
import Modal from '../../components/ui/Modal';
import { useCurrency } from '../../context/currency';
import type { Tenant } from '../../types/tenant';

const initialState = {
  unitNumber: '',
  rentAmount: '',
  numberOfHouses: '',
  status: 'vacant'
};

const Properties = () => {
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();
  const { tenants } = useTenants();
  const { units, refresh } = useUnits('all', user?.id);
  const [form, setForm] = useState(initialState);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [tenantModal, setTenantModal] = useState<Tenant | null>(null);
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en-KE', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
    []
  );

  const displayedUnits = units;

  const selectedUnit = selectedUnitId ? units.find((unit) => unit.id === selectedUnitId) : null;

  useEffect(() => {
    console.log('🔍 OCCUPANCY DEBUG - Initial Load:', {
      units: displayedUnits.map(u => ({ id: u.id, unitNumber: u.unitNumber, numberOfHouses: u.numberOfHouses })),
      tenantsCount: tenants.length,
      userId: user?.id
    });
  }, [displayedUnits, tenants, user?.id]);

  const occupantsByUnit = useMemo(() => {
    const map = new Map<string, number>();
    tenants.forEach((tenant) => {
      if (!tenant.unitId) return;
      const isActiveTenant = tenant.status === 'active' || tenant.status === 'late';
      if (!isActiveTenant) return;
      map.set(tenant.unitId, (map.get(tenant.unitId) ?? 0) + 1);
    });
    return map;
  }, [tenants]);

  const occupiedHouseNumbersByUnit = useMemo(() => {
    const map = new Map<string, Set<number>>();
    tenants.forEach((tenant) => {
      if (!tenant.unitId || !tenant.houseNumber) return;
      const isActiveTenant = tenant.status === 'active' || tenant.status === 'late';
      if (!isActiveTenant) return;

      const num = Number(tenant.houseNumber);
      if (Number.isNaN(num)) return;

      const set = map.get(tenant.unitId) ?? new Set<number>();
      set.add(num);
      map.set(tenant.unitId, set);
    });
    return map;
  }, [tenants]);

  useEffect(() => {
    if (!selectedUnit) {
      console.log('❌ No unit selected');
      return;
    }
    const tenantCount = occupantsByUnit.get(selectedUnit.id) ?? 0;
    const capacity = selectedUnit.numberOfHouses ?? 1;
    console.log('🏘️ Selected unit details:', {
      unitNumber: selectedUnit.unitNumber,
      unitId: selectedUnit.id,
      tenantCount,
      capacity,
      occupancyPercentage: Math.round((tenantCount / capacity) * 100) + '%'
    });
    if (tenantCount > capacity) {
      console.error(
        `❌ Occupancy mismatch for unit ${selectedUnit.unitNumber || selectedUnit.id}: ${tenantCount} tenants for ${capacity} houses`
      );
    } else {
      console.log(
        `✅ Occupancy OK for unit ${selectedUnit.unitNumber || selectedUnit.id}: ${tenantCount}/${capacity} occupied`
      );
    }
  }, [selectedUnit, occupantsByUnit]);

  const occupancyState = useMemo(() => {
    if (!selectedUnit) {
      return {
        occupied: 0,
        notOccupied: 0,
        houses: []
      };
    }

    const housesCount = selectedUnit.numberOfHouses ?? 1;
    const occupiedHouseSet = occupiedHouseNumbersByUnit.get(selectedUnit.id) ?? new Set<number>();

    const houses = Array.from({ length: housesCount }, (_, index) => {
      const number = index + 1;
      const occupied = occupiedHouseSet.has(number);
      return {
        id: `${selectedUnit.id}-house-${number}`,
        number,
        occupied
      };
    });

    const occupied = houses.filter((h) => h.occupied).length;
    const notOccupied = housesCount - occupied;

    return {
      occupied,
      notOccupied,
      houses
    };
  }, [selectedUnit, occupiedHouseNumbersByUnit]);

  const tenantByHouseNumber = useMemo(() => {
    if (!selectedUnitId) {
      return new Map<number, Tenant>();
    }

    const map = new Map<number, Tenant>();
    tenants.forEach((tenant) => {
      if (tenant.unitId !== selectedUnitId || !tenant.houseNumber) {
        return;
      }

      const houseNum = Number(tenant.houseNumber);
      if (Number.isNaN(houseNum)) {
        return;
      }

      map.set(houseNum, tenant);
    });

    return map;
  }, [tenants, selectedUnitId]);

  const handleHouseClick = (houseNumber: number) => {
    if (!tenantByHouseNumber.has(houseNumber)) {
      return;
    }
    setTenantModal(tenantByHouseNumber.get(houseNumber) ?? null);
  };

  const closeTenantModal = () => setTenantModal(null);

  const handleChange = (field: keyof typeof initialState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      setStatusMessage('Sign in to create units.');
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const createdUnit = await insertUnit({
        unitNumber: form.unitNumber,
        rentAmount: parseFloat(form.rentAmount) || 0,
        numberOfHouses: form.numberOfHouses ? parseInt(form.numberOfHouses, 10) : undefined,
        status: form.status as 'vacant' | 'occupied' | 'maintenance',
        userId: user.id
      });

      const housesToCreate = Math.max(1, parseInt(form.numberOfHouses || '1', 10));
      await Promise.all(
        Array.from({ length: housesToCreate }, (_, index) =>
          insertHouse({
            unitId: createdUnit.id,
            houseNumber: String(index + 1),
            status: form.status as 'vacant' | 'occupied' | 'maintenance'
          })
        )
      );

      await refresh('all');
      setStatusMessage('Unit created and houses seeded.');
      setForm(initialState);
      setSelectedUnitId(null);
    } catch (error) {
      console.error(error);
      setStatusMessage('Failed to create unit');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedUnitId && displayedUnits.length > 0) {
      console.log('🎯 Auto-selecting first unit:', displayedUnits[0]);
      setSelectedUnitId(displayedUnits[0].id);
    }
  }, [displayedUnits, selectedUnitId]);

  useEffect(() => {
    setTenantModal(null);
  }, [selectedUnitId]);

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1>Propertiess</h1>
          <p>Register and monitor every unit across your portfolios.</p>
        </div>
        <Button type="button" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Hide Form' : 'Create Unit'}
        </Button>
      </div>

      {showForm && (
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Input
            label="Unit number"
            name="unitNumber"
            value={form.unitNumber}
            onChange={(event) => handleChange('unitNumber', event.target.value)}
          />
          <Input
            label="Rent amount"
            name="rentAmount"
            type="number"
            value={form.rentAmount}
            onChange={(event) => handleChange('rentAmount', event.target.value)}
          />
          <Input
            label="Number of houses"
            name="numberOfHouses"
            type="number"
            value={form.numberOfHouses}
            onChange={(event) => handleChange('numberOfHouses', event.target.value)}
          />
          <label className="input-field">
            <span>Status</span>
            <select value={form.status} onChange={(event) => handleChange('status', event.target.value)}>
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </label>
          <Button type="submit" disabled={loading} className="md:col-span-2">
            {loading ? 'Saving…' : 'Create unit'}
          </Button>
        </form>
      )}
      {statusMessage && <p>{statusMessage}</p>}

      <section className="mt-6">
        <h2 className="font-semibold text-lg">Units</h2>
        {displayedUnits.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {displayedUnits.map((unit) => (
              <li
                key={unit.id}
                className={`unit-card border p-3 rounded-lg transition-shadow ${
                  selectedUnitId === unit.id ? 'unit-card--selected' : ''
                }`}
                onClick={() => setSelectedUnitId(unit.id)}
              >
                <p className="font-medium">{unit.unitNumber || 'Unit'}</p>
                <p>Rent: {formatCurrency(unit.rentAmount)}</p>
                <p>Status: {unit.status}</p>
                <p>Houses: {unit.numberOfHouses ?? 1}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-gray-600">No vacant units found.</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-semibold text-lg">Occupancy grid</h2>
        <p className="text-sm text-gray-500">
          Click any unit above to release the occupancy grid: green means houses occupied, red means houses still
          available.
        </p>
        {selectedUnit ? (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {occupancyState.houses.map((house) => {
              const occupant = tenantByHouseNumber.get(house.number);
              return (
                <div
                  key={house.id}
                  className={`p-4 rounded-lg border-2 text-center font-medium ${
                    house.occupied
                      ? 'bg-green-100 border-green-300 text-green-800 cursor-pointer'
                      : 'bg-red-100 border-red-300 text-red-800'
                  }`}
                  onClick={() => occupant && handleHouseClick(house.number)}
                  onKeyDown={(event) => {
                    if (!occupant) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleHouseClick(house.number);
                    }
                  }}
                  role={occupant ? 'button' : 'presentation'}
                  tabIndex={occupant ? 0 : undefined}
                >
                  <p className="text-sm text-gray-700">House {house.number}</p>
                  <p className="text-lg font-semibold">{house.occupied ? 'Occupied' : 'Vacant'}</p>
                </div>
              );
            })}
            </div>
            <div className="status-grid">
              <article className="status-card status-card--occupied">
                <p className="status-card__label">Occupied houses</p>
                <p className="status-card__value">{occupancyState.occupied}</p>
                <p className="status-card__meta">Currently collecting rent for this unit</p>
              </article>
              <article className="status-card status-card--unoccupied">
                <p className="status-card__label">Not occupied houses</p>
                <p className="status-card__value">{occupancyState.notOccupied}</p>
                <p className="status-card__meta">Needs tenants or in maintenance</p>
              </article>
            </div>
            {tenantModal && (
              <Modal title={`Tenant in house ${tenantModal.houseNumber ?? ''}`}>
                <p className="text-sm text-gray-600">
                  <strong>Name:</strong> {tenantModal.fullName}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Phone:</strong> {tenantModal.phone ?? 'Not provided'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> {tenantModal.email ?? 'Not provided'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Move-in date:</strong>{' '}
                  {tenantModal.moveInDate ? dateFormatter.format(new Date(tenantModal.moveInDate)) : 'TBD'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Status:</strong> {tenantModal.status}
                </p>
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" type="button" onClick={closeTenantModal}>
                    Close
                  </Button>
                </div>
              </Modal>
            )}
            
          </>
        ) : (
          <p className="mt-2 text-sm text-gray-500">Select a vacant unit above to view its occupancy breakdown.</p>
        )}
      </section>
    </section>
  );
};

export default Properties;
