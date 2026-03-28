export type AirbnbTenantStatus = 'booked' | 'checked_in' | 'checked_out' | 'cancelled';

export type AirbnbTenant = {
  id: string;
  userId?: string;
  airbnbId: string;
  fullName: string;
  phone?: string;
  email?: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount?: number;
  status: AirbnbTenantStatus;
  createdAt: string;
  roomNumber?: string;
};
