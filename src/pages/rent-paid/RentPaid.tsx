import { useMemo, useState } from 'react';
import PaymentForm from '../../components/rent/PaymentForm';
import RentTable from '../../components/rent/RentTable';
import Button from '../../components/ui/Button';
import usePayments from '../../hooks/usePayments';
import useTenants from '../../hooks/useTenants';
import useUnits from '../../hooks/useUnits';
import useAuth from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatCurrency';

const RentPaid = () => {
  const { payments, totalCollected } = usePayments();
  const { user } = useAuth();
  const { units } = useUnits('all', user?.id);
  const { tenants } = useTenants();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | 'all'>('all');

  const filteredPayments = useMemo(
    () =>
      selectedUnitId === 'all'
        ? payments
        : payments.filter((payment) => payment.unitId === selectedUnitId),
    [payments, selectedUnitId]
  );

  const filteredUnits = useMemo(
    () =>
      selectedUnitId === 'all'
        ? units
        : units.filter((unit) => unit.id === selectedUnitId),
    [units, selectedUnitId]
  );

  const filteredTenants = useMemo(
    () =>
      selectedUnitId === 'all'
        ? tenants
        : tenants.filter((tenant) => tenant.unitId === selectedUnitId),
    [tenants, selectedUnitId]
  );

  const filteredTotalCollected = useMemo(
    () =>
      filteredPayments.reduce((sum, payment) => sum + payment.amountPaid, 0),
    [filteredPayments]
  );

  const selectedMonth = useMemo(
    () => filteredPayments[0]?.monthPaidFor ?? new Date().toISOString().slice(0, 7),
    [filteredPayments]
  );

  const paymentSums = useMemo(() => {
    const map = new Map<string, { amount: number; name?: string }>();
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
    const map = new Map<string, string>();
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

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1>Rent Paid</h1>
          <p>Total collected this month: {formatCurrency(filteredTotalCollected)}</p>
        </div>
        <label className="input-field">
          <span>Filter by Unit</span>
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value as string | 'all')}
            className="w-full md:w-48 p-2 border rounded-lg"
          >
            <option value="all">All Units</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                Unit {unit.unitNumber}
              </option>
            ))}
          </select>
        </label>
        <Button type="button" onClick={() => setShowPaymentForm((v) => !v)}>
          {showPaymentForm ? 'Hide Form' : 'Record Payment'}
        </Button>
      </div>

      {showPaymentForm && <PaymentForm />}

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Outstanding balances for {formattedMonth}</h2>
          <p className="text-sm text-gray-500">
            Subtracts paid amounts from the unit rent, using the latest recorded month to highlight who still owes.
          </p>
        </div>
        {outstanding.rows.length ? (
          <div className="space-y-3 rounded border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">Total outstanding</p>
              <p className="text-xl font-semibold">{formatCurrency(outstanding.total)}</p>
            </div>
            <ul className="space-y-3">
              {outstanding.rows.map((row) => (
                <li
                  key={row.unit.id}
                  className="flex flex-col gap-2 rounded border border-dashed border-gray-200 p-3 shadow-sm md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold">{row.displayName}</p>
                    <p className="text-sm text-gray-500">Unit {row.unit.unitNumber || row.unit.id}</p>
                  </div>
                  <div className="text-sm text-gray-500 md:text-right">
                    <p>Expected: {formatCurrency(row.unit.rentAmount)}</p>
                    <p>Paid: {formatCurrency(row.paid)}</p>
                  </div>
                  <p className="text-lg font-semibold text-amber-600">{formatCurrency(row.balance)}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No outstanding balances detected for {formattedMonth}.</p>
        )}
      </section>

      <RentTable payments={payments} />
    </section>
  );
};

export default RentPaid;
