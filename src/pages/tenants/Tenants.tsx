import { FormEvent, useEffect, useMemo, useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import TenantTable from '../../components/tenants/TenantTable';
import useAuth from '../../hooks/useAuth';
import useTenants from '../../hooks/useTenants';
import useUnits from '../../hooks/useUnits';
import { insertRentSetting, insertTenant } from '../../services/tenantService';
import { insertPayment, paymentExistsForMonth } from '../../services/paymentService';

const initialForm = {
  fullName: '',
  phone: '',
  email: '',
  unitId: '',
  houseNumber: '',
  moveInDate: '',
  rentMode: '',
  defaultRent: ''
};

const Tenants = () => {
  const { user } = useAuth();
  const { tenants, refresh } = useTenants();
  const { units } = useUnits('all', user?.id);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | 'all'>('all');
  const [selectedFormUnitId, setSelectedFormUnitId] = useState<string>('');

  const occupiedHouseNumbersByUnit = useMemo(() => {
    const map = new Map<string, Set<number>>();
    tenants.forEach((tenant) => {
      if (!tenant.unitId || !tenant.houseNumber) return;
      const isActiveTenant = tenant.status === 'active' || tenant.status === 'late';
      if (!isActiveTenant) return;

      const houseNum = Number(tenant.houseNumber);
      if (Number.isNaN(houseNum)) return;

      const set = map.get(tenant.unitId) ?? new Set<number>();
      set.add(houseNum);
      map.set(tenant.unitId, set);
    });
    return map;
  }, [tenants]);

  const availableHouses = useMemo(() => {
    if (!selectedFormUnitId) return [];
    const selectedUnit = units.find((u) => u.id === selectedFormUnitId);
    if (!selectedUnit) return [];

    const totalHouses = selectedUnit.numberOfHouses || 0;
    const occupiedSet = occupiedHouseNumbersByUnit.get(selectedFormUnitId) ?? new Set<number>();

    return Array.from({ length: totalHouses }, (_, index) => index + 1)
      .filter((houseNumber) => !occupiedSet.has(houseNumber))
      .map((houseNumber) => ({
        id: `${selectedFormUnitId}-house-${houseNumber}`,
        number: houseNumber
      }));
  }, [selectedFormUnitId, units, occupiedHouseNumbersByUnit]);

  const filteredTenants = useMemo(
    () =>
      selectedUnitId === 'all'
        ? tenants
        : tenants.filter((tenant) => tenant.unitId === selectedUnitId),
    [tenants, selectedUnitId]
  );

  const handleChange = (field: keyof typeof initialForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUnitChange = (unitId: string) => {
    setSelectedFormUnitId(unitId);
    const selectedUnit = units.find((unit) => unit.id === unitId);

    setForm((prev) => ({
      ...prev,
      unitId,
      houseNumber: '',
      defaultRent: selectedUnit ? String(selectedUnit.rentAmount || '') : ''
    }));
  };

  const handleHouseChange = (houseNumber: string) => {
    const selectedUnit = units.find((unit) => unit.id === selectedFormUnitId);
    setForm((prev) => ({
      ...prev,
      houseNumber,
      unitId: selectedFormUnitId,
      defaultRent: selectedUnit ? String(selectedUnit.rentAmount || '') : ''
    }));
  };

  useEffect(() => {
    if (!selectedFormUnitId && units.length > 0) {
      const initialUnit = units[0];
      setSelectedFormUnitId(initialUnit.id);
      setForm((prev) => ({
        ...prev,
        unitId: initialUnit.id,
        houseNumber: '',
        defaultRent: String(initialUnit.rentAmount || '')
      }));
    }
  }, [units, selectedFormUnitId]);

  useEffect(() => {
    if (selectedFormUnitId && !form.houseNumber && availableHouses.length > 0) {
      setForm((prev) => ({
        ...prev,
        houseNumber: String(availableHouses[0].number)
      }));
    }
  }, [selectedFormUnitId, form.houseNumber, availableHouses]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      setStatus('Sign in to create tenants.');
      return;
    }

    setLoading(true);
    setStatus(null);

    if (!form.houseNumber) {
      setStatus('Select a house number first.');
      setLoading(false);
      return;
    }

    try {
      const createdTenant = await insertTenant({
        userId: user.id,
        unitId: form.unitId,
        houseNumber: form.houseNumber,
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        moveInDate: form.moveInDate || undefined,
        status: 'active'
      });

      // Ensure arrears are tracked for new tenant if no payment exists for current month
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const paymentExists = await paymentExistsForMonth(createdTenant.id, currentMonth);
      if (!paymentExists) {
        const today = new Date().toISOString().split('T')[0];
        await insertPayment({
          tenantId: createdTenant.id,
          unitId: createdTenant.unitId || '',
          amountPaid: 0,
          paymentDate: today,
          monthPaidFor: currentMonth,
          paymentMethod: 'system',
          reference: 'Auto-generated due amount for new tenant'
        });
      }

      await insertRentSetting({
        userId: user.id,
        rentMode: form.rentMode || 'monthly',
        defaultRent: parseFloat(form.defaultRent) || 0
      });

      await refresh();

      setStatus('Tenant and rent settings saved.');
      setForm(initialForm);
    } catch (error) {
      console.error(error);
      setStatus('Failed to create record.');
    } finally {
      setLoading(false);
    }
  };

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
              onChange={(e) => setSelectedUnitId(e.target.value as string | 'all')}
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
          <Button type="button" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Hide Form' : 'Create Tenant'}
          </Button>
        </div>
      </div>

      {showForm && (
        <form className="tenant-form space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Full name"
          name="fullName"
          value={form.fullName}
          onChange={(event) => handleChange('fullName', event.target.value)}
        />
        <label className="input-field">
          <span>Unit</span>
          <select
            value={selectedFormUnitId}
            onChange={(event) => handleUnitChange(event.target.value)}
            className="w-full mb-4 p-3 border rounded-lg"
            required
          >
            <option value="">Select a unit</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {`Unit ${unit.unitNumber}`}
              </option>
            ))}
          </select>
        </label>
        <label className="input-field">
          <span>House</span>
          {availableHouses.length > 0 ? (
            <select
              value={form.houseNumber}
              onChange={(event) => handleHouseChange(event.target.value)}
              className="w-full mb-4 p-3 border rounded-lg"
              required
            >
              <option value="">Select a house</option>
              {availableHouses.map((house) => (
                <option key={house.id} value={String(house.number)}>
                  House {house.number}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-gray-500">
              {selectedFormUnitId
                ? 'No available houses in this unit (all occupied or under maintenance).'
                : 'Select a unit to first choose from its available houses.'}
            </p>
          )}
        </label>
        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={(event) => handleChange('email', event.target.value)}
        />
        <Input
          label="Phone"
          name="phone"
          value={form.phone}
          onChange={(event) => handleChange('phone', event.target.value)}
        />
        <Input
          label="Move-in date"
          name="moveInDate"
          type="date"
          value={form.moveInDate}
          onChange={(event) => handleChange('moveInDate', event.target.value)}
        />
        <Input
          label="Rent mode"
          name="rentMode"
          value={form.rentMode}
          onChange={(event) => handleChange('rentMode', event.target.value)}
          placeholder="e.g. monthly"
        />
        <Input
          label="Default rent"
          name="defaultRent"
          type="number"
          value={form.defaultRent}
          onChange={(event) => handleChange('defaultRent', event.target.value)}
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Create tenant'}
        </Button>
        {status && <p>{status}</p>}
      </form>
      )}

      <TenantTable tenants={filteredTenants} units={units} />
    </section>
  );
};

export default Tenants;
