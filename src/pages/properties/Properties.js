import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { insertUnit } from '../../services/unitService';
import { insertHouse } from '../../services/houseService';
import useAuth from '../../hooks/useAuth';
import useTenants from '../../hooks/useTenants';
import useUnits from '../../hooks/useUnits';
import Modal from '../../components/ui/Modal';
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
    const [statusMessage, setStatusMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [selectedUnitId, setSelectedUnitId] = useState(null);
    const [tenantModal, setTenantModal] = useState(null);
    const dateFormatter = useMemo(() => new Intl.DateTimeFormat('en-KE', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }), []);
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
        const map = new Map();
        tenants.forEach((tenant) => {
            if (!tenant.unitId)
                return;
            const isActiveTenant = tenant.status === 'active' || tenant.status === 'late';
            if (!isActiveTenant)
                return;
            map.set(tenant.unitId, (map.get(tenant.unitId) ?? 0) + 1);
        });
        return map;
    }, [tenants]);
    const occupiedHouseNumbersByUnit = useMemo(() => {
        const map = new Map();
        tenants.forEach((tenant) => {
            if (!tenant.unitId || !tenant.houseNumber)
                return;
            const isActiveTenant = tenant.status === 'active' || tenant.status === 'late';
            if (!isActiveTenant)
                return;
            const num = Number(tenant.houseNumber);
            if (Number.isNaN(num))
                return;
            const set = map.get(tenant.unitId) ?? new Set();
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
            console.error(`❌ Occupancy mismatch for unit ${selectedUnit.unitNumber || selectedUnit.id}: ${tenantCount} tenants for ${capacity} houses`);
        }
        else {
            console.log(`✅ Occupancy OK for unit ${selectedUnit.unitNumber || selectedUnit.id}: ${tenantCount}/${capacity} occupied`);
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
        const occupiedHouseSet = occupiedHouseNumbersByUnit.get(selectedUnit.id) ?? new Set();
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
            return new Map();
        }
        const map = new Map();
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
    const handleHouseClick = (houseNumber) => {
        if (!tenantByHouseNumber.has(houseNumber)) {
            return;
        }
        setTenantModal(tenantByHouseNumber.get(houseNumber) ?? null);
    };
    const closeTenantModal = () => setTenantModal(null);
    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!user) {
            setStatusMessage('Sign in to create units.');
            return;
        }
        setLoading(true);
        setStatusMessage(null);
        try {
            const createdUnit = await insertUnit({
                unitNumber: form.unitNumber,
                rentAmount: parseFloat(form.rentAmount) || 0,
                numberOfHouses: form.numberOfHouses ? parseInt(form.numberOfHouses, 10) : undefined,
                status: form.status,
                userId: user.id
            });
            const housesToCreate = Math.max(1, parseInt(form.numberOfHouses || '1', 10));
            await Promise.all(Array.from({ length: housesToCreate }, (_, index) => insertHouse({
                unitId: createdUnit.id,
                houseNumber: String(index + 1),
                status: form.status
            })));
            await refresh('all');
            setStatusMessage('Unit created and houses seeded.');
            setForm(initialState);
            setSelectedUnitId(null);
        }
        catch (error) {
            console.error(error);
            setStatusMessage('Failed to create unit');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (!selectedUnitId && displayedUnits.length > 0) {
            console.log('🎯 Auto-selecting first unit:', displayedUnits[0]);
            setSelectedUnitId(displayedUnits[0].id);
        }
    }, [displayedUnits, selectedUnitId]);
    useEffect(() => {
        setTenantModal(null);
    }, [selectedUnitId]);
    return (_jsxs("section", { className: "space-y-5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { children: "Propertiess" }), _jsx("p", { children: "Register and monitor every unit across your portfolios." })] }), _jsx(Button, { type: "button", onClick: () => setShowForm((v) => !v), children: showForm ? 'Hide Form' : 'Create Unit' })] }), showForm && (_jsxs("form", { className: "grid gap-4 md:grid-cols-2", onSubmit: handleSubmit, children: [_jsx(Input, { label: "Unit number", name: "unitNumber", value: form.unitNumber, onChange: (event) => handleChange('unitNumber', event.target.value) }), _jsx(Input, { label: "Rent amount", name: "rentAmount", type: "number", value: form.rentAmount, onChange: (event) => handleChange('rentAmount', event.target.value) }), _jsx(Input, { label: "Number of houses", name: "numberOfHouses", type: "number", value: form.numberOfHouses, onChange: (event) => handleChange('numberOfHouses', event.target.value) }), _jsxs("label", { className: "input-field", children: [_jsx("span", { children: "Status" }), _jsxs("select", { value: form.status, onChange: (event) => handleChange('status', event.target.value), children: [_jsx("option", { value: "vacant", children: "Vacant" }), _jsx("option", { value: "occupied", children: "Occupied" }), _jsx("option", { value: "maintenance", children: "Maintenance" })] })] }), _jsx(Button, { type: "submit", disabled: loading, className: "md:col-span-2", children: loading ? 'Saving…' : 'Create unit' })] })), statusMessage && _jsx("p", { children: statusMessage }), _jsxs("section", { className: "mt-6", children: [_jsx("h2", { className: "font-semibold text-lg", children: "Units" }), displayedUnits.length > 0 ? (_jsx("ul", { className: "mt-2 space-y-2", children: displayedUnits.map((unit) => (_jsxs("li", { className: `unit-card border p-3 rounded-lg transition-shadow ${selectedUnitId === unit.id ? 'unit-card--selected' : ''}`, onClick: () => setSelectedUnitId(unit.id), children: [_jsx("p", { className: "font-medium", children: unit.unitNumber || 'Unit' }), _jsxs("p", { children: ["Rent: ", formatCurrency(unit.rentAmount)] }), _jsxs("p", { children: ["Status: ", unit.status] }), _jsxs("p", { children: ["Houses: ", unit.numberOfHouses ?? 1] })] }, unit.id))) })) : (_jsx("p", { className: "mt-2 text-sm text-gray-600", children: "No vacant units found." }))] }), _jsxs("section", { className: "mt-8", children: [_jsx("h2", { className: "font-semibold text-lg", children: "Occupancy grid" }), _jsx("p", { className: "text-sm text-gray-500", children: "Click any unit above to release the occupancy grid: green means houses occupied, red means houses still available." }), selectedUnit ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "mt-4 grid grid-cols-2 gap-3 md:grid-cols-4", children: occupancyState.houses.map((house) => {
                                    const occupant = tenantByHouseNumber.get(house.number);
                                    return (_jsxs("div", { className: `p-4 rounded-lg border-2 text-center font-medium ${house.occupied
                                            ? 'bg-green-100 border-green-300 text-green-800 cursor-pointer'
                                            : 'bg-red-100 border-red-300 text-red-800'}`, onClick: () => occupant && handleHouseClick(house.number), onKeyDown: (event) => {
                                            if (!occupant)
                                                return;
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                handleHouseClick(house.number);
                                            }
                                        }, role: occupant ? 'button' : 'presentation', tabIndex: occupant ? 0 : undefined, children: [_jsxs("p", { className: "text-sm text-gray-700", children: ["House ", house.number] }), _jsx("p", { className: "text-lg font-semibold", children: house.occupied ? 'Occupied' : 'Vacant' })] }, house.id));
                                }) }), _jsxs("div", { className: "status-grid", children: [_jsxs("article", { className: "status-card status-card--occupied", children: [_jsx("p", { className: "status-card__label", children: "Occupied houses" }), _jsx("p", { className: "status-card__value", children: occupancyState.occupied }), _jsx("p", { className: "status-card__meta", children: "Currently collecting rent for this unit" })] }), _jsxs("article", { className: "status-card status-card--unoccupied", children: [_jsx("p", { className: "status-card__label", children: "Not occupied houses" }), _jsx("p", { className: "status-card__value", children: occupancyState.notOccupied }), _jsx("p", { className: "status-card__meta", children: "Needs tenants or in maintenance" })] })] }), tenantModal && (_jsxs(Modal, { title: `Tenant in house ${tenantModal.houseNumber ?? ''}`, children: [_jsxs("p", { className: "text-sm text-gray-600", children: [_jsx("strong", { children: "Name:" }), " ", tenantModal.fullName] }), _jsxs("p", { className: "text-sm text-gray-600", children: [_jsx("strong", { children: "Phone:" }), " ", tenantModal.phone ?? 'Not provided'] }), _jsxs("p", { className: "text-sm text-gray-600", children: [_jsx("strong", { children: "Email:" }), " ", tenantModal.email ?? 'Not provided'] }), _jsxs("p", { className: "text-sm text-gray-600", children: [_jsx("strong", { children: "Move-in date:" }), ' ', tenantModal.moveInDate ? dateFormatter.format(new Date(tenantModal.moveInDate)) : 'TBD'] }), _jsxs("p", { className: "text-sm text-gray-600", children: [_jsx("strong", { children: "Status:" }), " ", tenantModal.status] }), _jsx("div", { className: "mt-4 flex justify-end", children: _jsx(Button, { variant: "ghost", type: "button", onClick: closeTenantModal, children: "Close" }) })] }))] })) : (_jsx("p", { className: "mt-2 text-sm text-gray-500", children: "Select a vacant unit above to view its occupancy breakdown." }))] })] }));
};
export default Properties;
