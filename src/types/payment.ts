export type Payment = {
  id: string;
  tenantId: string;
  unitId: string;
  amountPaid: number;
  paymentDate: string;
  monthPaidFor: string;
  paymentMethod?: string;
  reference?: string;
  createdAt: string;
  tenantName?: string;
};
