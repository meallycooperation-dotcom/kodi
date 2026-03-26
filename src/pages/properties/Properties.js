import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { insertUnit } from '../../services/unitService';
import useAuth from '../../hooks/useAuth';
import useUnits from '../../hooks/useUnits';
const initialState = {
    unitNumber: '',
    rentAmount: '',
    numberOfHouses: '',
    status: 'vacant'
};
const Properties = () => {
    const { user } = useAuth();
    const { units, refresh } = useUnits('all', user?.id);
    const [form, setForm] = useState(initialState);
    const [statusMessage, setStatusMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [selectedUnitId, setSelectedUnitId] = useState(null);
    const availableUnits = useMemo(() => units.filter((unit) => unit.status === 'vacant'), [units]);
    const selectedUnit = selectedUnitId ? units.find((unit) => unit.id === selectedUnitId) : null;
    const occupancyGrid = useMemo(() => {
        if (!selectedUnit) {
            return [];
        }
        const houses = selectedUnit.numberOfHouses ?? 1;
        const occupied = selectedUnit.status === 'occupied' ? houses : 0;
        return Array.from({ length: houses }, (_, index) => ({
            id: `${selectedUnit.id}-house-${index + 1}`,
            occupied: index < occupied
        }));
    }, [selectedUnit]);
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
            await insertUnit({
                unitNumber: form.unitNumber,
                rentAmount: parseFloat(form.rentAmount) || 0,
                numberOfHouses: form.numberOfHouses ? parseInt(form.numberOfHouses, 10) : undefined,
                status: form.status,
                userId: user.id
            });
            await refresh('all');
            setStatusMessage('Unit created');
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
        if (!selectedUnitId && availableUnits.length > 0) {
            setSelectedUnitId(availableUnits[0].id);
        }
    }, [availableUnits, selectedUnitId]);
    return (_jsxs("section", { className: "space-y-5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { children: "Properties" }), _jsx("p", { children: "Register and monitor every unit across your portfolio." })] }), _jsx(Button, { type: "button", onClick: () => setShowForm((v) => !v), children: showForm ? 'Hide Form' : 'Create Unit' })] }), showForm && (_jsxs("form", { className: "grid gap-4 md:grid-cols-2", onSubmit: handleSubmit, children: [_jsx(Input, { label: "Unit number", name: "unitNumber", value: form.unitNumber, onChange: (event) => handleChange('unitNumber', event.target.value) }), _jsx(Input, { label: "Rent amount", name: "rentAmount", type: "number", value: form.rentAmount, onChange: (event) => handleChange('rentAmount', event.target.value) }), _jsx(Input, { label: "Number of houses", name: "numberOfHouses", type: "number", value: form.numberOfHouses, onChange: (event) => handleChange('numberOfHouses', event.target.value) }), _jsxs("label", { className: "input-field", children: [_jsx("span", { children: "Status" }), _jsxs("select", { value: form.status, onChange: (event) => handleChange('status', event.target.value), children: [_jsx("option", { value: "vacant", children: "Vacant" }), _jsx("option", { value: "occupied", children: "Occupied" }), _jsx("option", { value: "maintenance", children: "Maintenance" })] })] }), _jsx(Button, { type: "submit", disabled: loading, className: "md:col-span-2", children: loading ? 'Saving…' : 'Create unit' })] })), statusMessage && _jsx("p", { children: statusMessage }), _jsxs("section", { className: "mt-6", children: [_jsx("h2", { className: "font-semibold text-lg", children: "Available Units (vacant)" }), availableUnits.length > 0 ? (_jsx("div", { className: "mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: availableUnits.map((unit) => (_jsxs("div", { className: `unit-card border p-4 rounded-lg transition-shadow cursor-pointer ${selectedUnitId === unit.id ? 'unit-card--selected bg-blue-50 border-blue-300' : 'hover:shadow-md'}`, onClick: () => setSelectedUnitId(unit.id), children: [_jsx("p", { className: "font-medium", children: unit.unitNumber || 'Unit' }), _jsxs("p", { children: ["Rent: $", unit.rentAmount] }), _jsxs("p", { children: ["Status: ", unit.status] }), _jsxs("p", { children: ["Houses: ", unit.numberOfHouses ?? 1] })] }, unit.id))) })) : (_jsx("p", { className: "mt-2 text-sm text-gray-600", children: "No vacant units found." }))] }), _jsxs("section", { className: "mt-8", children: [_jsx("h2", { className: "font-semibold text-lg", children: "Occupancy grid" }), _jsx("p", { className: "text-sm text-gray-500", children: "Click any unit above to view the occupancy grid: green means houses occupied, red means houses still available." }), selectedUnit ? (_jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mt-4", children: occupancyGrid.map((house) => (_jsxs("div", { className: `p-4 rounded-lg border-2 text-center font-medium ${house.occupied
                                ? 'bg-green-100 border-green-300 text-green-800'
                                : 'bg-red-100 border-red-300 text-red-800'}`, children: ["House ", house.id.split('-').pop(), _jsx("br", {}), house.occupied ? 'Occupied' : 'Vacant'] }, house.id))) })) : (_jsx("p", { className: "mt-2 text-sm text-gray-500", children: "Select a vacant unit above to view its occupancy breakdown." }))] })] }));
};
export default Properties;
