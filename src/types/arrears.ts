export type Arrear = {
  id: string;
  tenantId: string;
  tenantName?: string;
  amountDue: number;
  month: string;
  status: 'unpaid' | 'partial' | 'overdue';
  createdAt: string;
};

export type TenantArrearBalance = {
  tenantId: string;
  tenantName: string;
  totalDue: number;
  months: string[];
};
