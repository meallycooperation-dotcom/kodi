import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Notification } from '../types/notification';
import { fetchNotifications, getCachedNotifications } from '../services/notificationService';
import useAuth from './useAuth';
import { useRealtimeRefresh } from './useRealtimeRefresh';

const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const cached = await getCachedNotifications(user.id);
      setNotifications(cached);
    } catch (error) {
      console.error('useNotifications cache error', error);
    }
    try {
      const data = await fetchNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('useNotifications error', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useRealtimeRefresh({
    enabled: Boolean(user?.id),
    channelName: `notifications:${user?.id ?? 'guest'}`,
    tables: [
      {
        table: 'notifications',
        filter: user?.id ? `creator_id=eq.${user.id}` : undefined
      }
    ],
    onChange: loadNotifications
  });

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const refresh = async () => {
    await loadNotifications();
  };

  return { notifications, unreadCount, loading, refresh };
};

export default useNotifications;
