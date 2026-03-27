import { FormEvent, useEffect, useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { insertPayment } from '../../services/paymentService';
import { fetchUnits } from '../../services/unitService';
import { fetchTenants } from '../../services/tenantService';
import type { Unit } from '../../types/unit';
import type { Tenant } from '../../types/tenant';
import useAuth from '../../hooks/useAuth';
import usePayments from '../../hooks/usePayments';

const PaymentForm = () => {
  const { user } = useAuth();
  const { refresh } = usePayments();
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

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
    const loadData = async () => {
      try {
        const [unitsData, tenantsData] = await Promise.all([
          fetchUnits(undefined, 'all', user?.id),
          fetchTenants(user?.id)
        ]);
        setUnits(unitsData);
        setTenants(tenantsData);
      } catch (error) {
        console.error('Failed to load data', error);
      }
    };

    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
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
    } catch (error) {
      console.error(error);
      setStatus('Failed to record payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="payment-form space-y-3" onSubmit={handleSubmit}>
      <label className="input-field">
        <span>Tenant</span>
        <select
          value={form.tenantId}
          onChange={(event) => handleChange('tenantId', event.target.value)}
          className="w-full mb-4 p-3 border rounded-lg"
          required
        >
          <option value="">Select a tenant</option>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.fullName}
            </option>
          ))}
        </select>
      </label>

      <label className="input-field">
        <span>Unit</span>
        <select
          value={form.unitId}
          onChange={(event) => handleChange('unitId', event.target.value)}
          className="w-full mb-4 p-3 border rounded-lg"
          required
        >
          <option value="">Select a unit</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.unitNumber || unit.id}
            </option>
          ))}
        </select>
      </label>

      <Input
        label="Amount Paid"
        name="amountPaid"
        type="number"
        value={form.amountPaid}
        onChange={(event) => handleChange('amountPaid', event.target.value)}
        placeholder="Ksh. 0.00"
        required
      />

      <Input
        label="Payment Date"
        name="paymentDate"
        type="date"
        value={form.paymentDate}
        onChange={(event) => handleChange('paymentDate', event.target.value)}
        required
      />

      <Input
        label="Month Paid For"
        name="monthPaidFor"
        type="date"
        value={form.monthPaidFor}
        onChange={(event) => handleChange('monthPaidFor', event.target.value)}
        required
      />

      <Input
        label="Payment Method"
        name="paymentMethod"
        value={form.paymentMethod}
        onChange={(event) => handleChange('paymentMethod', event.target.value)}
        placeholder="e.g. Cash, Bank Transfer, M-Pesa"
      />

      <Input
        label="Reference"
        name="reference"
        value={form.reference}
        onChange={(event) => handleChange('reference', event.target.value)}
        placeholder="Transaction reference or note"
      />

      <Button type="submit" disabled={loading}>
        {loading ? 'Recording…' : 'Record Payment'}
      </Button>
      {status && <p>{status}</p>}
    </form>
  );
};

export default PaymentForm;
