import { useEffect, useState } from 'react';
import type { Payment } from '../types/payment';
import useAuth from './useAuth';
import { fetchApartmentPayments } from '../services/paymentService';

const useApartmentPayments = () => {
  const { user } = useAuth();
  const [apartmentPayments, setApartmentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadPayments = async () => {
      setLoading(true);
      if (!user?.id) {
        if (mounted) {
          setApartmentPayments([]);
          setLoading(false);
        }
        return;
      }

      try {
        const records = await fetchApartmentPayments(user.id);
        if (mounted) {
          setApartmentPayments(records);
        }
      } catch (error) {
        console.error('useApartmentPayments error', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPayments();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return { apartmentPayments, loading };
};

export default useApartmentPayments;
