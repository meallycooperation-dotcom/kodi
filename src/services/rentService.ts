import { apiRequest } from './api';

export const fetchPayments = () => apiRequest('/payments');
export const fetchArrears = () => apiRequest('/arrears');
