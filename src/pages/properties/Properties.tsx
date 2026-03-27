import { FormEvent, useEffect, useMemo, useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { insertUnit } from '../../services/unitService';
import type { Unit } from '../../types/unit';
import useAuth from '../../hooks/useAuth';
import useTenants from '../../hooks/useTenants';
import useUnits from '../../hooks/useUnits';
import { useCurrency } from '../../context/currency';

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
      if (!tenant.unitId) {
        console.log('⚠️ Tenant has no unitId:', tenant.fullName);
        return;
      }

      const isActiveTenant = tenant.status === 'active' || tenant.status === 'late';
      if (!isActiveTenant) {
        console.log(`⚠️ Tenant ${tenant.fullName} is not active (status: ${tenant.status})`);
        return;
      }

      console.log(`✅ Counting tenant ${tenant.fullName} for unit ${tenant.unitId} (status: ${tenant.status})`);
      map.set(tenant.unitId, (map.get(tenant.unitId) ?? 0) + 1);
    });
    console.log('📊 Occupants by unit map:', Object.fromEntries(map));
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
      console.log('❌ occupancyState: No selected unit');
      return {
        occupied: 0,
        notOccupied: 0,
        houses: []
      };
    }

    const housesCount = selectedUnit.numberOfHouses ?? 1;
    const occupied = Math.min(occupantsByUnit.get(selectedUnit.id) ?? 0, housesCount);
    const notOccupied = Math.max(housesCount - occupied, 0);

    console.log('🏠 occupancyState calculated:', {
      housesCount,
      occupied,
      notOccupied,
      selectedUnitId: selectedUnit.id
    });

    const houses = Array.from({ length: housesCount }, (_, index) => ({
      id: `${selectedUnit.id}-house-${index + 1}`,
      number: index + 1,
      occupied: index < occupied
    }));

    console.log('🏠 Generated houses:', houses);

    return {
      occupied,
      notOccupied,
      houses
    };
  }, [selectedUnit, occupantsByUnit]);

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
      await insertUnit({
        unitNumber: form.unitNumber,
        rentAmount: parseFloat(form.rentAmount) || 0,
        numberOfHouses: form.numberOfHouses ? parseInt(form.numberOfHouses, 10) : undefined,
        status: form.status as 'vacant' | 'occupied' | 'maintenance',
        userId: user.id
      });
      await refresh('all');
      setStatusMessage('Unit created');
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
              {occupancyState.houses.map((house) => (
                <div
                  key={house.id}
                  className={`p-4 rounded-lg border-2 text-center font-medium ${
                    house.occupied
                      ? 'bg-green-100 border-green-300 text-green-800'
                      : 'bg-red-100 border-red-300 text-red-800'
                  }`}
                >
                  <p className="text-sm text-gray-700">House {house.number}</p>
                  <p className="text-lg font-semibold">{house.occupied ? 'Occupied' : 'Vacant'}</p>
                </div>
              ))}
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
            
          </>
        ) : (
          <p className="mt-2 text-sm text-gray-500">Select a vacant unit above to view its occupancy breakdown.</p>
        )}
      </section>
    </section>
  );
};

export default Properties;
