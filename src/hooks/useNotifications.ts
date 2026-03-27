import { useEffect, useMemo, useState } from 'react';
import type { Notification } from '../types/notification';
import { fetchNotifications } from '../services/notificationService';
import useAuth from './useAuth';

const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        const data = await fetchNotifications(user.id);
        setNotifications(data);
      } catch (error) {
        console.error('useNotifications error', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [user?.id]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const refresh = async () => {
    if (!user?.id) return;
    try {
      const data = await fetchNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('useNotifications refresh error', error);
    }
  };

  return { notifications, unreadCount, loading, refresh };
};

export default useNotifications;
