import { useEffect, useMemo, useState } from 'react';
import RentTable from '../../components/rent/RentTable';
import usePayments from '../../hooks/usePayments';
import useTenants from '../../hooks/useTenants';
import useUnits from '../../hooks/useUnits';
import useAuth from '../../hooks/useAuth';
import useArrears from '../../hooks/useArrears';
import { useCurrency } from '../../context/currency';
import { supabase } from '../../lib/supabaseClient';
import type { Tenant } from '../../types/tenant';
import useApartmentPayments from '../../hooks/useApartmentPayments';
import PageLoader from '../../components/ui/PageLoader';

const RentPaid = () => {
  const { formatCurrency } = useCurrency();
  const { payments } = usePayments();
  const { user } = useAuth();
  const { totalDue } = useArrears();
  const { units } = useUnits('all', user?.id);
  const { tenants } = useTenants();
  const { apartmentPayments, loading: apartmentPaymentsLoading } = useApartmentPayments();
  const [selectedUnitId, setSelectedUnitId] = useState<string | 'all'>('all');
  const [apartments, setApartments] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState<string | 'all'>('all');
  const [selectedBlockId, setSelectedBlockId] = useState<string | 'all'>('all');
  const [apartmentTenants, setApartmentTenants] = useState<
    Array<Tenant & { houseBlockId?: string | null; houseId?: string | null; apartmentId?: string | null }>
  >([]);

  const apartmentsFilterBlocks = useMemo(
    () =>
      selectedApartmentId === 'all'
        ? blocks
        : blocks.filter((block) => block.apartment_id === selectedApartmentId),
    [blocks, selectedApartmentId]
  );

  const blockMap = useMemo(
    () => new Map(blocks.map((block) => [block.id, block])),
    [blocks]
  );

  const apartmentTenantsInApartment = useMemo(() => {
    if (selectedApartmentId === 'all') {
      return apartmentTenants;
    }
    return apartmentTenants.filter((tenant) => {
      const block = blockMap.get(tenant.houseBlockId ?? '');
      return block?.apartment_id === selectedApartmentId;
    });
  }, [apartmentTenants, selectedApartmentId, blockMap]);

  const apartmentTenantsInBlock = useMemo(() => {
    if (selectedBlockId === 'all') {
      return apartmentTenantsInApartment;
    }
    return apartmentTenantsInApartment.filter((tenant) => tenant.houseBlockId === selectedBlockId);
  }, [apartmentTenantsInApartment, selectedBlockId]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadApartments = async () => {
      if (!user?.id) {
        setApartments([]);
        setBlocks([]);
        setApartmentTenants([]);
        return;
      }

      const { data: aptData, error: aptError } = await supabase
        .from('apartments')
        .select('*')
        .eq('creator_id', user.id);

      if (aptError) {
        console.error('Failed to load apartments', aptError);
        return;
      }

      const apartmentRows = aptData || [];
      setApartments(apartmentRows);

      if (apartmentRows.length === 0) {
        setBlocks([]);
        setApartmentTenants([]);
        return;
      }

      const { data: blockData, error: blockError } = await supabase
        .from('blocks')
        .select('*')
        .in('apartment_id', apartmentRows.map((apt) => apt.id));

      if (blockError) {
        console.error('Failed to load blocks', blockError);
        setBlocks([]);
        setApartmentTenants([]);
        return;
      }

      const blockRows = blockData || [];
      setBlocks(blockRows);
      const blockMap = new Map(blockRows.map((block) => [block.id, block]));

      const blockIds = blockRows.map((block) => block.id);
      await loadApartmentTenants(blockIds, blockMap);
    };

    const loadApartmentTenants = async (
      blockIds: string[],
      blockMap: Map<string, { apartment_id: string }>
    ) => {
      if (!user?.id || blockIds.length === 0) {
        setApartmentTenants([]);
        return;
      }

      const { data, error } = await supabase
        .from('apartment_tenants')
        .select('*, houses(id, house_number, block_id)')
        .eq('status', 'active')
        .in('houses.block_id', blockIds);

      if (error) {
        console.error('Failed to load apartment tenants', error);
        setApartmentTenants([]);
        return;
      }

      const mapped = (data ?? []).map((tenant: any) => {
        const house = tenant.houses;
        const blockId = house?.block_id ?? null;
        const block = blockId ? blockMap.get(blockId) : undefined;
        return {
          id: tenant.id,
          userId: user.id,
          unitId: null,
          houseNumber: house?.house_number ?? undefined,
          fullName: tenant.full_name ?? '',
          phone: tenant.phone_number ?? undefined,
          email: undefined,
          moveInDate: tenant.move_in_date ?? undefined,
          status: 'active' as const,
          createdAt: tenant.created_at,
          houseBlockId: blockId,
          houseId: house?.id ?? null,
          apartmentId: block?.apartment_id ?? null
        };
      });
      setApartmentTenants(mapped);
    };

    setIsLoading(true);
    loadApartments().finally(() => {
      setIsLoading(false);
    });
  }, [user?.id]);

  useEffect(() => {
    if (selectedApartmentId === 'all') {
      setSelectedBlockId('all');
      return;
    }

    if (selectedBlockId !== 'all') {
      const blockBelongsToApartment = blocks.some(
        (block) => block.id === selectedBlockId && block.apartment_id === selectedApartmentId
      );
      if (!blockBelongsToApartment) {
        setSelectedBlockId('all');
      }
    }
  }, [selectedApartmentId, selectedBlockId, blocks]);

  const unitsByProperty = useMemo(() => {
    if (selectedApartmentId === 'all') {
      return new Set(units.map((unit) => unit.id));
    }
    const set = new Set(units.filter((unit) => unit.propertyId === selectedApartmentId).map((unit) => unit.id));
    set.add(selectedApartmentId);
    return set;
  }, [units, selectedApartmentId]);

  const block = useMemo(
    () => blocks.find((blockData) => blockData.id === selectedBlockId),
    [blocks, selectedBlockId]
  );

  const blockPrefix = block?.block_name?.toUpperCase() ?? '';

  const tenantsInApartment = useMemo(() => {
    if (selectedApartmentId === 'all') {
      return tenants;
    }
    const validUnitIds = units.filter((unit) => unit.propertyId === selectedApartmentId).map((unit) => unit.id);
    const unitSet = new Set(validUnitIds);
    return tenants.filter((tenant) => tenant.unitId && unitSet.has(tenant.unitId));
  }, [tenants, units, selectedApartmentId]);

  const filteredTenants = useMemo(() => {
    if (selectedBlockId === 'all' || !blockPrefix) {
      return tenantsInApartment;
    }
    return tenantsInApartment.filter((tenant) =>
      (tenant.houseNumber ?? '').toUpperCase().startsWith(blockPrefix)
    );
  }, [tenantsInApartment, selectedBlockId, blockPrefix]);

  const unitsInApartment = useMemo(() => {
    if (selectedApartmentId === 'all') {
      return units;
    }
    return units.filter((unit) => unit.propertyId === selectedApartmentId);
  }, [units, selectedApartmentId]);

  const filteredUnits = useMemo(() => {
    if (selectedBlockId === 'all' || !blockPrefix) {
      return unitsInApartment;
    }
    return unitsInApartment.filter((unit) =>
      (unit.unitNumber ?? '').toUpperCase().startsWith(blockPrefix)
    );
  }, [unitsInApartment, selectedBlockId, blockPrefix]);

  const apartmentUnitOption = useMemo(() => {
    if (selectedApartmentId === 'all') {
      return null;
    }
    const apartment = apartments.find((apt) => apt.id === selectedApartmentId);
    if (!apartment) {
      return null;
    }
    return {
      id: apartment.id,
      propertyId: apartment.id,
      unitNumber: apartment.name,
      rentAmount: 0,
      status: 'vacant' as const,
      createdAt: apartment.created_at
    };
  }, [selectedApartmentId, apartments]);

  const unitsForDropdown = apartmentUnitOption ? [apartmentUnitOption] : filteredUnits;

  const tenantIdsInBlock = useMemo(() => {
    if (selectedBlockId === 'all' || !blockPrefix) {
      return null;
    }
    const ids = new Set<string>();
    filteredTenants.forEach((tenant) => {
      if (tenant.id) {
        ids.add(tenant.id);
      }
    });
    apartmentTenantsInBlock.forEach((tenant) => {
      if (tenant.id) {
        ids.add(tenant.id);
      }
    });
    return ids;
  }, [filteredTenants, selectedBlockId, blockPrefix, apartmentTenantsInBlock]);

  const allPayments = useMemo(() => [...payments, ...apartmentPayments], [payments, apartmentPayments]);

  const paymentsAfterFilters = useMemo(() => {
    let rows = allPayments;
    if (selectedApartmentId !== 'all') {
      rows = rows.filter((payment) => unitsByProperty.has(payment.unitId));
    }
    if (tenantIdsInBlock && selectedBlockId !== 'all') {
      rows = rows.filter((payment) => tenantIdsInBlock.has(payment.tenantId));
    }
    return rows;
  }, [allPayments, selectedApartmentId, unitsByProperty, tenantIdsInBlock, selectedBlockId]);

  const filteredPayments = useMemo(
    () =>
      selectedUnitId === 'all'
        ? paymentsAfterFilters
        : paymentsAfterFilters.filter((payment) => payment.unitId === selectedUnitId),
    [paymentsAfterFilters, selectedUnitId]
  );

  useEffect(() => {
    if (selectedUnitId === 'all') {
      return;
    }
    if (selectedApartmentId !== 'all' && selectedUnitId === selectedApartmentId) {
      return;
    }
    if (!filteredUnits.some((unit) => unit.id === selectedUnitId)) {
      setSelectedUnitId('all');
    }
  }, [selectedUnitId, filteredUnits, selectedApartmentId]);

  useEffect(() => {
    if (selectedApartmentId === 'all') {
      setSelectedUnitId('all');
      return;
    }
    setSelectedUnitId(selectedApartmentId);
  }, [selectedApartmentId]);

  const filteredTotalCollected = useMemo(
    () =>
      filteredPayments.reduce((sum, payment) => sum + payment.amountPaid, 0),
    [filteredPayments]
  );

  if (isLoading || apartmentPaymentsLoading) {
    return <PageLoader message="Loading rent payments..." />;
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <label className="input-field">
            <span>Filter by Apartment</span>
            <select
              value={selectedApartmentId}
              onChange={(e) => setSelectedApartmentId(e.target.value as string | 'all')}
              className="w-full md:w-48 p-2 border rounded-lg"
            >
              <option value="all">All Apartments</option>
              {apartments.map((apt) => (
                <option key={apt.id} value={apt.id}>
                  {apt.name}
                </option>
              ))}
            </select>
          </label>
          <label className="input-field">
            <span>Filter by Block</span>
            <select
              value={selectedBlockId}
              onChange={(e) => setSelectedBlockId(e.target.value as string | 'all')}
              className="w-full md:w-48 p-2 border rounded-lg"
              disabled={selectedApartmentId === 'all'}
            >
              <option value="all">All Blocks</option>
              {apartmentsFilterBlocks.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.block_name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <h1>Rent Paid</h1>
          <p>Total collected: {formatCurrency(filteredTotalCollected)}</p>
          <p className="text-sm text-gray-500">Outstanding balance: {formatCurrency(totalDue)}</p>
        </div>
        <label className="input-field">
          <span>
            Filter by Unit
            {selectedApartmentId !== 'all' && apartmentsFilterBlocks.length > 0 && (
              <> ({apartmentsFilterBlocks.length} block{apartmentsFilterBlocks.length === 1 ? '' : 's'})</>
            )}
          </span>
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value as string | 'all')}
            className="w-full md:w-48 p-2 border rounded-lg"
          >
            <option value="all">All Units</option>
            {unitsForDropdown.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {selectedApartmentId !== 'all'
                  ? apartments.find((apt) => apt.id === unit.id)?.name ?? unit.unitNumber ?? unit.id
                  : `Unit ${unit.unitNumber ?? unit.id}`}
              </option>
            ))}
            {filteredUnits.length === 0 &&
              selectedApartmentId !== 'all' &&
              apartmentsFilterBlocks.length > 0 &&
              apartmentsFilterBlocks.map((block) => (
                <option key={`block-${block.id}`} value="" disabled>
                  Block {block.block_name} (no units yet)
                </option>
              ))}
          </select>
        </label>
      </div>

      <RentTable payments={filteredPayments} />
    </section>
  );
};

export default RentPaid;
