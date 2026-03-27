import { useEffect, useRef } from 'react';
import useAuth from './useAuth';
import useTenants from './useTenants';
import { insertPayment, paymentExistsForMonth } from '../services/paymentService';

const useMonthlyRentReset = () => {
  const { user } = useAuth();
  const { tenants } = useTenants();
  const lastCheckedMonth = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const resetMonthlyRent = async () => {
      try {
        const currentDate = new Date();
        const currentMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM format

        // Skip if we've already checked this month
        if (lastCheckedMonth.current === currentMonth) return;
        lastCheckedMonth.current = currentMonth;

        // Get active tenants
        const activeTenants = tenants.filter(
          (tenant) => tenant.status === 'active' || tenant.status === 'late'
        );

        // Check which tenants need a payment entry for this month
        for (const tenant of activeTenants) {
          if (!tenant.moveInDate || !tenant.unitId) continue;

          const moveInDate = new Date(tenant.moveInDate);
          const moveInMonth = moveInDate.toISOString().slice(0, 7);

          // Skip if tenant hasn't moved in yet
          if (moveInMonth > currentMonth) continue;

          // Check if payment entry already exists for this tenant in current month
          const paymentExists = await paymentExistsForMonth(tenant.id, currentMonth);

          if (!paymentExists) {
            try {
              // Create a $0 payment entry for this month (arrears will be the full rent)
              await insertPayment({
                tenantId: tenant.id,
                unitId: tenant.unitId,
                amountPaid: 0,
                paymentDate: currentDate.toISOString().split('T')[0],
                monthPaidFor: currentMonth,
                paymentMethod: 'system',
                reference: 'Auto-generated monthly rent entry'
              });
            } catch (error) {
              console.error(`Failed to create payment entry for tenant ${tenant.id}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('useMonthlyRentReset error', error);
      }
    };

    resetMonthlyRent();

    // Check again at the start of each day in case month changed
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    const timer = setTimeout(resetMonthlyRent, timeUntilMidnight);

    return () => clearTimeout(timer);
  }, [user?.id, tenants]);
};

export default useMonthlyRentReset;
