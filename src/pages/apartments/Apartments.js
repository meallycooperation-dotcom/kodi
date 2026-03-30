import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import useAuth from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { fetchApartmentArrearsView, fetchApartmentPaidView } from '../../services/paymentService';
const currencyFormatter = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 2
});
const formatCurrency = (value) => currencyFormatter.format(value);
export default function ApartmentManager() {
    const { user } = useAuth();
    const userId = user?.id;
    const [apartments, setApartments] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [houses, setHouses] = useState([]);
    const [selectedApartment, setSelectedApartment] = useState(null);
    const [selectedBlock, setSelectedBlock] = useState(null);
    const [apartmentName, setApartmentName] = useState('');
    const [apartmentLocation, setApartmentLocation] = useState('');
    const [blockName, setBlockName] = useState('');
    const [blockBedrooms, setBlockBedrooms] = useState('');
    const [blockPrice, setBlockPrice] = useState('');
    const [houseCount, setHouseCount] = useState('');
    const [showApartmentForm, setShowApartmentForm] = useState(false);
    const [showBlockForm, setShowBlockForm] = useState(false);
    const [showHouseForm, setShowHouseForm] = useState(false);
    const [houseModal, setHouseModal] = useState(null);
    const [tenantFullName, setTenantFullName] = useState('');
    const [tenantPhoneNumber, setTenantPhoneNumber] = useState('');
    const [tenantIdNumber, setTenantIdNumber] = useState('');
    const [tenantMoveInDate, setTenantMoveInDate] = useState('');
    const [tenantLoading, setTenantLoading] = useState(false);
    const [houseModalLoading, setHouseModalLoading] = useState(false);
    const [apartmentHouses, setApartmentHouses] = useState([]);
    const [paidViewRecords, setPaidViewRecords] = useState([]);
    const [arrearsViewRecords, setArrearsViewRecords] = useState([]);
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
    const fetchBlocks = async (apartmentId) => {
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
    const fetchHouses = async (blockId) => {
        const { data } = await supabase
            .from('houses')
            .select('*')
            .eq('block_id', blockId);
        const ordered = (data || []).slice().sort((a, b) => String(a.house_number).localeCompare(String(b.house_number)));
        setHouses(ordered);
    };
    const fetchApartmentHouses = async (blockIds) => {
        if (blockIds.length === 0) {
            setApartmentHouses([]);
            return;
        }
        const { data } = await supabase
            .from('houses')
            .select('*, apartment_tenants(*)')
            .in('block_id', blockIds);
        const ordered = (data || []).slice().sort((a, b) => String(a.house_number).localeCompare(String(b.house_number)));
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
    const createApartment = async (e) => {
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
    const createBlock = async (e) => {
        e.preventDefault();
        if (!selectedApartment?.id) {
            return;
        }
        const bedrooms = parseInt(blockBedrooms, 10);
        const price = parseFloat(blockPrice);
        const payload = {
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
    const createHouses = async (e) => {
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
    const openHouseModal = async (house) => {
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
        setHouseModal((current) => current && current.house.id === house.id
            ? { ...current, tenant: data ?? null }
            : { house, tenant: data ?? null });
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
    const handleTenantSubmit = async (e) => {
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
    const totalEarnings = useMemo(() => paidViewRecords.reduce((sum, record) => sum + record.amountPaid, 0), [paidViewRecords]);
    const totalArrears = useMemo(() => arrearsViewRecords.reduce((sum, record) => sum + record.balance, 0), [arrearsViewRecords]);
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "grid gap-4 md:grid-cols-4", children: [_jsxs(Card, { className: "space-y-1", children: [_jsx("p", { className: "text-sm text-gray-500", children: "Projected earnings" }), _jsx("p", { className: "text-2xl font-semibold", children: formatCurrency(totalEarnings) }), _jsxs("p", { className: "text-xs text-gray-500", children: [paidViewRecords.length, " payment", paidViewRecords.length === 1 ? '' : 's', " recorded"] })] }), _jsxs(Card, { className: "space-y-1", children: [_jsx("p", { className: "text-sm text-gray-500", children: "Arrears" }), _jsx("p", { className: "text-2xl font-semibold", children: formatCurrency(totalArrears) }), _jsxs("p", { className: "text-xs text-gray-500", children: [arrearsViewRecords.length, " tenant", arrearsViewRecords.length === 1 ? '' : 's', " missing this month"] })] }), _jsxs(Card, { className: "space-y-1", children: [_jsx("p", { className: "text-sm text-gray-500", children: "Taken houses" }), _jsx("p", { className: "text-2xl font-semibold", children: houseSummary.takenHouses }), _jsxs("p", { className: "text-xs text-gray-500", children: [houseSummary.totalHouses, " total units"] })] }), _jsxs(Card, { className: "space-y-1", children: [_jsx("p", { className: "text-sm text-gray-500", children: "Empty houses" }), _jsx("p", { className: "text-2xl font-semibold", children: houseSummary.emptyHouses }), _jsxs("p", { className: "text-xs text-gray-500", children: [houseSummary.totalHouses, " total units"] })] })] }), _jsxs(Card, { children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsx("p", { className: "text-sm text-gray-600", children: "Create a new apartment" }), _jsx(Button, { type: "button", onClick: () => setShowApartmentForm((prev) => !prev), className: "px-3 py-2 text-sm", children: showApartmentForm ? 'Hide form' : 'Add apartment' })] }), showApartmentForm && (_jsxs("form", { onSubmit: createApartment, className: "grid gap-2 md:grid-cols-[2fr,2fr,1fr]", children: [_jsx(Input, { label: "Apartment", placeholder: "Apartment Name", value: apartmentName, onChange: (e) => setApartmentName(e.target.value) }), _jsx(Input, { label: "Location", placeholder: "City, neighborhood", value: apartmentLocation, onChange: (e) => setApartmentLocation(e.target.value) }), _jsx("div", { className: "flex", children: _jsx(Button, { type: "submit", disabled: !userId, className: "px-3 py-2 text-sm w-full", children: "Add Apartment" }) })] }))] }), _jsx("div", { className: "grid grid-cols-3 gap-4", children: apartments.map((apt) => (_jsxs(Card, { className: "cursor-pointer", onClick: () => {
                        setSelectedApartment(apt);
                        setSelectedBlock(null);
                        setShowBlockForm(false);
                        setShowHouseForm(false);
                        setHouseModal(null);
                        fetchBlocks(apt.id);
                    }, children: [apt.name, apt.location && _jsx("p", { className: "text-sm text-gray-500", children: apt.location })] }, apt.id))) }), selectedApartment && (_jsxs(Card, { children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsxs("h2", { className: "text-lg font-bold", children: ["Blocks - ", selectedApartment.name] }), _jsx(Button, { type: "button", onClick: () => setShowBlockForm((prev) => !prev), className: "px-3 py-2 text-sm", children: showBlockForm ? 'Hide block form' : 'Add block' })] }), showBlockForm && (_jsxs("form", { onSubmit: createBlock, className: "grid gap-2 mb-4 md:grid-cols-[1fr,1fr,1fr,auto]", children: [_jsx(Input, { label: "Block", placeholder: "Block Name (A, B...)", value: blockName, onChange: (e) => setBlockName(e.target.value) }), _jsx(Input, { label: "Bedrooms", placeholder: "Bedrooms (e.g. 2)", value: blockBedrooms, onChange: (e) => setBlockBedrooms(e.target.value), type: "number", min: "0" }), _jsx(Input, { label: "Price", placeholder: "Price", value: blockPrice, onChange: (e) => setBlockPrice(e.target.value), type: "number", min: "0", step: "0.01" }), _jsx(Button, { type: "submit", className: "px-3 py-2 text-sm", children: "Save block" })] })), _jsx("div", { className: "flex gap-3", children: blocks.map((block) => (_jsx(Card, { className: "cursor-pointer px-4 py-2", onClick: () => {
                                setSelectedBlock(block);
                                setShowHouseForm(false);
                                setHouseModal(null);
                                fetchHouses(block.id);
                            }, children: block.block_name }, block.id))) })] })), selectedBlock && (_jsxs(Card, { children: [_jsxs("h2", { className: "text-lg font-bold mb-2", children: ["Houses - Block ", selectedBlock.block_name] }), _jsxs("div", { className: "text-sm text-gray-600 mb-4 flex flex-wrap gap-4", children: [selectedBlock.bedrooms != null && (_jsxs("span", { children: ["Bedrooms: ", selectedBlock.bedrooms] })), selectedBlock.price != null && (_jsxs("span", { children: ["Price:", ' ', Number.isNaN(Number(selectedBlock.price))
                                        ? selectedBlock.price
                                        : Number(selectedBlock.price).toLocaleString('en-KE', {
                                            style: 'currency',
                                            currency: 'KES',
                                            maximumFractionDigits: 2
                                        })] }))] }), houses.length === 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex justify-end mb-2", children: _jsx(Button, { type: "button", onClick: () => setShowHouseForm((prev) => !prev), className: "px-3 py-2 text-sm", children: showHouseForm ? 'Hide form' : 'Add houses' }) }), showHouseForm && (_jsxs("form", { onSubmit: createHouses, className: "flex gap-2 mb-4", children: [_jsx(Input, { label: "Houses", placeholder: "Number of Houses", value: houseCount, onChange: (e) => setHouseCount(e.target.value), type: "number" }), _jsx(Button, { type: "submit", className: "px-3 py-2 text-sm", children: "Generate Houses" })] }))] })), _jsx("div", { className: "grid grid-cols-6 gap-3", children: houses.map((house) => {
                            const isOccupied = house.status === 'occupied';
                            return (_jsxs("button", { type: "button", onClick: () => openHouseModal(house), className: `p-3 rounded-xl text-center font-semibold border transition focus:outline-none ${isOccupied
                                    ? 'bg-green-200 border-green-500 text-green-700 hover:bg-green-300'
                                    : 'bg-red-200 border-red-500 text-red-700 hover:bg-red-300'}`, children: [_jsx("span", { className: "block", children: house.house_number }), _jsx("span", { className: "text-xs mt-1 block", children: isOccupied ? 'Taken' : 'Available' })] }, house.id));
                        }) })] })), houseModal && (_jsx(Modal, { title: `House ${houseModal.house.house_number}`, children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("p", { className: "text-sm text-gray-500", children: houseModal.house.status === 'occupied' ? 'Taken' : 'Available' }), _jsx(Button, { type: "button", onClick: closeHouseModal, className: "px-3 py-1 text-xs", children: "Close" })] }), tenantLoading ? (_jsx("p", { className: "text-sm text-gray-600", children: "Loading tenant information\u2026" })) : houseModal.tenant ? (_jsxs("div", { className: "space-y-2 text-sm text-left", children: [_jsx("p", { className: "text-base font-semibold", children: houseModal.tenant.full_name }), houseModal.tenant.phone_number && (_jsxs("p", { children: ["Phone: ", houseModal.tenant.phone_number] })), houseModal.tenant.id_number && _jsxs("p", { children: ["ID: ", houseModal.tenant.id_number] }), _jsxs("p", { children: ["Move-in:", ' ', houseModal.tenant.move_in_date
                                            ? new Date(houseModal.tenant.move_in_date).toLocaleDateString('en-KE')
                                            : '—'] }), _jsxs("p", { className: "text-xs text-gray-500", children: ["Added on:", ' ', houseModal.tenant.created_at
                                            ? new Date(houseModal.tenant.created_at).toLocaleString()
                                            : '—'] })] })) : (_jsxs("form", { onSubmit: handleTenantSubmit, className: "space-y-3 text-sm", children: [_jsx(Input, { label: "Full name", placeholder: "Tenant full name", value: tenantFullName, onChange: (e) => setTenantFullName(e.target.value), required: true }), _jsx(Input, { label: "Phone number", placeholder: "Phone number", value: tenantPhoneNumber, onChange: (e) => setTenantPhoneNumber(e.target.value) }), _jsx(Input, { label: "ID number", placeholder: "ID number", value: tenantIdNumber, onChange: (e) => setTenantIdNumber(e.target.value) }), _jsx(Input, { label: "Move-in date", placeholder: "Move-in date", type: "date", value: tenantMoveInDate, onChange: (e) => setTenantMoveInDate(e.target.value) }), _jsx(Button, { type: "submit", disabled: !tenantFullName || !tenantMoveInDate || houseModalLoading, className: "px-3 py-2 text-sm w-full", children: houseModalLoading ? 'Saving…' : 'Add tenant' })] }))] }) }))] }));
}
