import { useEffect, useMemo, useState } from 'react';
import type { Payment } from '../types/payment';
import useAuth from './useAuth';
import { insertPayment, fetchPayments } from '../services/paymentService';

const usePayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPayments = async (userId?: string) => {
    if (!userId) {
      setPayments([]);
      return;
    }

    try {
      const records = await fetchPayments(userId);
      const mapped = records.map<Payment>((record) => ({
        id: record.id,
        tenantId: record.tenantId,
        unitId: record.unitId,
        amountPaid: record.amountPaid,
        paymentDate: record.paymentDate,
        monthPaidFor: record.monthPaidFor,
        paymentMethod: record.paymentMethod,
        reference: record.reference,
        createdAt: record.createdAt,
        tenantName: record.tenantName
      }));
      setPayments(mapped);
    } catch (error) {
      console.error('usePayments error', error);
    }
  };

  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      await loadPayments(user?.id);
      if (!mounted) setPayments([]);
      if (mounted) setLoading(false);
    };
    run();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const totalCollected = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);
  const tenantsPaidCount = new Set(payments.map((payment) => payment.tenantId)).size;

  const recordPayment = async (payment: Omit<Payment, 'id' | 'createdAt' | 'tenantName'>) => {
    try {
      const newPayment = await insertPayment(payment);
      await loadPayments(user?.id); // Refresh the list with the current user
      return { success: true, payment: newPayment };
    } catch (error) {
      console.error('recordPayment error', error);
      return { success: false, error };
    }
  };

  return { payments, totalCollected, tenantsPaidCount, recordPayment, refresh: loadPayments, loading };
};

export default usePayments;
