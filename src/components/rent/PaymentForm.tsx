import { FormEvent, useEffect, useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { insertPayment, insertApartmentPayment } from '../../services/paymentService';
import { fetchUnits } from '../../services/unitService';
import { fetchTenants } from '../../services/tenantService';
import type { Unit } from '../../types/unit';
import type { Tenant } from '../../types/tenant';
import useAuth from '../../hooks/useAuth';
import usePayments from '../../hooks/usePayments';

type PaymentFormProps = {
  tenants?: Tenant[];
  units?: Unit[];
  apartmentId?: string;
  apartmentBlockId?: string;
  initialTenantId?: string;
  initialUnitId?: string;
  clientInfo?: {
    fullName: string;
    phone?: string;
    email?: string;
    houseNumber?: string;
    unitNumber?: string;
  };
};

type PaymentTenant = Tenant & {
  houseId?: string | null;
  houseBlockId?: string | null;
};

const PaymentForm = ({
  tenants: tenantOptions,
  units: unitOptions,
  apartmentId,
  apartmentBlockId,
  initialTenantId,
  initialUnitId,
  clientInfo
}: PaymentFormProps = {}) => {
  const { user } = useAuth();
  const { refresh } = usePayments();
  const [units, setUnits] = useState<Unit[]>(unitOptions ?? []);
  const [tenants, setTenants] = useState<PaymentTenant[]>(tenantOptions ?? []);
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
    setForm((prev) => {
      const nextForm = { ...prev };
      if (initialTenantId !== undefined) {
        nextForm.tenantId = initialTenantId;
      }
      if (initialUnitId !== undefined) {
        nextForm.unitId = initialUnitId;
      }
      return nextForm;
    });
  }, [initialTenantId, initialUnitId]);

  useEffect(() => {
    if (unitOptions) {
      setUnits(unitOptions);
      return;
    }

    const loadUnits = async () => {
      if (!user?.id) {
        setUnits([]);
        return;
      }
      try {
        const unitsData = await fetchUnits(undefined, 'all', user.id);
        setUnits(unitsData);
      } catch (error) {
        console.error('Failed to load units', error);
      }
    };

    loadUnits();
  }, [unitOptions, user?.id]);

  useEffect(() => {
    if (tenantOptions) {
      setTenants(tenantOptions);
      return;
    }

    const loadTenants = async () => {
      if (!user?.id) {
        setTenants([]);
        return;
      }
      try {
        const tenantsData = await fetchTenants(user.id);
        setTenants(tenantsData);
      } catch (error) {
        console.error('Failed to load tenants', error);
      }
    };

    loadTenants();
  }, [tenantOptions, user?.id]);

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
      const paymentPayload = {
        tenantId: form.tenantId,
        unitId: form.unitId,
        amountPaid: parseFloat(form.amountPaid) || 0,
        paymentDate: form.paymentDate,
        monthPaidFor: form.monthPaidFor,
        paymentMethod: form.paymentMethod || undefined,
        reference: form.reference || undefined
      };

      if (!apartmentId) {
        await insertPayment(paymentPayload);
      } else {
        const tenantRecord = tenants.find((tenant) => tenant.id === form.tenantId);
        await insertApartmentPayment({
          tenantId: form.tenantId,
          houseId: tenantRecord?.houseId ?? null,
          blockId: apartmentBlockId ?? tenantRecord?.houseBlockId ?? null,
          apartmentId,
          amountPaid: paymentPayload.amountPaid,
          paymentDate: paymentPayload.paymentDate || undefined,
          monthPaidFor: paymentPayload.monthPaidFor,
          paymentMethod: paymentPayload.paymentMethod,
          reference: paymentPayload.reference
        });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('apartment-payment-recorded', {
              detail: { apartmentId }
            })
          );
        }
      }

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
      {clientInfo && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm space-y-0.5">
          <p className="font-semibold text-gray-900">{clientInfo.fullName}</p>
          {clientInfo.phone && <p>Phone: {clientInfo.phone}</p>}
          {clientInfo.email && <p>Email: {clientInfo.email}</p>}
          {clientInfo.unitNumber && <p>Unit: {clientInfo.unitNumber}</p>}
          {clientInfo.houseNumber && <p>House: {clientInfo.houseNumber}</p>}
        </div>
      )}
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
