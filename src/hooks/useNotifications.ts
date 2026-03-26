import { useMemo } from 'react';
import type { Notification } from '../types/notification';

const useNotifications = () => {
  const notifications = useMemo<Notification[]>(
    () => [
      {
        id: 'n-1',
        userId: 'user-1',
        title: 'Rent reminder',
        message: 'Monthly rent reminder for Block A · Unit 1',
        type: 'reminder',
        read: false,
        createdAt: '2025-03-03T08:00:00Z'
      },
      {
        id: 'n-2',
        userId: 'user-1',
        title: 'Payment received',
        message: 'Payment processed for Nia Reed',
        type: 'payment',
        read: true,
        createdAt: '2025-03-01T10:45:00Z'
      },
      {
        id: 'n-3',
        userId: 'user-2',
        title: 'Profile updated',
        message: 'Ken Mboya updated contact information',
        type: 'info',
        read: false,
        createdAt: '2025-02-27T17:10:00Z'
      }
    ],
    []
  );

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.read).length, [
    notifications
  ]);

  return { notifications, unreadCount };
};

export default useNotifications;
