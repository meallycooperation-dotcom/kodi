export type Tenant = {
  id: string;
  userId: string | null;
  unitId: string | null;
  houseNumber?: string | null;
  fullName: string;
  phone?: string;
  email?: string;
  moveInDate?: string;
  status: 'active' | 'late' | 'vacant' | 'inactive';
  arrears?: number;
  createdAt: string;
};
