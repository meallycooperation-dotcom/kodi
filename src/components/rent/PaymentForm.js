import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { insertPayment } from '../../services/paymentService';
import { fetchUnits } from '../../services/unitService';
import { fetchTenants } from '../../services/tenantService';
import useAuth from '../../hooks/useAuth';
import usePayments from '../../hooks/usePayments';
const PaymentForm = () => {
    const { user } = useAuth();
    const { refresh } = usePayments();
    const [units, setUnits] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [form, setForm] = useState({
        tenantId: '',
        unitId: '',
        amountPaid: '',
        paymentDate: '',
        monthPaidFor: '',
        paymentMethod: '',
        reference: ''
    });
    useEffect(() => {
        if (!user?.id) {
            setUnits([]);
            setTenants([]);
            setDataLoading(false);
            return;
        }
        const loadData = async () => {
            setDataLoading(true);
            try {
                const [unitsData, tenantsData] = await Promise.all([
                    fetchUnits(undefined, 'all', user.id),
                    fetchTenants(user.id)
                ]);
                setUnits(unitsData);
                setTenants(tenantsData);
            }
            catch (error) {
                console.error('Failed to load data', error);
            }
            finally {
                setDataLoading(false);
            }
        };
        loadData();
    }, [user?.id]);
    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!user) {
            setStatus('Sign in to record payments.');
            return;
        }
        setLoading(true);
        setStatus(null);
        try {
            await insertPayment({
                tenantId: form.tenantId,
                unitId: form.unitId,
                amountPaid: parseFloat(form.amountPaid) || 0,
                paymentDate: form.paymentDate,
                monthPaidFor: form.monthPaidFor,
                paymentMethod: form.paymentMethod || undefined,
                reference: form.reference || undefined
            });
            setStatus('Payment recorded successfully.');
            setForm({
                tenantId: '',
                unitId: '',
                amountPaid: '',
                paymentDate: '',
                monthPaidFor: '',
                paymentMethod: '',
                reference: ''
            });
            await refresh(); // Refresh the payments list
        }
        catch (error) {
            console.error(error);
            setStatus('Failed to record payment.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("form", { className: "payment-form space-y-3", onSubmit: handleSubmit, children: [_jsxs("label", { className: "input-field", children: [_jsx("span", { children: "Tenant" }), _jsxs("select", { value: form.tenantId, onChange: (event) => handleChange('tenantId', event.target.value), className: "w-full mb-4 p-3 border rounded-lg", required: true, children: [_jsx("option", { value: "", children: dataLoading ? 'Loading tenants...' : 'Select a tenant' }), tenants.map((tenant) => (_jsx("option", { value: tenant.id, children: tenant.fullName }, tenant.id)))] })] }), _jsxs("label", { className: "input-field", children: [_jsx("span", { children: "Unit" }), _jsxs("select", { value: form.unitId, onChange: (event) => handleChange('unitId', event.target.value), className: "w-full mb-4 p-3 border rounded-lg", required: true, children: [_jsx("option", { value: "", children: dataLoading ? 'Loading units...' : 'Select a unit' }), units.map((unit) => (_jsx("option", { value: unit.id, children: unit.unitNumber || unit.id }, unit.id)))] })] }), _jsx(Input, { label: "Amount Paid", name: "amountPaid", type: "number", value: form.amountPaid, onChange: (event) => handleChange('amountPaid', event.target.value), placeholder: "Ksh. 0.00", required: true }), _jsx(Input, { label: "Payment Date", name: "paymentDate", type: "date", value: form.paymentDate, onChange: (event) => handleChange('paymentDate', event.target.value), required: true }), _jsx(Input, { label: "Month Paid For", name: "monthPaidFor", type: "date", value: form.monthPaidFor, onChange: (event) => handleChange('monthPaidFor', event.target.value), required: true }), _jsx(Input, { label: "Payment Method", name: "paymentMethod", value: form.paymentMethod, onChange: (event) => handleChange('paymentMethod', event.target.value), placeholder: "e.g. Cash, Bank Transfer, M-Pesa" }), _jsx(Input, { label: "Reference", name: "reference", value: form.reference, onChange: (event) => handleChange('reference', event.target.value), placeholder: "Transaction reference or note" }), _jsx(Button, { type: "submit", disabled: loading, children: loading ? 'Recording…' : 'Record Payment' }), status && _jsx("p", { children: status })] }));
};
export default PaymentForm;
