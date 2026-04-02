import { FormEvent, useEffect, useMemo, useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PaymentForm from '../../components/rent/PaymentForm';
import { insertUnit } from '../../services/unitService';
import { insertHouse } from '../../services/houseService';
import { insertTenant, insertRentSetting } from '../../services/tenantService';
import { insertPayment } from '../../services/paymentService';
import { fetchSubscriptionForUser, type SubscriptionRow } from '../../services/subscriptionService';
import useAuth from '../../hooks/useAuth';
import useArrears from '../../hooks/useArrears';
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

const tenantFormInitial = {
  fullName: '',
  phone: '',
  email: '',
  unitId: '',
  houseNumber: '',
  moveInDate: '',
  rentMode: '',
  defaultRent: ''
};

const planTitleMap: Record<'basic' | 'standard' | 'premium', string> = {
  basic: 'Basic Plan',
  standard: 'Standard Plan',
  premium: 'Premium Plan'
};

const Properties = () => {
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();
  const { tenants, refresh: refreshTenants } = useTenants();
  const { units, refresh } = useUnits('all', user?.id);
  const { arrears } = useArrears();
  const [form, setForm] = useState(initialState);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [tenantModal, setTenantModal] = useState<Tenant | null>(null);
  const [tenantFormData, setTenantFormData] = useState(tenantFormInitial);
  const [tenantFormUnitId, setTenantFormUnitId] = useState<string>('');
  const [tenantFormOpen, setTenantFormOpen] = useState(false);
  const [tenantFormStatus, setTenantFormStatus] = useState<string | null>(null);
  const [tenantFormLoading, setTenantFormLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [limitPopupOpen, setLimitPopupOpen] = useState(false);
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

  const availableTenantFormHouses = useMemo(() => {
    if (!tenantFormUnitId) return [];

    const selectedUnit = units.find((unit) => unit.id === tenantFormUnitId);
    if (!selectedUnit) return [];

    const totalHouses = selectedUnit.numberOfHouses ?? 1;
    const occupiedSet = occupiedHouseNumbersByUnit.get(tenantFormUnitId) ?? new Set<number>();

    return Array.from({ length: totalHouses }, (_, index) => index + 1)
      .filter((houseNumber) => !occupiedSet.has(houseNumber))
      .map((houseNumber) => ({
        id: `${tenantFormUnitId}-house-${houseNumber}`,
        number: houseNumber
      }));
  }, [tenantFormUnitId, units, occupiedHouseNumbersByUnit]);

  const handleHouseClick = (houseNumber: number) => {
    if (!tenantByHouseNumber.has(houseNumber)) {
      return;
    }
    setTenantModal(tenantByHouseNumber.get(houseNumber) ?? null);
  };

  const handleHouseCardClick = (houseNumber: number) => {
    if (tenantByHouseNumber.has(houseNumber)) {
      handleHouseClick(houseNumber);
      return;
    }

    openTenantFormForHouse(houseNumber);
  };

  const closeTenantModal = () => setTenantModal(null);

  const modalTenantArrears = useMemo(() => {
    if (!tenantModal?.id) {
      return [];
    }
    return arrears.filter((entry) => entry.tenantId === tenantModal.id);
  }, [arrears, tenantModal?.id]);

  const modalTenantArrearsTotal = useMemo(
    () => modalTenantArrears.reduce((sum, entry) => sum + entry.amountDue, 0),
    [modalTenantArrears]
  );

  const handleTenantFormChange = (field: keyof typeof tenantFormInitial, value: string) => {
    setTenantFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTenantFormUnitChange = (unitId: string) => {
    setTenantFormUnitId(unitId);
    const selectedUnit = units.find((unit) => unit.id === unitId);
    setTenantFormData((prev) => ({
      ...prev,
      unitId,
      houseNumber: '',
      defaultRent: selectedUnit ? String(selectedUnit.rentAmount || '') : ''
    }));
  };

  const handleTenantFormHouseChange = (houseNumber: string) => {
    setTenantFormData((prev) => ({
      ...prev,
      houseNumber
    }));
  };

  const openTenantFormForHouse = (houseNumber: number) => {
    if (!selectedUnit || !user) {
      return;
    }

    setTenantFormUnitId(selectedUnit.id);
    const defaultRentValue = selectedUnit ? String(selectedUnit.rentAmount || '') : '';
    setTenantFormData({
      ...tenantFormInitial,
      unitId: selectedUnit.id,
      houseNumber: String(houseNumber),
      defaultRent: defaultRentValue
    });
    setTenantFormStatus(null);
    setTenantFormOpen(true);
  };

  const closeTenantForm = () => {
    setTenantFormOpen(false);
    setTenantFormStatus(null);
  };

  const handleTenantFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      setTenantFormStatus('Sign in to add tenants.');
      return;
    }

    if (!tenantFormData.unitId || !tenantFormData.houseNumber) {
      setTenantFormStatus('Select a unit and house first.');
      return;
    }

    setTenantFormLoading(true);
    setTenantFormStatus(null);

    try {
      const createdTenant = await insertTenant({
        userId: user.id,
        unitId: tenantFormData.unitId,
        houseNumber: tenantFormData.houseNumber,
        fullName: tenantFormData.fullName,
        phone: tenantFormData.phone,
        email: tenantFormData.email,
        moveInDate: tenantFormData.moveInDate || undefined,
        status: 'active'
      });

      await insertRentSetting({
        userId: user.id,
        rentMode: tenantFormData.rentMode || 'monthly',
        defaultRent: parseFloat(tenantFormData.defaultRent) || 0
      });

      await refreshTenants();
      setTenantFormStatus('Successfully added a tenant.');
      setTenantFormData(tenantFormInitial);
      setTenantFormOpen(false);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : typeof error === 'string' ? error : 'Failed to create tenant.';
      setTenantFormStatus(message);
    } finally {
      setTenantFormLoading(false);
    }
  };

  const handleChange = (field: keyof typeof initialState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const planLimitReached = Boolean(
    subscription && subscription.max_apartments > 0 && units.length >= subscription.max_apartments
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      setStatusMessage('Sign in to create units.');
      return;
    }
    if (!subscription) {
      // No subscription loaded yet or none exists; show popup to prompt plan selection
      setLimitPopupOpen(true);
      return;
    }

    if (planLimitReached) {
      // Show a popup instead of a silent/fatal error, to mirror Airbnb/APT UX
      setLimitPopupOpen(true);
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
    if (!user?.id) {
      setSubscription(null);
      return;
    }

    setSubscriptionError(null);
    setSubscriptionLoading(true);
    fetchSubscriptionForUser(user.id)
      .then((data) => setSubscription(data ?? null))
      .catch(() => setSubscriptionError('Unable to load your subscription status.'))
      .finally(() => setSubscriptionLoading(false));
  }, [user?.id]);

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
          <h1>Properties</h1>
          <p>Register and monitor every unit across your portfolios.</p>
        </div>
        <Button type="button" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Hide Form' : 'Create Unit'}
        </Button>
      </div>

      {subscriptionLoading ? (
        <p className="text-sm text-gray-500">Checking your subscription…</p>
      ) : subscription ? (
        <p className="text-sm text-gray-500">
          Active plan: <strong>{planTitleMap[subscription.plan_name]}</strong> &ndash;{' '}
          {units.length}/{subscription.max_apartments} units registered.
        </p>
      ) : (
        <p className="text-sm text-yellow-600">
          No active plan found. Pick a plan to unlock unit creation.
        </p>
      )}
      {subscriptionError && <p className="text-sm text-red-600">{subscriptionError}</p>}

      {limitPopupOpen && (
        <Modal title="Unit limit reached">
          <p className="text-sm text-gray-600">You have reached the maximum units for your current plan.</p>
          {subscription && (
            <p className="text-sm text-gray-600 mt-2">
              Current plan: <strong>{planTitleMap[subscription.plan_name]}</strong> &ndash; Limit: {subscription.max_apartments} units
            </p>
          )}
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setLimitPopupOpen(false)}>Close</Button>
          </div>
        </Modal>
      )}

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
          {planLimitReached && (
            <p className="text-sm text-yellow-600">
              You have reached the {subscription ? planTitleMap[subscription.plan_name] : 'plan'} limit of{' '}
              {subscription?.max_apartments} units.
            </p>
          )}
          <Button
            type="submit"
            disabled={loading || planLimitReached || !subscription}
            className="md:col-span-2"
          >
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
                return (
                  <div
                    key={house.id}
                    className={`p-4 rounded-lg border-2 text-center font-medium ${
                      house.occupied
                        ? 'bg-green-100 border-green-300 text-green-800 cursor-pointer'
                        : 'bg-red-100 border-red-300 text-red-800 cursor-pointer'
                    }`}
                    onClick={() => handleHouseCardClick(house.number)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleHouseCardClick(house.number);
                      }
                    }}
                    role="button"
                    tabIndex={0}
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
                <div className="space-y-4">
                  {selectedUnit && (
                  <PaymentForm
                    tenants={[tenantModal]}
                    units={[selectedUnit]}
                    initialTenantId={tenantModal.id}
                    initialUnitId={selectedUnit.id}
                    clientInfo={{
                      fullName: tenantModal.fullName,
                        phone: tenantModal.phone ?? undefined,
                        email: tenantModal.email ?? undefined,
                        houseNumber: tenantModal.houseNumber ?? undefined,
                      unitNumber: selectedUnit.unitNumber
                    }}
                    apartmentOwnerId={user?.id}
                  />
                  )}
                  <div className="rounded-lg border border-dashed border-gray-200 bg-white p-3 text-sm text-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold text-gray-900">Tenant arrears</p>
                      <span className="text-sm text-gray-500">{formatCurrency(modalTenantArrearsTotal)}</span>
                    </div>
                    {modalTenantArrears.length > 0 ? (
                      <div className="space-y-3 text-sm text-gray-600">
                        {modalTenantArrears.map((entry) => (
                          <div key={entry.id} className="rounded border border-gray-100 px-3 py-2">
                            <p className="font-semibold text-gray-900">
                              {entry.tenantName ?? entry.tenantId}
                            </p>
                            <p className="text-xs text-gray-500">
                              {entry.monthsStayed
                                ? `${entry.monthsStayed} month${entry.monthsStayed === 1 ? '' : 's'} of tenancy`
                                : 'Lifetime summary'}
                            </p>
                            <p>
                              Total rent: {formatCurrency(entry.totalExpectedRent)} · Paid: {formatCurrency(entry.totalPaid)}
                            </p>
                            <p className="text-xs font-semibold text-gray-700">
                              {entry.status === 'paid'
                                ? 'Status: Paid'
                                : `Status: Owes ${formatCurrency(entry.amountDue)}`
                              }
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No outstanding balances.</p>
                    )}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button variant="ghost" type="button" onClick={closeTenantModal}>
                      Close
                    </Button>
                  </div>
                </div>
              </Modal>
            )}
            {tenantFormOpen && (
              <Modal title="Add tenant">
                <form className="tenant-form space-y-4" onSubmit={handleTenantFormSubmit}>
                  <Input
                    label="Full name"
                    name="fullName"
                    value={tenantFormData.fullName}
                    onChange={(event) => handleTenantFormChange('fullName', event.target.value)}
                    required
                  />
                  <label className="input-field">
                    <span>Unit</span>
                    <select
                      value={tenantFormUnitId}
                      onChange={(event) => handleTenantFormUnitChange(event.target.value)}
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
                    {availableTenantFormHouses.length > 0 ? (
                      <select
                        value={tenantFormData.houseNumber}
                        onChange={(event) => handleTenantFormHouseChange(event.target.value)}
                        className="w-full mb-4 p-3 border rounded-lg"
                        required
                      >
                        <option value="">Select a house</option>
                        {availableTenantFormHouses.map((house) => (
                          <option key={house.id} value={String(house.number)}>
                            House {house.number}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-gray-500">
                        {tenantFormUnitId
                          ? 'No available houses in this unit (all occupied or under maintenance).'
                          : 'Select a unit to choose from its available houses.'}
                      </p>
                    )}
                  </label>
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={tenantFormData.email}
                    onChange={(event) => handleTenantFormChange('email', event.target.value)}
                  />
                  <Input
                    label="Phone"
                    name="phone"
                    value={tenantFormData.phone}
                    onChange={(event) => handleTenantFormChange('phone', event.target.value)}
                  />
                  <Input
                    label="Move-in date"
                    name="moveInDate"
                    type="date"
                    value={tenantFormData.moveInDate}
                    onChange={(event) => handleTenantFormChange('moveInDate', event.target.value)}
                  />
                  <Input
                    label="Rent mode"
                    name="rentMode"
                    value={tenantFormData.rentMode}
                    onChange={(event) => handleTenantFormChange('rentMode', event.target.value)}
                    placeholder="e.g. monthly"
                  />
                  <Input
                    label="Default rent"
                    name="defaultRent"
                    type="number"
                    value={tenantFormData.defaultRent}
                    onChange={(event) => handleTenantFormChange('defaultRent', event.target.value)}
                  />
                  <Button type="submit" disabled={tenantFormLoading}>
                    {tenantFormLoading ? 'Saving…' : 'Create tenant'}
                  </Button>
                  {tenantFormStatus && <p>{tenantFormStatus}</p>}
                </form>
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" type="button" onClick={closeTenantForm}>
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
