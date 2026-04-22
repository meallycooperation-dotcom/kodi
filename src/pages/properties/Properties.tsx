import { FormEvent, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import * as XLSX from 'xlsx';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PaymentForm from '../../components/rent/PaymentForm';
import { insertUnit, deleteUnit } from '../../services/unitService';
import { insertHouse } from '../../services/houseService';
import { deleteTenant, insertTenant, insertRentSetting } from '../../services/tenantService';
import { insertPayment } from '../../services/paymentService';
import { fetchSubscriptionForUser, type SubscriptionRow } from '../../services/subscriptionService';
import useAuth from '../../hooks/useAuth';
import useArrears from '../../hooks/useArrears';
import useTenants from '../../hooks/useTenants';
import useUnits from '../../hooks/useUnits';
import Modal from '../../components/ui/Modal';
import { useCurrency } from '../../context/currency';
import { RefreshCw, Trash2 } from 'lucide-react';
import type { Tenant } from '../../types/tenant';
import type { Unit } from '../../types/unit';

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
  defaultRent: '',
  previousArrears: ''
};

type UnitImportFeedback = {
  kind: 'success' | 'error';
  message: string;
};

type UnitImportRow = {
  fullName: string;
  phone?: string;
  email?: string;
  houseNumber?: string;
  moveInDate?: string;
  previousArrears?: number;
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
  const [localUnits, setLocalUnits] = useState<Unit[]>([]);
  const [refreshingUnits, setRefreshingUnits] = useState(false);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);
  const [tenantModal, setTenantModal] = useState<Tenant | null>(null);
  const [tenantFormData, setTenantFormData] = useState(tenantFormInitial);
  const [tenantFormUnitId, setTenantFormUnitId] = useState<string>('');
  const [tenantFormOpen, setTenantFormOpen] = useState(false);
  const [tenantFormStatus, setTenantFormStatus] = useState<string | null>(null);
  const [tenantFormLoading, setTenantFormLoading] = useState(false);
  const [tenantModalRemoving, setTenantModalRemoving] = useState(false);
  const [tenantModalStatus, setTenantModalStatus] = useState<string | null>(null);
  const [confirmRemovalOpen, setConfirmRemovalOpen] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importFeedback, setImportFeedback] = useState<UnitImportFeedback | null>(null);
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

  const displayedUnits = localUnits;

  const selectedUnit = selectedUnitId ? units.find((unit) => unit.id === selectedUnitId) : null;

  useEffect(() => {
    setLocalUnits(units);
  }, [units]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

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
      return;
    }
    const tenantCount = occupantsByUnit.get(selectedUnit.id) ?? 0;
    const capacity = selectedUnit.numberOfHouses ?? 1;
    if (tenantCount > capacity) {
      console.error(
        `❌ Occupancy mismatch for unit ${selectedUnit.unitNumber || selectedUnit.id}: ${tenantCount} tenants for ${capacity} houses`
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

  const closeTenantModal = () => {
    setTenantModal(null);
    setTenantModalStatus(null);
    setTenantModalRemoving(false);
  };

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

  useEffect(() => {
    setTenantModalStatus(null);
  }, [tenantModal?.id]);

  const executeRemoveTenant = async () => {
    if (!tenantModal) {
      return;
    }

    setTenantModalRemoving(true);
    setTenantModalStatus(null);

    try {
      await deleteTenant(tenantModal.id);
      await refreshTenants();
      setTenantModal(null);
      setStatusMessage(
        `${tenantModal.fullName || 'Tenant'} removed from unit ${selectedUnit?.unitNumber ?? ''}.`
      );
    } catch (error) {
      console.error('remove tenant failed', error);
      const message =
        error instanceof Error ? error.message : 'Failed to remove tenant. Try again.';
      setTenantModalStatus(message);
    } finally {
      setTenantModalRemoving(false);
      setConfirmRemovalOpen(false);
    }
  };

  const promptRemoveTenant = () => {
    if (!tenantModal) {
      return;
    }
    setConfirmRemovalOpen(true);
  };

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

  const normalizeText = (value: unknown) =>
    String(value ?? '')
      .trim()
      .toLowerCase();

  const normalizeHouseNumber = (value: unknown) => {
    const text = String(value ?? '').trim();
    const digits = text.match(/\d+/g)?.join('');
    return digits ? Number(digits) : Number.NaN;
  };

  const pickRowValue = (row: Record<string, unknown>, keys: string[]) => {
    const normalizedEntries = Object.entries(row).map(([key, value]) => [normalizeText(key), value] as const);
    for (const key of keys) {
      const match = normalizedEntries.find(([entryKey]) => entryKey === normalizeText(key));
      if (match && match[1] !== undefined && match[1] !== null && String(match[1]).trim() !== '') {
        return String(match[1]).trim();
      }
    }
    return '';
  };

  const parseImportFile = async (file: File): Promise<UnitImportRow[]> => {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('The Excel file does not contain any sheets.');
    }

    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

    return rows
      .map((row): UnitImportRow | null => {
        const fullName = pickRowValue(row, ['full_name', 'full name', 'name']);
        if (!fullName) {
          return null;
        }

        const arrearsValue = pickRowValue(row, ['previous_arrears', 'previous arrears', 'arrears']);
        const parsedArrears = arrearsValue ? Number(arrearsValue) : 0;

        return {
          fullName,
          phone: pickRowValue(row, ['phone', 'phone_number', 'phone number']),
          email: pickRowValue(row, ['email']),
          houseNumber: pickRowValue(row, ['house_number', 'house number', 'house']),
          moveInDate: pickRowValue(row, ['move_in_date', 'move in date', 'move-in-date']),
          previousArrears: Number.isFinite(parsedArrears) ? parsedArrears : 0
        };
      })
      .filter((row): row is UnitImportRow => row !== null);
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportLoading(false);
    setImportProgress(0);
    setImportFeedback(null);
  };

  const handleImportFileDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setImportFile(event.dataTransfer.files?.[0] ?? null);
  };

  const handleImportTenants = async () => {
    if (!user) {
      setImportFeedback({ kind: 'error', message: 'Sign in first to import tenants.' });
      return;
    }

    if (!selectedUnit) {
      setImportFeedback({ kind: 'error', message: 'Select a unit before importing.' });
      return;
    }

    if (!importFile) {
      setImportFeedback({ kind: 'error', message: 'Choose an Excel file first.' });
      return;
    }

    setImportLoading(true);
    setImportProgress(0);
    setImportFeedback(null);

    try {
      const parsedRows = await parseImportFile(importFile);
      if (parsedRows.length === 0) {
        throw new Error('No tenant rows were found in the first sheet.');
      }

      setImportProgress(10);

      const totalHouses = selectedUnit.numberOfHouses ?? 1;
      const occupiedSet = occupiedHouseNumbersByUnit.get(selectedUnit.id) ?? new Set<number>();
      const availableHouses = Array.from({ length: totalHouses }, (_, index) => index + 1).filter(
        (houseNumber) => !occupiedSet.has(houseNumber)
      );

      if (availableHouses.length === 0) {
        throw new Error('No vacant houses are available in this unit.');
      }

      const assignedHouseNumbers = new Set<number>();
      const tenantsToInsert: Array<{
        userId: string;
        unitId: string;
        houseNumber: string;
        fullName: string;
        phone?: string;
        email?: string;
        moveInDate?: string;
        arrears?: number;
        status: 'active';
      }> = [];
      const skippedRows: string[] = [];
      let nextAvailableIndex = 0;

      const takeNextAvailableHouse = () => {
        while (
          nextAvailableIndex < availableHouses.length &&
          assignedHouseNumbers.has(availableHouses[nextAvailableIndex])
        ) {
          nextAvailableIndex += 1;
        }

        const houseNumber = availableHouses[nextAvailableIndex];
        if (!houseNumber) {
          return null;
        }

        assignedHouseNumbers.add(houseNumber);
        nextAvailableIndex += 1;
        return houseNumber;
      };

      const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

      for (let index = 0; index < parsedRows.length; index += 1) {
        const row = parsedRows[index];
        const requestedHouseNumber = row.houseNumber ? normalizeHouseNumber(row.houseNumber) : Number.NaN;
        const targetHouseNumber = Number.isNaN(requestedHouseNumber)
          ? takeNextAvailableHouse()
          : availableHouses.includes(requestedHouseNumber) && !assignedHouseNumbers.has(requestedHouseNumber)
            ? requestedHouseNumber
            : null;

        if (!targetHouseNumber) {
          skippedRows.push(`Row ${index + 2}: no matching vacant house was found.`);
        } else {
          assignedHouseNumbers.add(targetHouseNumber);
          tenantsToInsert.push({
            userId: user.id,
            unitId: selectedUnit.id,
            houseNumber: String(targetHouseNumber),
            fullName: row.fullName,
            phone: row.phone || undefined,
            email: row.email || undefined,
            moveInDate: row.moveInDate || undefined,
            arrears: row.previousArrears ?? 0,
            status: 'active'
          });
        }

        const progressBase = 10;
        const progressSpan = 70;
        const rowProgress = progressBase + Math.round(((index + 1) / parsedRows.length) * progressSpan);
        setImportProgress(Math.min(80, rowProgress));

        if ((index + 1) % 5 === 0) {
          await pause();
        }
      }

      if (tenantsToInsert.length === 0) {
        throw new Error('No valid tenants were found to import.');
      }

      setImportProgress(85);

      for (let index = 0; index < tenantsToInsert.length; index += 1) {
        const tenant = tenantsToInsert[index];
        await insertTenant(tenant);
        const progress = 85 + Math.round(((index + 1) / tenantsToInsert.length) * 10);
        setImportProgress(Math.min(95, progress));
      }

      await Promise.all([refreshTenants(), refresh('all')]);
      setImportProgress(100);
      setImportFile(null);
      setImportFeedback({
        kind: 'success',
        message:
          skippedRows.length > 0
            ? `Imported ${tenantsToInsert.length} tenant(s). ${skippedRows.length} row(s) were skipped.`
            : `Imported ${tenantsToInsert.length} tenant(s) successfully.`
      });
    } catch (error) {
      setImportProgress(0);
      setImportFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Import failed.'
      });
    } finally {
      setImportLoading(false);
    }
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
      const parsedArrears = parseFloat(tenantFormData.previousArrears);
      const arrears = Number.isNaN(parsedArrears) ? 0 : parsedArrears;
      const email = tenantFormData.email.trim();

      await insertTenant({
        userId: user.id,
        unitId: tenantFormData.unitId,
        houseNumber: tenantFormData.houseNumber,
        fullName: tenantFormData.fullName,
        phone: tenantFormData.phone,
        email: email || undefined,
        moveInDate: tenantFormData.moveInDate || undefined,
        arrears,
        status: 'active'
      });

      await insertRentSetting({
        userId: user.id,
        rentMode: tenantFormData.rentMode || 'monthly',
        defaultRent: parseFloat(tenantFormData.defaultRent) || 0
      });

      setTenantFormStatus('Successfully added a tenant.');
      setTenantFormData(tenantFormInitial);
      setTenantFormOpen(false);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : typeof error === 'string' ? error : 'Failed to create tenant.';
      setTenantFormStatus(message);
      return;
    } finally {
      setTenantFormLoading(false);
    }

    try {
      await refreshTenants();
    } catch (error) {
      console.error('refreshTenants', error);
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

    const tempUnitId =
      globalThis.crypto?.randomUUID?.() ?? `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const rentAmountValue = parseFloat(form.rentAmount) || 0;
    const housesValue = form.numberOfHouses ? parseInt(form.numberOfHouses, 10) : undefined;
    const optimisticUnit: Unit = {
      id: tempUnitId,
      propertyId: null,
      unitNumber: form.unitNumber,
      rentAmount: rentAmountValue,
      numberOfHouses: housesValue,
      status: form.status as Unit['status'],
      userId: user.id,
      createdAt: new Date().toISOString()
    };
    setLocalUnits((prev) => [optimisticUnit, ...prev]);

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
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      refreshTimeoutRef.current = setTimeout(() => {
        refresh('all');
      }, 2500);
      setStatusMessage('Unit created and houses seeded.');
      setForm(initialState);
      setSelectedUnitId(null);
    } catch (error) {
      setLocalUnits((prev) => prev.filter((unit) => unit.id !== tempUnitId));
      console.error(error);
      setStatusMessage('Successfully created unit');
    } finally {
      setLoading(false);
    }
  };
 
  const handleManualRefresh = async () => {
    if (refreshingUnits) {
      return;
    }
    setRefreshingUnits(true);
    try {
      await Promise.all([refresh('all'), refreshTenants()]);
    } catch (error) {
      console.error('manual refresh failed', error);
    } finally {
      setRefreshingUnits(false);
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (deletingUnitId) {
      return;
    }
    setDeletingUnitId(unitId);
    const previousUnits = [...localUnits];
    setLocalUnits((prev) => prev.filter((unit) => unit.id !== unitId));
    try {
      await deleteUnit(unitId);
      await refresh('all');
    } catch (error) {
      console.error('delete unit failed', error);
      setLocalUnits(previousUnits);
    } finally {
      setDeletingUnitId(null);
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshingUnits}
            aria-label="Refresh units"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-gray-300 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={18} className={refreshingUnits ? 'animate-spin' : ''} aria-hidden="true" />
          </button>
          <Button type="button" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Hide Form' : 'Create Unit'}
          </Button>
        </div>
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
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{unit.unitNumber || 'Unit'}</p>
                    <p>Rent: {formatCurrency(unit.rentAmount)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteUnit(unit.id);
                    }}
                    disabled={deletingUnitId === unit.id}
                    aria-label="Delete unit"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent bg-red-50 text-red-600 transition hover:border-red-200 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-lg">Occupancy grid</h2>
            <p className="text-sm text-gray-500">
              Click any unit above to release the occupancy grid: green means houses occupied, red means houses still
              available.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            onClick={() => setShowImportModal(true)}
            disabled={!selectedUnit}
            className="px-4 py-2 text-sm shadow-md"
          >
            Import tenants
          </Button>
        </div>
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
            {showImportModal && (
              <Modal title={`Import tenants to ${selectedUnit.unitNumber || 'unit'}`}>
                <div className="space-y-4">
                  <div className="grid gap-3">
                    <label
                      htmlFor="unit-import-input"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={handleImportFileDrop}
                      className="grid min-h-[420px] cursor-pointer place-items-center rounded-xl border border-dashed border-gray-200 bg-gray-50/70 p-4 text-center transition hover:border-blue-400 hover:bg-blue-50/60"
                    >
                      <div className="grid gap-4 place-items-center">
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-500">
                          Tap/drag to add file
                        </p>
                        <img
                          src="/images/excel%20properties%20excel%20type.jpg"
                          alt="Excel properties file type example"
                          className="max-h-[340px] w-full max-w-[980px] object-contain"
                        />
                      </div>
                    </label>
                    <input
                      id="unit-import-input"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
                    />
                    <p className="text-xs text-gray-500">
                      {importFile ? `Selected: ${importFile.name}` : 'No file selected yet.'}
                    </p>
                  </div>
                  {importFeedback && (
                    <p className={`text-sm ${importFeedback.kind === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                      {importFeedback.message}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={closeImportModal} disabled={importLoading}>
                      Close
                    </Button>
                    <Button type="button" onClick={handleImportTenants} disabled={importLoading}>
                      {importLoading ? 'Importing...' : 'Import'}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Import progress</span>
                      <span>{importProgress}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-300 ease-out"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Modal>
            )}
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
                  {tenantModalStatus && (
                    <p className="text-sm text-red-600">{tenantModalStatus}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between gap-3">
                      <Button
                        variant="ghost"
                        type="button"
                        className="border-red-100 text-red-600 hover:bg-red-50 disabled:text-red-400 disabled:border-red-200"
                        onClick={promptRemoveTenant}
                        disabled={tenantModalRemoving}
                      >
                      {tenantModalRemoving ? 'Removing…' : 'Remove tenant'}
                    </Button>
                    <Button variant="ghost" type="button" onClick={closeTenantModal}>
                      Close
                    </Button>
                  </div>
                </div>
            </Modal>
          )}
          {confirmRemovalOpen && (
            <Modal title="Remove tenant">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Are you sure you want to mark this tenant as inactive? The house will be freed for new occupants.
                </p>
                <div className="flex items-center justify-end gap-3">
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => setConfirmRemovalOpen(false)}
                    className="px-3 py-2 text-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="px-3 py-2 text-sm border-red-100 text-red-600 hover:bg-red-50"
                    onClick={executeRemoveTenant}
                    disabled={tenantModalRemoving}
                  >
                    {tenantModalRemoving ? 'Removing…' : 'Confirm removal'}
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
                    label="Email (optional)"
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
                  <Input
                    label="Previous arrears"
                    name="previousArrears"
                    type="number"
                    min="0"
                    step="0.01"
                    value={tenantFormData.previousArrears}
                    onChange={(event) => handleTenantFormChange('previousArrears', event.target.value)}
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
