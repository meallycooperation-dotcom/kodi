import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import PaymentForm from '../../components/rent/PaymentForm';
import RentTable from '../../components/rent/RentTable';
import Button from '../../components/ui/Button';
import usePayments from '../../hooks/usePayments';
import useTenants from '../../hooks/useTenants';
import useUnits from '../../hooks/useUnits';
import useAuth from '../../hooks/useAuth';
import { useCurrency } from '../../context/currency';
import { supabase } from '../../lib/supabaseClient';
const RentPaid = () => {
    const { formatCurrency } = useCurrency();
    const { payments, totalCollected } = usePayments();
    const { user } = useAuth();
    const { units } = useUnits('all', user?.id);
    const { tenants } = useTenants();
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [selectedUnitId, setSelectedUnitId] = useState('all');
    const [apartments, setApartments] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [selectedApartmentId, setSelectedApartmentId] = useState('all');
    const [selectedBlockId, setSelectedBlockId] = useState('all');
    const [apartmentTenants, setApartmentTenants] = useState([]);
    const apartmentsFilterBlocks = useMemo(() => selectedApartmentId === 'all'
        ? blocks
        : blocks.filter((block) => block.apartment_id === selectedApartmentId), [blocks, selectedApartmentId]);
    const blockMap = useMemo(() => new Map(blocks.map((block) => [block.id, block])), [blocks]);
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
        const loadApartmentTenants = async (blockIds, blockMap) => {
            if (!user?.id || blockIds.length === 0) {
                setApartmentTenants([]);
                return;
            }
            const { data, error } = await supabase
                .from('apartment_tenants')
                .select('*, houses(id, house_number, block_id)')
                .in('houses.block_id', blockIds);
            if (error) {
                console.error('Failed to load apartment tenants', error);
                setApartmentTenants([]);
                return;
            }
            const mapped = (data ?? []).map((tenant) => {
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
                    status: 'active',
                    createdAt: tenant.created_at,
                    houseBlockId: blockId,
                    houseId: house?.id ?? null,
                    apartmentId: block?.apartment_id ?? null
                };
            });
            setApartmentTenants(mapped);
        };
        loadApartments();
    }, [user?.id]);
    useEffect(() => {
        if (selectedApartmentId === 'all') {
            setSelectedBlockId('all');
            return;
        }
        if (selectedBlockId !== 'all') {
            const blockBelongsToApartment = blocks.some((block) => block.id === selectedBlockId && block.apartment_id === selectedApartmentId);
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
    const block = useMemo(() => blocks.find((blockData) => blockData.id === selectedBlockId), [blocks, selectedBlockId]);
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
        return tenantsInApartment.filter((tenant) => (tenant.houseNumber ?? '').toUpperCase().startsWith(blockPrefix));
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
        return unitsInApartment.filter((unit) => (unit.unitNumber ?? '').toUpperCase().startsWith(blockPrefix));
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
            status: 'vacant',
            createdAt: apartment.created_at
        };
    }, [selectedApartmentId, apartments]);
    const unitsForDropdown = apartmentUnitOption ? [apartmentUnitOption] : filteredUnits;
    const tenantIdsInBlock = useMemo(() => {
        if (selectedBlockId === 'all' || !blockPrefix) {
            return null;
        }
        return new Set(filteredTenants.map((tenant) => tenant.id));
    }, [filteredTenants, selectedBlockId, blockPrefix]);
    const paymentsAfterFilters = useMemo(() => {
        let rows = payments;
        if (selectedApartmentId !== 'all') {
            rows = rows.filter((payment) => unitsByProperty.has(payment.unitId));
        }
        if (tenantIdsInBlock && selectedBlockId !== 'all') {
            rows = rows.filter((payment) => tenantIdsInBlock.has(payment.tenantId));
        }
        return rows;
    }, [payments, selectedApartmentId, unitsByProperty, tenantIdsInBlock, selectedBlockId]);
    const filteredPayments = useMemo(() => selectedUnitId === 'all'
        ? paymentsAfterFilters
        : paymentsAfterFilters.filter((payment) => payment.unitId === selectedUnitId), [paymentsAfterFilters, selectedUnitId]);
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
    const filteredTotalCollected = useMemo(() => filteredPayments.reduce((sum, payment) => sum + payment.amountPaid, 0), [filteredPayments]);
    const selectedMonth = useMemo(() => filteredPayments[0]?.monthPaidFor ?? new Date().toISOString().slice(0, 7), [filteredPayments]);
    const paymentSums = useMemo(() => {
        const map = new Map();
        filteredPayments
            .filter((payment) => payment.monthPaidFor === selectedMonth)
            .forEach((payment) => {
            const existing = map.get(payment.unitId) ?? { amount: 0, name: payment.tenantName };
            map.set(payment.unitId, {
                amount: existing.amount + payment.amountPaid,
                name: existing.name ?? payment.tenantName
            });
        });
        return map;
    }, [filteredPayments, selectedMonth]);
    const tenantsByUnit = useMemo(() => {
        const map = new Map();
        filteredTenants.forEach((tenant) => {
            if (tenant.unitId) {
                map.set(tenant.unitId, tenant.fullName);
            }
        });
        return map;
    }, [filteredTenants]);
    const outstanding = useMemo(() => {
        const rows = filteredUnits
            .map((unit) => {
            const { amount = 0, name } = paymentSums.get(unit.id) ?? {};
            const balance = Math.max(unit.rentAmount - amount, 0);
            const displayName = tenantsByUnit.get(unit.id) ?? name ?? `Unit ${unit.unitNumber ?? unit.id}`;
            return {
                unit,
                paid: amount,
                balance,
                displayName
            };
        })
            .filter((row) => row.balance > 0)
            .sort((a, b) => b.balance - a.balance);
        const total = rows.reduce((sum, row) => sum + row.balance, 0);
        return { rows, total };
    }, [paymentSums, tenantsByUnit, filteredUnits]);
    const formattedMonth = useMemo(() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        if (!Number.isFinite(year) || !Number.isFinite(month)) {
            return selectedMonth;
        }
        return new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    }, [selectedMonth]);
    return (_jsxs("section", { className: "space-y-5", children: [_jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsxs("label", { className: "input-field", children: [_jsx("span", { children: "Filter by Apartment" }), _jsxs("select", { value: selectedApartmentId, onChange: (e) => setSelectedApartmentId(e.target.value), className: "w-full md:w-48 p-2 border rounded-lg", children: [_jsx("option", { value: "all", children: "All Apartments" }), apartments.map((apt) => (_jsx("option", { value: apt.id, children: apt.name }, apt.id)))] })] }), _jsxs("label", { className: "input-field", children: [_jsx("span", { children: "Filter by Block" }), _jsxs("select", { value: selectedBlockId, onChange: (e) => setSelectedBlockId(e.target.value), className: "w-full md:w-48 p-2 border rounded-lg", disabled: selectedApartmentId === 'all', children: [_jsx("option", { value: "all", children: "All Blocks" }), apartmentsFilterBlocks.map((block) => (_jsx("option", { value: block.id, children: block.block_name }, block.id)))] })] })] }), _jsxs("div", { children: [_jsx("h1", { children: "Rent Paid" }), _jsxs("p", { children: ["Total collected this month: ", formatCurrency(filteredTotalCollected)] })] }), _jsxs("label", { className: "input-field", children: [_jsxs("span", { children: ["Filter by Unit", selectedApartmentId !== 'all' && apartmentsFilterBlocks.length > 0 && (_jsxs(_Fragment, { children: [" (", apartmentsFilterBlocks.length, " block", apartmentsFilterBlocks.length === 1 ? '' : 's', ")"] }))] }), _jsxs("select", { value: selectedUnitId, onChange: (e) => setSelectedUnitId(e.target.value), className: "w-full md:w-48 p-2 border rounded-lg", children: [_jsx("option", { value: "all", children: "All Units" }), unitsForDropdown.map((unit) => (_jsx("option", { value: unit.id, children: selectedApartmentId !== 'all'
                                            ? apartments.find((apt) => apt.id === unit.id)?.name ?? unit.unitNumber ?? unit.id
                                            : `Unit ${unit.unitNumber ?? unit.id}` }, unit.id))), filteredUnits.length === 0 &&
                                        selectedApartmentId !== 'all' &&
                                        apartmentsFilterBlocks.length > 0 &&
                                        apartmentsFilterBlocks.map((block) => (_jsxs("option", { value: "", disabled: true, children: ["Block ", block.block_name, " (no units yet)"] }, `block-${block.id}`)))] })] }), _jsx(Button, { type: "button", onClick: () => setShowPaymentForm((v) => !v), children: showPaymentForm ? 'Hide Form' : 'Record Payment' })] }), showPaymentForm && (_jsx(PaymentForm, { tenants: selectedApartmentId === 'all' ? undefined : apartmentTenantsInBlock, units: unitsForDropdown, apartmentId: selectedApartmentId !== 'all' ? selectedApartmentId : undefined, apartmentBlockId: selectedBlockId !== 'all' ? selectedBlockId : undefined })), _jsx(RentTable, { payments: filteredPayments })] }));
};
export default RentPaid;
