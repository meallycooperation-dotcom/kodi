import { apiRequest } from './api';
export const fetchNotifications = () => apiRequest('/notifications');
