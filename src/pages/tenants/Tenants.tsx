import { FormEvent, useMemo, useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import TenantCard from '../../components/tenants/TenantCard';
import TenantTable from '../../components/tenants/TenantTable';
import useAuth from '../../hooks/useAuth';
import useRentSettings from '../../hooks/useRentSettings';
import useTenants from '../../hooks/useTenants';
import useUnits from '../../hooks/useUnits';
import { insertRentSetting, insertTenant } from '../../services/tenantService';
import type { Unit } from '../../types/unit';

const initialForm = {
  fullName: '',
  phone: '',
  email: '',
  unitId: '',
  moveInDate: '',
  rentMode: '',
  defaultRent: ''
};

const Tenants = () => {
  const { user } = useAuth();
  const { tenants, refresh } = useTenants();
  const { settings } = useRentSettings(user?.id);
  const { units } = useUnits('all', user?.id);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | 'all'>('all');

  const filteredTenants = useMemo(
    () =>
      selectedUnitId === 'all'
        ? tenants
        : tenants.filter((tenant) => tenant.unitId === selectedUnitId),
    [tenants, selectedUnitId]
  );

  const featuredTenant = filteredTenants[0];

  const handleChange = (field: keyof typeof initialForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUnitChange = (unitId: string) => {
    const selectedUnit = units.find((unit) => unit.id === unitId);
    setForm((prev) => ({
      ...prev,
      unitId,
      defaultRent: selectedUnit ? String(selectedUnit.rentAmount) : ''
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      setStatus('Sign in to create tenants.');
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      await insertTenant({
        userId: user.id,
        unitId: form.unitId,
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        moveInDate: form.moveInDate || undefined,
        status: 'active'
      });

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
            value={form.unitId}
            onChange={(event) => handleUnitChange(event.target.value)}
            className="w-full mb-4 p-3 border rounded-lg"
            required
          >
            <option value="">Select a unit</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.unitNumber || unit.id}
              </option>
            ))}
          </select>
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

      {featuredTenant && <TenantCard tenant={featuredTenant} />}
      {settings.length > 0 && (
        <div className="card">
          <h2>Rent settings</h2>
          <ul className="space-y-2">
            {settings.map((setting) => (
              <li key={setting.id}>
                <strong>{setting.rent_mode}</strong> · default {setting.default_rent.toLocaleString()} · created{' '}
                {new Date(setting.created_at).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      )}
      <TenantTable tenants={filteredTenants} units={units} />
    </section>
  );
};

export default Tenants;
