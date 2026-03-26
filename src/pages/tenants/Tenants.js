import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import TenantCard from '../../components/tenants/TenantCard';
import TenantTable from '../../components/tenants/TenantTable';
import useAuth from '../../hooks/useAuth';
import useRentSettings from '../../hooks/useRentSettings';
import useTenants from '../../hooks/useTenants';
import { insertRentSetting, insertTenant } from '../../services/tenantService';
import { fetchUnits } from '../../services/unitService';
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
    const { tenants, refresh } = useTenants(user?.id);
    const { settings } = useRentSettings(user?.id);
    const [units, setUnits] = useState([]);
    const [unitsLoading, setUnitsLoading] = useState(true);
    const [form, setForm] = useState(initialForm);
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    useEffect(() => {
        if (!user?.id) {
            setUnits([]);
            setUnitsLoading(false);
            return;
        }
        const loadUnits = async () => {
            setUnitsLoading(true);
            try {
                const data = await fetchUnits(undefined, 'all', user.id);
                setUnits(data);
            }
            catch (error) {
                console.error('Failed to load units', error);
            }
            finally {
                setUnitsLoading(false);
            }
        };
        loadUnits();
    }, [user?.id]);
    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };
    const handleUnitChange = (unitId) => {
        const selectedUnit = units.find((unit) => unit.id === unitId);
        setForm((prev) => ({
            ...prev,
            unitId,
            defaultRent: selectedUnit ? String(selectedUnit.rentAmount) : ''
        }));
    };
    const handleSubmit = async (event) => {
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
        }
        catch (error) {
            console.error(error);
            setStatus('Failed to create record.');
        }
        finally {
            setLoading(false);
        }
    };
    const featuredTenant = tenants[0];
    return (_jsxs("section", { className: "space-y-5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { children: "Tenants" }), _jsx("p", { children: "Track tenant profiles and rent mode configurations." })] }), _jsx(Button, { type: "button", onClick: () => setShowForm((v) => !v), children: showForm ? 'Hide Form' : 'Create Tenant' })] }), showForm && (_jsxs("form", { className: "tenant-form space-y-4", onSubmit: handleSubmit, children: [_jsx(Input, { label: "Full name", name: "fullName", value: form.fullName, onChange: (event) => handleChange('fullName', event.target.value) }), _jsxs("label", { className: "input-field", children: [_jsx("span", { children: "Unit" }), _jsxs("select", { value: form.unitId, onChange: (event) => handleUnitChange(event.target.value), className: "w-full mb-4 p-3 border rounded-lg", required: true, children: [_jsx("option", { value: "", children: unitsLoading ? 'Loading units...' : 'Select a unit' }), units.map((unit) => (_jsx("option", { value: unit.id, children: unit.unitNumber || unit.id }, unit.id)))] })] }), _jsx(Input, { label: "Email", name: "email", type: "email", value: form.email, onChange: (event) => handleChange('email', event.target.value) }), _jsx(Input, { label: "Phone", name: "phone", value: form.phone, onChange: (event) => handleChange('phone', event.target.value) }), _jsx(Input, { label: "Move-in date", name: "moveInDate", type: "date", value: form.moveInDate, onChange: (event) => handleChange('moveInDate', event.target.value) }), _jsx(Input, { label: "Rent mode", name: "rentMode", value: form.rentMode, onChange: (event) => handleChange('rentMode', event.target.value), placeholder: "e.g. monthly" }), _jsx(Input, { label: "Default rent", name: "defaultRent", type: "number", value: form.defaultRent, onChange: (event) => handleChange('defaultRent', event.target.value) }), _jsx(Button, { type: "submit", disabled: loading, children: loading ? 'Saving…' : 'Create tenant' }), status && _jsx("p", { children: status })] })), featuredTenant && _jsx(TenantCard, { tenant: featuredTenant }), settings.length > 0 && (_jsxs("div", { className: "card", children: [_jsx("h2", { children: "Rent settings" }), _jsx("ul", { className: "space-y-2", children: settings.map((setting) => (_jsxs("li", { children: [_jsx("strong", { children: setting.rent_mode }), " \u00B7 default ", setting.default_rent.toLocaleString(), " \u00B7 created", ' ', new Date(setting.created_at).toLocaleDateString()] }, setting.id))) })] })), _jsx(TenantTable, { tenants: tenants })] }));
};
export default Tenants;
