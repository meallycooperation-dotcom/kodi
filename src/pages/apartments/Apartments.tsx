import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import useAuth from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import {
  fetchApartmentArrearsView,
  fetchApartmentPaidView,
  ApartmentPaidViewRecord,
  ApartmentArrearsViewRecord
} from '../../services/paymentService';
import { useCurrency } from '../../context/currency';

export default function ApartmentManager() {
  const { user } = useAuth();
  const userId = user?.id;
  const { formatCurrency } = useCurrency();

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
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [showHouseForm, setShowHouseForm] = useState(false);
  const [houseModal, setHouseModal] = useState<{
    house: any;
    tenant: any | null;
  } | null>(null);
  const [tenantFullName, setTenantFullName] = useState('');
  const [tenantPhoneNumber, setTenantPhoneNumber] = useState('');
  const [tenantIdNumber, setTenantIdNumber] = useState('');
  const [tenantMoveInDate, setTenantMoveInDate] = useState('');
  const [tenantLoading, setTenantLoading] = useState(false);
  const [houseModalLoading, setHouseModalLoading] = useState(false);
  const [apartmentHouses, setApartmentHouses] = useState<any[]>([]);
  const [paidViewRecords, setPaidViewRecords] = useState<ApartmentPaidViewRecord[]>([]);
  const [arrearsViewRecords, setArrearsViewRecords] = useState<ApartmentArrearsViewRecord[]>([]);

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
    setApartmentHouses(ordered);
  };

  const loadApartmentViews = useCallback(async () => {
    if (!userId) {
      setPaidViewRecords([]);
      setArrearsViewRecords([]);
      return;
    }

    const [paid, arrears] = await Promise.all([
      fetchApartmentPaidView(),
      fetchApartmentArrearsView()
    ]);

    setPaidViewRecords(paid);
    setArrearsViewRecords(arrears);
  }, [userId]);

  useEffect(() => {
    loadApartmentViews();
  }, [loadApartmentViews]);

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

  const createApartment = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) {
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
    }
  };

  const closeHouseModal = () => {
    setHouseModal(null);
    setTenantFullName('');
    setTenantPhoneNumber('');
    setTenantIdNumber('');
    setTenantMoveInDate('');
    setHouseModalLoading(false);
  };

  const handleTenantSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!houseModal?.house?.id) {
      return;
    }

    setHouseModalLoading(true);

    const { data, error } = await supabase
      .from('apartment_tenants')
      .insert({
        house_id: houseModal.house.id,
        full_name: tenantFullName,
        phone_number: tenantPhoneNumber || null,
        id_number: tenantIdNumber || null,
        move_in_date: tenantMoveInDate || null
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
    setHouseModalLoading(false);
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

  return (
    <div className="p-6 space-y-6">
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
            {arrearsViewRecords.length} tenant{arrearsViewRecords.length === 1 ? '' : 's'} missing this month
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
      <Card>
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-gray-600">Create a new apartment</p>
          <Button
            type="button"
            onClick={() => setShowApartmentForm((prev) => !prev)}
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
          <h2 className="text-lg font-bold mb-2">
            Houses - Block {selectedBlock.block_name}
          </h2>

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
              <div className="space-y-2 text-sm text-left">
                <p className="text-base font-semibold">{houseModal.tenant.full_name}</p>
                {houseModal.tenant.phone_number && (
                  <p>Phone: {houseModal.tenant.phone_number}</p>
                )}
                {houseModal.tenant.id_number && <p>ID: {houseModal.tenant.id_number}</p>}
                <p>
                  Move-in:{' '}
                  {houseModal.tenant.move_in_date
                    ? new Date(houseModal.tenant.move_in_date).toLocaleDateString('en-KE')
                    : '—'}
                </p>
                <p className="text-xs text-gray-500">
                  Added on:{' '}
                  {houseModal.tenant.created_at
                    ? new Date(houseModal.tenant.created_at).toLocaleString()
                    : '—'}
                </p>
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
    </div>
  );
}
