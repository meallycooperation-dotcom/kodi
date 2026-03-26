import { useEffect, useRef, useState } from 'react';
import useAuth from './useAuth';
import { insertPayment, fetchPayments } from '../services/paymentService';
const PAGE_LIMIT = 10;
const usePayments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const cacheRef = useRef(new Map());
    const loadPayments = async (userId, options = {}) => {
        if (!userId) {
            setPayments([]);
            return;
        }
        if (!options.force) {
            const cached = cacheRef.current.get(userId);
            if (cached) {
                setPayments(cached);
                return;
            }
        }
        try {
            const records = await fetchPayments(userId, PAGE_LIMIT);
            const mapped = records.map((record) => ({
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
            cacheRef.current.set(userId, mapped);
            setPayments(mapped);
        }
        catch (error) {
            console.error('usePayments error', error);
        }
    };
    const { user } = useAuth();
    useEffect(() => {
        if (!user?.id) {
            setPayments([]);
            setLoading(false);
            return;
        }
        let mounted = true;
        const run = async () => {
            setLoading(true);
            await loadPayments(user.id);
            if (mounted) {
                setLoading(false);
            }
        };
        run();
        return () => {
            mounted = false;
        };
    }, [user?.id]);
    const totalCollected = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);
    const tenantsPaidCount = new Set(payments.map((payment) => payment.tenantId)).size;
    const recordPayment = async (payment) => {
        try {
            const newPayment = await insertPayment(payment);
            await loadPayments(user?.id, { force: true });
            return { success: true, payment: newPayment };
        }
        catch (error) {
            console.error('recordPayment error', error);
            return { success: false, error };
        }
    };
    const refresh = async () => {
        setLoading(true);
        await loadPayments(user?.id, { force: true });
        setLoading(false);
    };
    return { payments, totalCollected, tenantsPaidCount, recordPayment, refresh, loading };
};
export default usePayments;
