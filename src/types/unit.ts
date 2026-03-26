export type Unit = {
  id: string;
  propertyId: string | null;
  unitNumber: string;
  rentAmount: number;
  status: 'vacant' | 'occupied' | 'maintenance';
  numberOfHouses?: number;
  userId?: string;
  createdAt: string;
};
