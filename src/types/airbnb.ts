export type AirbnbStatus = 'available' | 'occupied' | 'maintenance';

export type AirbnbListing = {
  id: string;
  unitName: string;
  location?: string;
  pricePerNight: number;
  status: AirbnbStatus;
  creatorId?: string;
  createdAt: string;
  roomNumbers?: string;
};
