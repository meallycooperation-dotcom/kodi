import { FormEvent, useCallback, useEffect, useMemo, useState, type DragEvent } from 'react';
import * as XLSX from 'xlsx';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import PaymentForm from '../../components/rent/PaymentForm';
import useAuth from '../../hooks/useAuth';
import useArrears from '../../hooks/useArrears';
import { supabase } from '../../lib/supabaseClient';
import {
  fetchApartmentArrearsView,
  fetchApartmentPaidView,
  ApartmentPaidViewRecord,
  ApartmentArrearsViewRecord
} from '../../services/paymentService';
import { useCurrency } from '../../context/currency';
import { fetchSubscriptionForUser, type SubscriptionRow } from '../../services/subscriptionService';
import useApartmentTenantTracker from '../../hooks/useApartmentTenantTracker';
import { isUuid } from '../../utils/uuid';
import { deactivateApartmentTenant } from '../../services/tenantService';
import type { Tenant } from '../../types/tenant';
import type { Unit } from '../../types/unit';
// Removed duplicateTenant/Unit type imports to fix redeclaration
// Plan title mapping for apartments (shared naming with other pages)
const planTitleMapApartments: Record<'basic' | 'standard' | 'premium', string> = {
  basic: 'Basic Plan',
  standard: 'Standard Plan',
  premium: 'Premium Plan'
};

type ApartmentImportFeedback = {
  kind: 'success' | 'error';
  message: string;
};

type ApartmentImportRow = {
  houseNumber?: string;
  fullName: string;
  phoneNumber?: string;
  idNumber?: string;
  moveInDate?: string;
  arrears?: number;
};

