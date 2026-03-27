export type House = {
  id: string;
  unitId: string;
  houseNumber: string;
  status: 'vacant' | 'occupied' | 'maintenance';
  createdAt: string;
};
