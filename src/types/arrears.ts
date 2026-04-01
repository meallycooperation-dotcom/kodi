export type Arrear = {
  id: string;
  tenantId: string;
  unitId?: string;
  tenantName?: string;
  amountDue: number;
  totalExpectedRent: number;
  totalPaid: number;
  monthsStayed?: number;
  status: 'paid' | 'unpaid' | 'overdue';
  createdAt: string;
};

export type TenantArrearBalance = {
  tenantId: string;
  tenantName: string;
  totalExpectedRent: number;
  totalPaid: number;
  arrears: number;
  monthsStayed?: number;
  status: Arrear['status'];
};