export default function ApartmentManager() {
  const { user } = useAuth();
  const userId = user?.id;
  const { formatCurrency } = useCurrency();
  const { arrears } = useArrears();
  const { tenantRecords } = useApartmentTenantTracker();

  const formatBlockPrice = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) {
      return '';
    }
    const amount = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(amount)) {
      return String(value);
    }
    return formatCurrency(amount);
  };

  const normalizeCell = (value: unknown) => String(value ?? '').trim().toLowerCase();

  const normalizeHouseKey = (value: unknown) =>
    String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

  const pickRowValue = (row: Record<string, unknown>, keys: string[]) => {
    const normalizedEntries = Object.entries(row).map(([key, value]) => [normalizeCell(key), value] as const);
    for (const key of keys) {
      const normalizedKey = normalizeCell(key);
      const match = normalizedEntries.find(([rowKey]) => rowKey === normalizedKey);
      if (match && match[1] !== undefined && match[1] !== null && String(match[1]).trim() !== '') {
        return String(match[1]).trim();
      }
    }
    return '';
  };

  const parseImportFile = async (file: File): Promise<ApartmentImportRow[]> => {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('The Excel file does not contain any sheets.');
    }

    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

    return rows
      .map((row): ApartmentImportRow | null => {
        const fullName = pickRowValue(row, ['full_name', 'full name', 'name']);
        if (!fullName) {
          return null;
        }

        const arrearsValue = pickRowValue(row, ['arrears']);
        const parsedArrears = arrearsValue ? Number(arrearsValue) : 0;

        return {
          houseNumber: pickRowValue(row, ['house_number', 'house number', 'house no', 'house']),
          fullName,
          phoneNumber: pickRowValue(row, ['phone_number', 'phone number', 'phone']),
          idNumber: pickRowValue(row, ['id_number', 'id number', 'id']),
          moveInDate: pickRowValue(row, ['move_in_date', 'move in date', 'move-in-date']),
          arrears: Number.isFinite(parsedArrears) ? parsedArrears : 0
        } as ApartmentImportRow;
      })
      .filter((row): row is ApartmentImportRow => row !== null);
  };

  const [apartments, setApartments] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);

  const [selectedApartment, setSelectedApartment] = useState<any | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<any | null>(null);

  const [apartmentName, setApartmentName] = useState('');
  const [apartmentLocation, setApartmentLocation] = useState('');
  const [blockName, setBlockName] = useState('');
  const [blockBedrooms, setBlockBedrooms] = useState('');
  const [blockPrice, setBlockPrice] = useState('');
  const [houseCount, setHouseCount] = useState('');
  const [showApartmentForm, setShowApartmentForm] = useState(false);
  // planMaxApartmentsReached is defined later after subscription is available to avoid TDZ
  const [limitPopupOpen, setLimitPopupOpen] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [showHouseForm, setShowHouseForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importFeedback, setImportFeedback] = useState<ApartmentImportFeedback | null>(null);
  const [houseModal, setHouseModal] = useState<{
    house: any;
    tenant: any | null;
  } | null>(null);
  const [tenantModalStatus, setTenantModalStatus] = useState<string | null>(null);
  const [tenantModalRemoving, setTenantModalRemoving] = useState(false);
  const [tenantFullName, setTenantFullName] = useState('');
  const [confirmRemovalOpen, setConfirmRemovalOpen] = useState(false);
  const [tenantPhoneNumber, setTenantPhoneNumber] = useState('');
  const [tenantIdNumber, setTenantIdNumber] = useState('');
  const [tenantMoveInDate, setTenantMoveInDate] = useState('');
  const [tenantArrears, setTenantArrears] = useState('');
  const [tenantLoading, setTenantLoading] = useState(false);
  const [houseModalLoading, setHouseModalLoading] = useState(false);
  const [apartmentHouses, setApartmentHouses] = useState<any[]>([]);
  const [paidViewRecords, setPaidViewRecords] = useState<ApartmentPaidViewRecord[]>([]);
  const [arrearsViewRecords, setArrearsViewRecords] = useState<ApartmentArrearsViewRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const apartmentTenantIds = useMemo(
    () => tenantRecords.map((record) => record.id).filter(isUuid),
    [tenantRecords]
  );

  const fetchApartments = async () => {
    if (!userId) {
      return;
    }

    const { data } = await supabase
      .from('apartments')
      .select('*')
      .eq('creator_id', userId);
    setApartments(data || []);
  };

  const fetchBlocks = async (apartmentId: string) => {
    const { data } = await supabase
      .from('blocks')
      .select('*')
      .eq('apartment_id', apartmentId);
    const blockData = data || [];
    setBlocks(blockData);
    setApartmentHouses([]);
    const blockIds = blockData.map((block) => block.id);
    await fetchApartmentHouses(blockIds);
  };

  const fetchHouses = async (blockId: string) => {
    const { data } = await supabase
      .from('houses')
      .select('*')
      .eq('block_id', blockId);
    const ordered = (data || []).slice().sort((a, b) =>
      String(a.house_number).localeCompare(String(b.house_number))
    );
    setHouses(ordered);
  };

  const fetchApartmentHouses = async (blockIds: string[]) => {
    if (blockIds.length === 0) {
      setApartmentHouses([]);
      return;
    }

    const { data } = await supabase
      .from('houses')
      .select('*, apartment_tenants(*)')
      .in('block_id', blockIds);

    const ordered = (data || []).slice().sort((a, b) =>
      String(a.house_number).localeCompare(String(b.house_number))
    );
    const sanitized = ordered.map((house) => ({
      ...house,
      apartment_tenants: (() => {
        const rawTenants = house.apartment_tenants;
        const tenants = Array.isArray(rawTenants)
          ? rawTenants
          : rawTenants
            ? [rawTenants]
            : [];
        return tenants.filter((tenant: any) => tenant.status === 'active');
      })()
    }));
    setApartmentHouses(sanitized);
  };

  const loadApartmentViews = useCallback(async () => {
    setIsLoading(true);
    if (!userId) {
      setPaidViewRecords([]);
      setArrearsViewRecords([]);
      setIsLoading(false);
      return;
    }

    try {
      const [paid, arrears] = await Promise.all([
        fetchApartmentPaidView(userId),
        fetchApartmentArrearsView(apartmentTenantIds)
      ]);

      setPaidViewRecords(paid);
      setArrearsViewRecords(arrears);
    } finally {
      setIsLoading(false);
    }
  }, [userId, apartmentTenantIds]);

  // planPanel and limit logic will be defined after subscription is loaded to avoid TDZ

  useEffect(() => {
    loadApartmentViews();
  }, [loadApartmentViews]);

  // Render plan panel helper (deferred until subscription is initialized)
  const renderPlanPanel = () => {
    if (subscriptionLoading) {
      return (
        <Card>
          <p className="text-sm text-gray-600">Loading plan details…</p>
        </Card>
      );
    }
    if (!subscription) {
      return null;
    }
    return (
      <Card>
        <p className="text-sm text-gray-600">
          Current plan: <strong>{planTitleMapApartments[subscription.plan_name]}</strong> &ndash; {apartments.length}/
          {subscription.max_apartments} apartments used
          {subscription.max_apartments - apartments.length > 0 ? (
            <span> &ndash; {subscription.max_apartments - apartments.length} remaining</span>
          ) : (
            <span> &ndash; Limit reached</span>
          )}
        </p>
      </Card>
    );
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handler = () => {
      loadApartmentViews();
    };
    window.addEventListener('apartment-payment-recorded', handler);
    return () => {
      window.removeEventListener('apartment-payment-recorded', handler);
    };
  }, [loadApartmentViews]);

  useEffect(() => {
    if (userId) {
      fetchApartments();
    }
  }, [userId]);

  // Load subscription status for the current user to enforce per-plan limits on apartments
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setSubscription(null);
      return;
    }
    setSubscriptionError(null);
    setSubscriptionLoading(true);
    fetchSubscriptionForUser(userId)
      .then((data) => setSubscription(data ?? null))
      .catch(() => setSubscriptionError('Unable to load your subscription status.'))
      .finally(() => setSubscriptionLoading(false));
  }, [userId]);

  // Plan panel helpers (declared after subscription is in scope to avoid TDZ)
  const planMaxApartmentsReached = Boolean(
    subscription && subscription.max_apartments > 0 && apartments.length >= subscription.max_apartments
  );
  // planPanel removed in favor of renderPlanPanel function

  const createApartment = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) {
      return;
    }
    // Require a subscription to create apartments
    if (!subscription) {
      setLimitPopupOpen(true);
      return;
    }

    await supabase.from('apartments').insert({
      name: apartmentName,
      creator_id: userId,
      location: apartmentLocation
    });

    setApartmentName('');
    setApartmentLocation('');
    setShowApartmentForm(false);
    fetchApartments();
  };

  const createBlock = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedApartment?.id) {
      return;
    }

    const bedrooms = parseInt(blockBedrooms, 10);
    const price = parseFloat(blockPrice);
    const payload: Record<string, any> = {
      apartment_id: selectedApartment.id,
      block_name: blockName
    };

    if (!Number.isNaN(bedrooms)) {
      payload.bedrooms = bedrooms;
    }

    if (!Number.isNaN(price)) {
      payload.price = price;
    }

    await supabase.from('blocks').insert(payload);

    setBlockName('');
    setBlockBedrooms('');
    setBlockPrice('');
    setShowBlockForm(false);
    fetchBlocks(selectedApartment.id);
  };

  const createHouses = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedBlock?.id) {
      return;
    }

    const count = parseInt(houseCount, 10);
    if (Number.isNaN(count) || count <= 0) {
      return;
    }

    const baseName = selectedBlock.block_name || 'B';
    const newHouses = Array.from({ length: count }).map((_, i) => ({
      block_id: selectedBlock.id,
      house_number: `${baseName}${i + 1}`
    }));

    await supabase.from('houses').insert(newHouses);
    setHouseCount('');
    setShowHouseForm(false);
    await fetchHouses(selectedBlock.id);
    const blockIds = blocks.map((block) => block.id);
    await fetchApartmentHouses(blockIds);
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
    const droppedFile = event.dataTransfer.files?.[0] ?? null;
    setImportFile(droppedFile);
  };

  const handleImportTenants = async () => {
    if (!selectedBlock?.id) {
      setImportFeedback({ kind: 'error', message: 'Pick a block before importing tenants.' });
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

      const { data: houseRows, error: houseError } = await supabase
        .from('houses')
        .select('*')
        .eq('block_id', selectedBlock.id);

      if (houseError) {
        throw houseError;
      }

      const availableHouses = (houseRows ?? [])
        .slice()
        .sort((a, b) => String(a.house_number).localeCompare(String(b.house_number)))
        .filter((house) => (house.status ?? 'vacant') === 'vacant');

      setImportProgress(20);

      const houseLookup = new Map<string, any>();
      availableHouses.forEach((house) => {
        const normalizedHouseNumber = normalizeHouseKey(house.house_number);
        if (normalizedHouseNumber) {
          houseLookup.set(normalizedHouseNumber, house);
        }
      });

      const resolveHouseNumber = (houseNumber: string) => {
        const normalizedHouseNumber = normalizeHouseKey(houseNumber);
        if (!normalizedHouseNumber) {
          return null;
        }

        const exactMatch = houseLookup.get(normalizedHouseNumber);
        if (exactMatch) {
          return exactMatch;
        }

        const blockPrefix = normalizeHouseKey(selectedBlock.block_name);
        if (blockPrefix) {
          const prefixedMatch = houseLookup.get(`${blockPrefix}${normalizedHouseNumber}`);
          if (prefixedMatch) {
            return prefixedMatch;
          }
        }

        const suffixMatch = availableHouses.find((house) => {
          const normalizedCandidate = normalizeHouseKey(house.house_number);
          return (
            normalizedCandidate === normalizedHouseNumber ||
            normalizedCandidate.endsWith(normalizedHouseNumber) ||
            normalizedHouseNumber.endsWith(normalizedCandidate)
          );
        });

        return suffixMatch ?? null;
      };
      const assignedHouseIds = new Set<string>();
      const tenantsToInsert: Array<{
        house_id: string;
        full_name: string;
        phone_number: string | null;
        id_number: string | null;
        move_in_date: string | null;
        arrears: number;
        user_id: string | null;
      }> = [];
      const skippedRows: string[] = [];

      let nextAvailableIndex = 0;
      const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
      const takeNextVacantHouse = () => {
        while (
          nextAvailableIndex < availableHouses.length &&
          assignedHouseIds.has(availableHouses[nextAvailableIndex].id)
        ) {
          nextAvailableIndex += 1;
        }

        const house = availableHouses[nextAvailableIndex];
        if (!house) {
          return null;
        }

        assignedHouseIds.add(house.id);
        nextAvailableIndex += 1;
        return house;
      };

      for (let index = 0; index < parsedRows.length; index += 1) {
        const row = parsedRows[index];
        const targetHouse = row.houseNumber
          ? resolveHouseNumber(row.houseNumber)
          : takeNextVacantHouse();

        if (!targetHouse) {
          skippedRows.push(`Row ${index + 2}: no matching vacant house was found.`);
        } else if ((targetHouse.status ?? 'vacant') !== 'vacant') {
          skippedRows.push(`Row ${index + 2}: house ${targetHouse.house_number} is already occupied.`);
        } else if (assignedHouseIds.has(targetHouse.id)) {
          skippedRows.push(`Row ${index + 2}: house ${targetHouse.house_number} was already assigned in this import.`);
        } else {
          assignedHouseIds.add(targetHouse.id);
          tenantsToInsert.push({
            house_id: targetHouse.id,
            full_name: row.fullName,
            phone_number: row.phoneNumber || null,
            id_number: row.idNumber || null,
            move_in_date: row.moveInDate || null,
            arrears: row.arrears ?? 0,
            user_id: userId ?? null
          });
        }

        const progressBase = 20;
        const progressSpan = 60;
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

      const { error: insertError } = await supabase.from('apartment_tenants').insert(tenantsToInsert);
      if (insertError) {
        throw insertError;
      }

      setImportProgress(92);

      await supabase
        .from('houses')
        .update({ status: 'occupied' })
        .in(
          'id',
          tenantsToInsert.map((tenant) => tenant.house_id)
        );

      await fetchHouses(selectedBlock.id);
      const blockIds = blocks.map((block) => block.id);
      await fetchApartmentHouses(blockIds);
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

  const openHouseModal = async (house: any) => {
    setShowHouseForm(false);
    setTenantFullName('');
    setTenantPhoneNumber('');
    setTenantIdNumber('');
    setTenantMoveInDate('');
    setHouseModal({ house, tenant: null });
    setTenantLoading(true);

    const { data } = await supabase
      .from('apartment_tenants')
      .select('*')
      .eq('house_id', house.id)
      .eq('status', 'active')
      .maybeSingle();

    setTenantLoading(false);

    setHouseModal((current) =>
      current && current.house.id === house.id
        ? { ...current, tenant: data ?? null }
        : { house, tenant: data ?? null }
    );

    if (data) {
      setTenantFullName(data.full_name ?? '');
      setTenantPhoneNumber(data.phone_number ?? '');
      setTenantIdNumber(data.id_number ?? '');
      setTenantMoveInDate(data.move_in_date ?? '');
      setTenantArrears(data.arrears != null ? String(data.arrears) : '');
    }
  };

  const closeHouseModal = () => {
    setHouseModal(null);
    setTenantFullName('');
    setTenantPhoneNumber('');
    setTenantIdNumber('');
    setTenantMoveInDate('');
    setTenantArrears('');
    setHouseModalLoading(false);
    setTenantModalStatus(null);
    setTenantModalRemoving(false);
  };

  const handleTenantSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!houseModal?.house?.id) {
      return;
    }

    setHouseModalLoading(true);
    const parsedTenantArrears = Number(tenantArrears);
    const arrearsValue = Number.isNaN(parsedTenantArrears) ? 0 : parsedTenantArrears;

    const { data, error } = await supabase
      .from('apartment_tenants')
      .insert({
        house_id: houseModal.house.id,
        full_name: tenantFullName,
        phone_number: tenantPhoneNumber || null,
        id_number: tenantIdNumber || null,
        move_in_date: tenantMoveInDate || null,
        arrears: arrearsValue,
        user_id: userId ?? null
      })
      .select('*')
      .single();

    if (error) {
      setHouseModalLoading(false);
      return;
    }

    await supabase
      .from('houses')
      .update({ status: 'occupied' })
      .eq('id', houseModal.house.id);

    const updatedHouse = { ...houseModal.house, status: 'occupied' };
    setHouseModal({ house: updatedHouse, tenant: data });
    const blockId = houseModal.house.block_id || selectedBlock?.id;
    if (blockId) {
      await fetchHouses(blockId);
      const blockIds = blocks.map((block) => block.id);
      await fetchApartmentHouses(blockIds);
    }

    setShowHouseForm(false);
    setTenantFullName('');
    setTenantPhoneNumber('');
    setTenantIdNumber('');
    setTenantMoveInDate('');
    setTenantArrears('');
    setHouseModalLoading(false);
  };

  const executeRemoveApartmentTenant = async () => {
    if (!houseModal?.tenant?.id || !houseModal.house) {
      return;
    }

    setTenantModalRemoving(true);
    setTenantModalStatus(null);

    try {
      await deactivateApartmentTenant(houseModal.tenant.id);
      await supabase
        .from('houses')
        .update({ status: 'vacant' })
        .eq('id', houseModal.house.id);

      const updatedHouse = { ...houseModal.house, status: 'vacant' };
      setHouseModal({ house: updatedHouse, tenant: null });

      const blockId = houseModal.house.block_id || selectedBlock?.id;
      if (blockId) {
        await fetchHouses(blockId);
        const blockIds = blocks.map((block) => block.id);
        await fetchApartmentHouses(blockIds);
      }

      setTenantFullName('');
      setTenantPhoneNumber('');
      setTenantIdNumber('');
      setTenantMoveInDate('');
      setTenantArrears('');
      setTenantModalStatus('Tenant marked inactive and the unit is now available.');
    } catch (error) {
      console.error('Failed to remove apartment tenant', error);
      const message =
        error instanceof Error ? error.message : 'Failed to remove tenant. Please try again.';
      setTenantModalStatus(message);
    } finally {
      setTenantModalRemoving(false);
    }
  };

  const promptRemoveApartmentTenant = () => {
    if (!houseModal?.tenant?.id) {
      return;
    }
    setConfirmRemovalOpen(true);
  };

  const houseSummary = useMemo(() => {
    const occupiedHouses = apartmentHouses.filter((house) => house.status === 'occupied');
    const totalHouses = apartmentHouses.length;
    const emptyHouses = Math.max(0, totalHouses - occupiedHouses.length);

    return {
      totalHouses,
      takenHouses: occupiedHouses.length,
      emptyHouses
    };
  }, [apartmentHouses]);

  const totalEarnings = useMemo(
    () => paidViewRecords.reduce((sum, record) => sum + record.amountPaid, 0),
    [paidViewRecords]
  );

  const totalArrears = useMemo(
    () => arrearsViewRecords.reduce((sum, record) => sum + record.balance, 0),
    [arrearsViewRecords]
  );

  const modalTenantOptions = useMemo<Tenant[] | undefined>(() => {
    if (!houseModal?.tenant || !houseModal.house) {
      return undefined;
    }
    const tenant = houseModal.tenant;
    return [
      {
        id: tenant.id,
        userId: userId ?? null,
        unitId: houseModal.house.id,
        houseNumber: houseModal.house.house_number ?? undefined,
        fullName: tenant.full_name ?? '',
        phone: tenant.phone_number ?? undefined,
        email: undefined,
        moveInDate: tenant.move_in_date ?? undefined,
        status: 'active' as const,
        createdAt: tenant.created_at ?? new Date().toISOString(),
        houseId: houseModal.house.id,
        houseBlockId: houseModal.house.block_id ?? undefined
      }
    ];
  }, [houseModal, userId]);

  const modalUnitOptions = useMemo<Unit[] | undefined>(() => {
    if (!houseModal?.house) {
      return undefined;
    }
    const house = houseModal.house;
    const block = blocks.find((blockData) => blockData.id === house.block_id);
    const unitStatus: Unit['status'] = house.status === 'occupied' ? 'occupied' : 'vacant';
    return [
      {
        id: house.id,
        propertyId: selectedApartment?.id ?? null,
        unitNumber: house.house_number ?? house.id,
        rentAmount: Number(block?.price ?? 0),
        status: unitStatus,
        createdAt: house.created_at ?? new Date().toISOString(),
        userId: userId ?? undefined
      }
    ];
  }, [blocks, houseModal, selectedApartment?.id, userId]);

  const modalBlockId = houseModal?.house?.block_id ?? selectedBlock?.id ?? undefined;

  const modalClientInfo = useMemo(() => {
    if (!houseModal?.tenant || !houseModal?.house) {
      return undefined;
    }
    const tenant = houseModal.tenant;
    return {
      fullName: tenant.full_name ?? '—',
      phone: tenant.phone_number ?? undefined,
      houseNumber: houseModal.house.house_number ?? undefined,
      unitNumber: selectedBlock?.block_name ?? undefined
    };
  }, [houseModal, selectedBlock?.block_name]);

  const modalTenantArrears = useMemo(() => {
    if (!houseModal?.tenant?.id) {
      return [];
    }
    return arrearsViewRecords
      .filter((record) => record.tenantId === houseModal.tenant.id)
      .map((record, index) => ({
        ...record,
        amountDue: Number(record.balance ?? 0),
        currentRentDue: Math.max(0, Number(record.totalExpectedRent ?? 0) - Number(record.totalPaid ?? 0)),
        id: `${record.tenantId}-${index}`
      }));
  }, [arrearsViewRecords, houseModal?.tenant?.id]);

  const modalTenantArrearsTotal = useMemo(
    () => modalTenantArrears.reduce((sum, entry) => sum + entry.amountDue, 0),
    [modalTenantArrears]
  );

  const renderLoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`stat-skeleton-${index}`} className="space-y-3 rounded-2xl border border-gray-200 p-4">
            <div className="h-4 w-28 rounded bg-gray-200/90 animate-pulse" />
            <div className="h-8 rounded bg-gray-200/90 animate-pulse" />
            <div className="h-3 w-3/4 rounded bg-gray-200/90 animate-pulse" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-5 w-56 rounded bg-gray-200/90 animate-pulse" />
        <div className="h-40 rounded-2xl bg-gray-200/90 animate-pulse" />
      </div>
        {renderPlanPanel()}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`apt-skeleton-${index}`} className="h-28 rounded-2xl bg-gray-200/90 animate-pulse" />
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 min-h-screen">
        {renderLoadingSkeleton()}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="space-y-1">
          <p className="text-sm text-gray-500">Projected earnings</p>
          <p className="text-2xl font-semibold">{formatCurrency(totalEarnings)}</p>
          <p className="text-xs text-gray-500">
            {paidViewRecords.length} payment{paidViewRecords.length === 1 ? '' : 's'} recorded
          </p>
        </Card>
        <Card className="space-y-1">
          <p className="text-sm text-gray-500">Arrears</p>
          <p className="text-2xl font-semibold">{formatCurrency(totalArrears)}</p>
          <p className="text-xs text-gray-500">
            {arrearsViewRecords.length} tenant{arrearsViewRecords.length === 1 ? '' : 's'} with outstanding balances
          </p>
        </Card>
        <Card className="space-y-1">
          <p className="text-sm text-gray-500">Taken houses</p>
          <p className="text-2xl font-semibold">{houseSummary.takenHouses}</p>
          <p className="text-xs text-gray-500">{houseSummary.totalHouses} total units</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-sm text-gray-500">Empty houses</p>
          <p className="text-2xl font-semibold">{houseSummary.emptyHouses}</p>
          <p className="text-xs text-gray-500">{houseSummary.totalHouses} total units</p>
        </Card>
      </div>
      {renderPlanPanel()}
      <Card>
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-gray-600">Create a new apartment</p>
          <Button
            type="button"
            onClick={() => {
              if (planMaxApartmentsReached) {
                setLimitPopupOpen(true);
              } else {
                setShowApartmentForm((prev) => !prev);
              }
            }}
            className="px-3 py-2 text-sm"
          >
            {showApartmentForm ? 'Hide form' : 'Add apartment'}
          </Button>
        </div>
      {showApartmentForm && (
          <form onSubmit={createApartment} className="grid gap-2 md:grid-cols-[2fr,2fr,1fr]">
            <Input
              label="Apartment"
              placeholder="Apartment Name"
              value={apartmentName}
              onChange={(e) => setApartmentName(e.target.value)}
            />
            <Input
              label="Location"
              placeholder="City, neighborhood"
              value={apartmentLocation}
              onChange={(e) => setApartmentLocation(e.target.value)}
            />
            <div className="flex">
              <Button type="submit" disabled={!userId} className="px-3 py-2 text-sm w-full">
                Add Apartment
              </Button>
            </div>
          </form>
        )}
      </Card>
      {renderPlanPanel()}

      {limitPopupOpen && (
        <Modal title="Apartment listing limit reached">
          <p className="text-sm text-gray-600">
            You have reached the maximum apartment listings for your current plan.
          </p>
          {subscription && (
            <p className="text-sm text-gray-600 mt-2">
              Current plan: <strong>{planTitleMapApartments[subscription.plan_name]}</strong> • Limit: {subscription.max_apartments}
            </p>
          )}
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setLimitPopupOpen(false)}>Close</Button>
          </div>
        </Modal>
      )}

      {showImportModal && (
        <Modal title="Import tenants">
          <div className="grid gap-4">
            <div className="min-h-[420px] grid place-items-center text-center rounded-xl border border-dashed border-gray-200 bg-gray-50/70 p-4">
              <img
                src="/images/excel%20file%20type.jpg"
                alt="Excel file type example"
                className="max-h-[380px] w-full max-w-[980px] object-contain"
              />
            </div>
            <div className="grid gap-2">
              <label
                htmlFor="excel-import-input"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleImportFileDrop}
                className="grid min-h-[160px] cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-gray-300 bg-white/80 px-6 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50/60"
              >
                <div className="space-y-2 text-gray-600">
                  <p className="text-base font-semibold text-gray-800">Drop or tap to choose</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Excel file</p>
                </div>
              </label>
              <input
                id="excel-import-input"
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
          </div>
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
        </Modal>
      )}

      <div className="grid grid-cols-3 gap-4">
        {apartments.map((apt) => (
          <Card
            key={apt.id}
            className="cursor-pointer"
            onClick={() => {
              setSelectedApartment(apt);
              setSelectedBlock(null);
              setShowBlockForm(false);
              setShowHouseForm(false);
              setHouseModal(null);
              fetchBlocks(apt.id);
            }}
          >
            {apt.name}
            {apt.location && <p className="text-sm text-gray-500">{apt.location}</p>}
          </Card>
        ))}
      </div>

      {selectedApartment && (
        <Card>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold">Blocks - {selectedApartment.name}</h2>
          <Button
            type="button"
            onClick={() => setShowBlockForm((prev) => !prev)}
            className="px-3 py-2 text-sm"
          >
            {showBlockForm ? 'Hide block form' : 'Add block'}
          </Button>
          </div>

          {showBlockForm && (
            <form
              onSubmit={createBlock}
              className="grid gap-2 mb-4 md:grid-cols-[1fr,1fr,1fr,auto]"
            >
              <Input
                label="Block"
                placeholder="Block Name (A, B...)"
                value={blockName}
                onChange={(e) => setBlockName(e.target.value)}
              />
              <Input
                label="Bedrooms"
                placeholder="Bedrooms (e.g. 2)"
                value={blockBedrooms}
                onChange={(e) => setBlockBedrooms(e.target.value)}
                type="number"
                min="0"
              />
              <Input
                label="Price"
                placeholder="Price"
                value={blockPrice}
                onChange={(e) => setBlockPrice(e.target.value)}
                type="number"
                min="0"
                step="0.01"
              />
              <Button type="submit" className="px-3 py-2 text-sm">
                Save block
              </Button>
            </form>
          )}

          <div className="flex gap-3">
            {blocks.map((block) => (
            <Card
              key={block.id}
              className="cursor-pointer px-4 py-2"
              onClick={() => {
                setSelectedBlock(block);
                setShowHouseForm(false);
                setHouseModal(null);
                fetchHouses(block.id);
              }}
            >
                {block.block_name}
              </Card>
            ))}
          </div>
        </Card>
      )}

      {selectedBlock && (
        <Card>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">
              Houses - Block {selectedBlock.block_name}
            </h2>
          <Button
            type="button"
            variant="primary"
            className="px-4 py-2 text-sm shadow-md"
            onClick={() => setShowImportModal(true)}
          >
            Import
          </Button>
          </div>

          <div className="text-sm text-gray-600 mb-4 flex flex-wrap gap-4">
            {selectedBlock.bedrooms != null && (
              <span>Bedrooms: {selectedBlock.bedrooms}</span>
            )}
            {selectedBlock.price != null && (
              <span>Price: {formatBlockPrice(selectedBlock.price)}</span>
            )}
          </div>

          {houses.length === 0 && (
            <>
              <div className="flex justify-end mb-2">
                <Button
                  type="button"
                  onClick={() => setShowHouseForm((prev) => !prev)}
                  className="px-3 py-2 text-sm"
                >
                  {showHouseForm ? 'Hide form' : 'Add houses'}
                </Button>
              </div>
              {showHouseForm && (
                <form onSubmit={createHouses} className="flex gap-2 mb-4">
                  <Input
                    label="Houses"
                    placeholder="Number of Houses"
                    value={houseCount}
                    onChange={(e) => setHouseCount(e.target.value)}
                    type="number"
                  />
                  <Button type="submit" className="px-3 py-2 text-sm">
                    Generate Houses
                  </Button>
                </form>
              )}
            </>
          )}

          <div className="grid grid-cols-6 gap-3">
            {houses.map((house) => {
              const isOccupied = house.status === 'occupied';
              return (
                <button
                  key={house.id}
                  type="button"
                  onClick={() => openHouseModal(house)}
                  className={`p-3 rounded-xl text-center font-semibold border transition focus:outline-none ${
                    isOccupied
                      ? 'bg-green-200 border-green-500 text-green-700 hover:bg-green-300'
                      : 'bg-red-200 border-red-500 text-red-700 hover:bg-red-300'
                  }`}
                >
                  <span className="block">{house.house_number}</span>
                  <span className="text-xs mt-1 block">
                    {isOccupied ? 'Taken' : 'Available'}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      )}
      {houseModal && (
        <Modal title={`House ${houseModal.house.house_number}`}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                {houseModal.house.status === 'occupied' ? 'Taken' : 'Available'}
              </p>
              <Button type="button" onClick={closeHouseModal} className="px-3 py-1 text-xs">
                Close
              </Button>
            </div>

          {tenantLoading ? (
            <p className="text-sm text-gray-600">Loading tenant information…</p>
          ) : houseModal.tenant ? (
            <div className="space-y-4">
              {selectedApartment?.id && modalTenantOptions?.length && modalUnitOptions?.length && (
                <PaymentForm
                  tenants={modalTenantOptions}
                  units={modalUnitOptions}
                  apartmentId={selectedApartment.id}
                  apartmentBlockId={modalBlockId}
                  initialTenantId={modalTenantOptions[0].id}
                  initialUnitId={modalUnitOptions[0].id}
                  clientInfo={modalClientInfo}
                  apartmentOwnerId={userId}
                />
              )}
                <div className="rounded-lg border border-dashed border-gray-200 bg-white p-3 text-sm text-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-gray-900">Tenant balance</p>
                    <span className="text-sm text-gray-500">
                      {formatCurrency(modalTenantArrearsTotal)}
                    </span>
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
                          <p>Current rent due: {formatCurrency(entry.currentRentDue)}</p>
                          <p>Imported arrears: {formatCurrency(entry.previousArrears)}</p>
                          <p>
                            Total rent: {formatCurrency(entry.totalExpectedRent)} · Paid: {formatCurrency(entry.totalPaid)}
                          </p>
                          <p className="text-xs font-semibold text-gray-700">
                            {entry.status === 'paid'
                              ? 'Status: Paid'
                              : `Status: Balance ${formatCurrency(entry.amountDue)}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No outstanding balances.</p>
                  )}
                </div>
                {tenantModalStatus && (
                  <p className="text-sm text-gray-600">{tenantModalStatus}</p>
                )}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <Button
                    variant="ghost"
                    type="button"
                    className="border-red-100 text-red-600 hover:bg-red-50 disabled:text-red-400 disabled:border-red-200"
                    onClick={promptRemoveApartmentTenant}
                    disabled={tenantModalRemoving}
                  >
                    {tenantModalRemoving ? 'Removing…' : 'Remove tenant'}
                  </Button>
                  <Button type="button" onClick={closeHouseModal} className="px-3 py-2 text-sm">
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleTenantSubmit} className="space-y-3 text-sm">
                <Input
                  label="Full name"
                  placeholder="Tenant full name"
                  value={tenantFullName}
                  onChange={(e) => setTenantFullName(e.target.value)}
                  required
                />
                <Input
                  label="Phone number"
                  placeholder="Phone number"
                  value={tenantPhoneNumber}
                  onChange={(e) => setTenantPhoneNumber(e.target.value)}
                />
                <Input
                  label="ID number"
                  placeholder="ID number"
                  value={tenantIdNumber}
                  onChange={(e) => setTenantIdNumber(e.target.value)}
                />
                <Input
                  label="Move-in date"
                  placeholder="Move-in date"
                  type="date"
                  value={tenantMoveInDate}
                  onChange={(e) => setTenantMoveInDate(e.target.value)}
                />
                <Input
                  label="Previous arrears"
                  placeholder="0.00"
                  type="number"
                  min="0"
                  step="0.01"
                  value={tenantArrears}
                  onChange={(e) => setTenantArrears(e.target.value)}
                />
                <Button
                  type="submit"
                  disabled={!tenantFullName || !tenantMoveInDate || houseModalLoading}
                  className="px-3 py-2 text-sm w-full"
                >
                  {houseModalLoading ? 'Saving…' : 'Add tenant'}
                </Button>
              </form>
            )}
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
                onClick={() => {
                  setConfirmRemovalOpen(false);
                  executeRemoveApartmentTenant();
                }}
                disabled={tenantModalRemoving}
              >
                {tenantModalRemoving ? 'Removing…' : 'Confirm removal'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
