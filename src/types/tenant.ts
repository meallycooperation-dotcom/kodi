export type Tenant = {
  id: string;
  userId: string | null;
  unitId: string | null;
  fullName: string;
  phone?: string;
  email?: string;
  moveInDate?: string;
  status: 'active' | 'late' | 'vacant' | 'inactive';
  createdAt: string;
};
