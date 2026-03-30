import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
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
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [selectedUnitId, setSelectedUnitId] = useState('all');
    const [selectedFormUnitId, setSelectedFormUnitId] = useState('');
    const occupiedHouseNumbersByUnit = useMemo(() => {
        const map = new Map();
        tenants.forEach((tenant) => {
            if (!tenant.unitId || !tenant.houseNumber)
                return;
            const isActiveTenant = tenant.status === 'active' || tenant.status === 'late';
            if (!isActiveTenant)
                return;
            const houseNum = Number(tenant.houseNumber);
            if (Number.isNaN(houseNum))
                return;
            const set = map.get(tenant.unitId) ?? new Set();
            set.add(houseNum);
            map.set(tenant.unitId, set);
        });
        return map;
    }, [tenants]);
    const availableHouses = useMemo(() => {
        if (!selectedFormUnitId)
            return [];
        const selectedUnit = units.find((u) => u.id === selectedFormUnitId);
        if (!selectedUnit)
            return [];
        const totalHouses = selectedUnit.numberOfHouses || 0;
        const occupiedSet = occupiedHouseNumbersByUnit.get(selectedFormUnitId) ?? new Set();
        return Array.from({ length: totalHouses }, (_, index) => index + 1)
            .filter((houseNumber) => !occupiedSet.has(houseNumber))
            .map((houseNumber) => ({
            id: `${selectedFormUnitId}-house-${houseNumber}`,
            number: houseNumber
        }));
    }, [selectedFormUnitId, units, occupiedHouseNumbersByUnit]);
    const filteredTenants = useMemo(() => selectedUnitId === 'all'
        ? tenants
        : tenants.filter((tenant) => tenant.unitId === selectedUnitId), [tenants, selectedUnitId]);
    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };
    const handleUnitChange = (unitId) => {
        setSelectedFormUnitId(unitId);
        const selectedUnit = units.find((unit) => unit.id === unitId);
        setForm((prev) => ({
            ...prev,
            unitId,
            houseNumber: '',
            defaultRent: selectedUnit ? String(selectedUnit.rentAmount || '') : ''
        }));
    };
    const handleHouseChange = (houseNumber) => {
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
    const handleSubmit = async (event) => {
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
        }
        catch (error) {
            console.error(error);
            setStatus('Failed to create record.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("section", { className: "space-y-5", children: [_jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { children: "Tenants" }), _jsx("p", { children: "Track tenant profiles and rent mode configurations." })] }), _jsxs("div", { className: "flex flex-col gap-3 md:flex-row md:items-end md:gap-3", children: [_jsxs("label", { className: "input-field", children: [_jsx("span", { children: "Filter by Unit" }), _jsxs("select", { value: selectedUnitId, onChange: (e) => setSelectedUnitId(e.target.value), className: "w-full md:w-48 p-2 border rounded-lg", children: [_jsx("option", { value: "all", children: "All Units" }), units.map((unit) => (_jsxs("option", { value: unit.id, children: ["Unit ", unit.unitNumber] }, unit.id)))] })] }), _jsx(Button, { type: "button", onClick: () => setShowForm((v) => !v), children: showForm ? 'Hide Form' : 'Create Tenant' })] })] }), showForm && (_jsxs("form", { className: "tenant-form space-y-4", onSubmit: handleSubmit, children: [_jsx(Input, { label: "Full name", name: "fullName", value: form.fullName, onChange: (event) => handleChange('fullName', event.target.value) }), _jsxs("label", { className: "input-field", children: [_jsx("span", { children: "Unit" }), _jsxs("select", { value: selectedFormUnitId, onChange: (event) => handleUnitChange(event.target.value), className: "w-full mb-4 p-3 border rounded-lg", required: true, children: [_jsx("option", { value: "", children: "Select a unit" }), units.map((unit) => (_jsx("option", { value: unit.id, children: `Unit ${unit.unitNumber}` }, unit.id)))] })] }), _jsxs("label", { className: "input-field", children: [_jsx("span", { children: "House" }), availableHouses.length > 0 ? (_jsxs("select", { value: form.houseNumber, onChange: (event) => handleHouseChange(event.target.value), className: "w-full mb-4 p-3 border rounded-lg", required: true, children: [_jsx("option", { value: "", children: "Select a house" }), availableHouses.map((house) => (_jsxs("option", { value: String(house.number), children: ["House ", house.number] }, house.id)))] })) : (_jsx("p", { className: "text-sm text-gray-500", children: selectedFormUnitId
                                    ? 'No available houses in this unit (all occupied or under maintenance).'
                                    : 'Select a unit to first choose from its available houses.' }))] }), _jsx(Input, { label: "Email", name: "email", type: "email", value: form.email, onChange: (event) => handleChange('email', event.target.value) }), _jsx(Input, { label: "Phone", name: "phone", value: form.phone, onChange: (event) => handleChange('phone', event.target.value) }), _jsx(Input, { label: "Move-in date", name: "moveInDate", type: "date", value: form.moveInDate, onChange: (event) => handleChange('moveInDate', event.target.value) }), _jsx(Input, { label: "Rent mode", name: "rentMode", value: form.rentMode, onChange: (event) => handleChange('rentMode', event.target.value), placeholder: "e.g. monthly" }), _jsx(Input, { label: "Default rent", name: "defaultRent", type: "number", value: form.defaultRent, onChange: (event) => handleChange('defaultRent', event.target.value) }), _jsx(Button, { type: "submit", disabled: loading, children: loading ? 'Saving…' : 'Create tenant' }), status && _jsx("p", { children: status })] })), _jsx(TenantTable, { tenants: filteredTenants, units: units })] }));
};
export default Tenants;
